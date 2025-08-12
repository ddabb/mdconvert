/**
 * HTML转图片工具
 * 提供轻量级的HTML到图片转换方案
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { execSync, exec } = require('child_process');

/**
 * 注入Mermaid渲染脚本
 * @param {string} html HTML内容
 * @returns {string} 注入脚本后的HTML
 */
function injectMermaidRenderer(html) {
  // 注入在<body>标签后的脚本，确保在页面加载时立即执行
  const mermaidScript = `
<script>
  // 立即执行的Mermaid渲染函数
  (function() {
    // 确保mermaid已加载
    if (typeof mermaid === 'undefined') {
      console.error('Mermaid库未加载');
      return;
    }
    
    // 初始化mermaid
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default'
    });
    
    // 查找所有mermaid代码块并渲染
    document.querySelectorAll('pre code.language-mermaid').forEach(function(el) {
      try {
        // 创建一个div来放置渲染后的图表
        const div = document.createElement('div');
        div.className = 'mermaid';
        div.textContent = el.textContent;
        
        // 替换pre元素
        const pre = el.parentElement;
        pre.parentElement.replaceChild(div, pre);
        
        // 尝试渲染
        mermaid.init(undefined, div);
      } catch (e) {
        console.error('Mermaid渲染错误:', e);
      }
    });
  })();
</script>
`;

  // 在</body>前插入脚本
  return html.replace('</body>', `${mermaidScript}</body>`);
}

/**
 * 将HTML文件转换为图片
 * @param {string} htmlPath HTML文件路径
 * @param {Object} options 选项
 * @returns {Promise<string[]>} 生成的图片文件路径数组
 */
async function htmlToPng(htmlPath, options = {}) {
  // 默认选项
  const defaultOptions = {
    outputDir: path.join(path.dirname(htmlPath), 'images'),
    quality: 90,
    fullPage: true,
    prefix: 'page',
    splitSections: false,
    sectionSelector: 'h1, h2, h3',
    format: 'png', // 支持 'png', 'jpeg', 'webp', 'pdf'
    template: 'default',
    timeout: 60000, // 默认超时时间60秒
    autoSize: true, // 默认使用自动尺寸
    maxHeight: 15000, // 最大高度，超过此高度将自动分页
    outputFormats: [] // 额外的输出格式，例如 ['png', 'jpeg', 'webp', 'pdf']
  };

  // 合并选项
  const opts = { ...defaultOptions, ...options };
  
  // 如果指定了不使用子文件夹，则直接使用原始输出目录
  // 注意：当使用 --templates * 或多个模板时，默认不创建子文件夹
  if (opts.noSubfolders !== false) {
    // 直接使用原始输出目录
  } else {
    // 创建与模板相关的输出目录
    const templateDir = path.resolve(opts.outputDir, opts.template);
    opts.outputDir = templateDir;
  }
  
  // 确保输出目录存在
  try {
    if (!fs.existsSync(opts.outputDir)) {
      fs.mkdirSync(opts.outputDir, { recursive: true });
      console.log(chalk.blue(`📁 创建输出目录: ${opts.outputDir}`));
    }
  } catch (error) {
    console.error(chalk.red(`❌ 创建目录失败: ${error.message}`));
    // 如果创建目录失败，回退到原始输出目录
    opts.outputDir = path.resolve(opts.outputDir, '..');
    console.log(chalk.yellow(`⚠️ 回退到上级目录: ${opts.outputDir}`));
  }

  console.log(chalk.blue('🔍 准备转换HTML到图片...'));
  
  // 尝试使用node-html-to-image（如果已安装）
  try {
    const pngPaths = await convertWithNodeHtmlToImage(htmlPath, opts);
    return pngPaths;
  } catch (error) {
    console.log(chalk.yellow(`⚠️ 无法使用node-html-to-image: ${error.message}`));
    
    // 尝试使用html-pdf（如果已安装）
    try {
      const pngPaths = await convertWithHtmlPdf(htmlPath, opts);
      return pngPaths;
    } catch (error) {
      console.log(chalk.yellow(`⚠️ 无法使用html-pdf: ${error.message}`));
      
      // 生成HTML预览文件
      console.log(chalk.blue('📝 生成HTML预览文件...'));
      const previewPath = await generateHtmlPreview(htmlPath, opts);
      console.log(chalk.green(`✅ 已生成HTML预览文件: ${path.basename(previewPath)}`));
      console.log(chalk.yellow('⚠️ 提示: 要启用自动转换为图片功能，请安装以下NPM包之一:'));
      console.log(chalk.yellow('   - npm install node-html-to-image (推荐)'));
      console.log(chalk.yellow('   - npm install html-pdf'));
      
      return [previewPath];
    }
  }
}

/**
 * 使用node-html-to-image转换HTML到图片
 * @param {string} htmlPath HTML文件路径
 * @param {Object} options 选项
 * @returns {Promise<string[]>} 生成的图片文件路径数组
 */
async function convertWithNodeHtmlToImage(htmlPath, options) {
  try {
    const nodeHtmlToImage = require('node-html-to-image');
    console.log(chalk.blue('🚀 使用node-html-to-image转换...'));
    
    // 读取HTML内容
    let html = fs.readFileSync(htmlPath, 'utf8');
    
    // 注入Mermaid渲染脚本，确保在截图前渲染流程图
    html = injectMermaidRenderer(html);
    
    // 检查是否需要分页
    if (options.splitSections) {
      return await convertWithSplitSections(html, htmlPath, options);
    } else {
      // 检查是否指定了图片尺寸
      const useAutoSize = options.autoSize && (!options.width || !options.height);
      
      if (useAutoSize) {
        console.log(chalk.blue('📏 使用自动尺寸，根据内容确定图片大小'));
        return await convertWithAutoSize(html, htmlPath, options);
      } else {
        // 使用指定尺寸
        return await convertWithFixedSize(html, htmlPath, options);
      }
    }
  } catch (error) {
    console.error(chalk.red(`❌ node-html-to-image转换失败: ${error.message}`));
    throw error;
  }
}

/**
 * 使用自动尺寸转换HTML到图片
 * @param {string} html HTML内容
 * @param {string} htmlPath HTML文件路径
 * @param {Object} options 选项
 * @returns {Promise<string[]>} 生成的图片文件路径数组
 */
async function convertWithAutoSize(html, htmlPath, options) {
  const nodeHtmlToImage = require('node-html-to-image');
  
  // 准备输出路径
  const timestamp = new Date().getTime();
  // 如果有文件名前缀，使用 "文件名_模板名" 作为前缀，否则只使用模板名
  // 确保中文文件名能够正确保留
  const prefix = options.fileNamePrefix 
    ? `${options.fileNamePrefix}_${options.template}` 
    : options.template;
  
  // 输出调试信息
  console.log(chalk.blue(`📄 文件名前缀: ${options.fileNamePrefix || '未设置'}`));
  console.log(chalk.blue(`📄 使用的前缀: ${prefix}`));
  
  // 确保输出目录存在
  if (!fs.existsSync(options.outputDir)) {
    fs.mkdirSync(options.outputDir, { recursive: true });
  }
  
  // 主要输出格式
  const mainFormat = options.format || 'png';
  // 使用中文文件名
  const fileName = `${prefix}_${timestamp}.${mainFormat}`;
  const outputPath = path.resolve(options.outputDir, fileName);
  
  console.log(chalk.blue(`📄 将生成图片: ${fileName}`));
  
  // 准备额外的输出格式
  const outputPaths = [outputPath];
  const additionalFormats = Array.isArray(options.outputFormats) ? 
    options.outputFormats.filter(fmt => fmt !== mainFormat) : [];
  
  // 转换选项
  const convertOptions = {
    html,
    output: outputPath,
    type: options.format,
    quality: options.quality / 100,
    transparent: options.transparent,
    puppeteerArgs: {
      defaultViewport: null, // 设置为null，让Puppeteer自动确定视口大小
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
    waitUntil: 'networkidle0',
    timeout: options.timeout || 60000,
    puppeteerScript: `
      // 等待页面加载完成，使用传入的等待时间
      await page.waitForTimeout(${options.waitTime || 5000});
      
      // 执行自定义脚本来渲染Mermaid图表
      await page.evaluate(() => {
        // 确保mermaid已加载
        if (typeof mermaid !== 'undefined') {
          try {
            // 初始化mermaid
            mermaid.initialize({
              startOnLoad: true,
              theme: 'default'
            });
            
            // 查找所有mermaid代码块并渲染
            document.querySelectorAll('pre code.language-mermaid, .mermaid').forEach(function(el) {
              try {
                if (el.tagName === 'CODE') {
                  // 创建一个div来放置渲染后的图表
                  const div = document.createElement('div');
                  div.className = 'mermaid';
                  div.textContent = el.textContent;
                  
                  // 替换pre元素
                  const pre = el.parentElement;
                  pre.parentElement.replaceChild(div, pre);
                }
                
                // 尝试渲染
                mermaid.init(undefined, el);
              } catch (e) {
                console.error('Mermaid渲染错误:', e);
              }
            });
          } catch (e) {
            console.error('Mermaid初始化错误:', e);
          }
        }
      });
      
      // 获取页面内容的实际尺寸
      const dimensions = await page.evaluate(() => {
        return {
          width: Math.max(
            document.body.scrollWidth,
            document.documentElement.scrollWidth,
            document.body.offsetWidth,
            document.documentElement.offsetWidth,
            document.body.clientWidth,
            document.documentElement.clientWidth
          ),
          height: Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.offsetHeight,
            document.body.clientHeight,
            document.documentElement.clientHeight
          )
        };
      });
      
      // 设置视口大小为内容实际大小
      await page.setViewport({
        width: dimensions.width,
        height: dimensions.height,
        deviceScaleFactor: ${options.deviceScaleFactor || 2}
      });
      
      // 再次等待，确保渲染完成
      await page.waitForTimeout(2000);
    `
  };
  
  // 执行主格式转换
  await nodeHtmlToImage(convertOptions);
  console.log(chalk.green(`✅ 图片已生成: ${outputPath}`));
  
  // 处理额外的输出格式
  for (const format of additionalFormats) {
    const additionalFileName = `${prefix}_${timestamp}.${format}`;
    const additionalOutputPath = path.resolve(options.outputDir, additionalFileName);
    
    console.log(chalk.blue(`📄 将生成额外格式图片(${format}): ${additionalFileName}`));
    
    const additionalOptions = {
      ...convertOptions,
      output: additionalOutputPath,
      type: format
    };
    
    try {
      await nodeHtmlToImage(additionalOptions);
      console.log(chalk.green(`✅ 额外格式图片已生成: ${additionalOutputPath}`));
      outputPaths.push(additionalOutputPath);
    } catch (error) {
      console.error(chalk.red(`❌ 生成 ${format} 格式图片失败: ${error.message}`));
    }
  }
  
  return outputPaths;
}

/**
 * 使用固定尺寸转换HTML到图片
 * @param {string} html HTML内容
 * @param {string} htmlPath HTML文件路径
 * @param {Object} options 选项
 * @returns {Promise<string[]>} 生成的图片文件路径数组
 */
async function convertWithFixedSize(html, htmlPath, options) {
  const nodeHtmlToImage = require('node-html-to-image');
  
  // 准备输出路径
  const timestamp = new Date().getTime();
  // 如果有文件名前缀，使用 "文件名_模板名" 作为前缀，否则只使用模板名
  const prefix = options.fileNamePrefix 
    ? `${options.fileNamePrefix}_${options.template}` 
    : options.template;
  
  // 确保输出目录存在
  if (!fs.existsSync(options.outputDir)) {
    fs.mkdirSync(options.outputDir, { recursive: true });
  }
  
  // 主要输出格式
  const mainFormat = options.format || 'png';
  const fileName = `${prefix}_${timestamp}.${mainFormat}`;
  const outputPath = path.resolve(options.outputDir, fileName);
  
  console.log(chalk.blue(`📄 将生成图片: ${fileName}`));
  
  // 准备额外的输出格式
  const outputPaths = [outputPath];
  const additionalFormats = Array.isArray(options.outputFormats) ? 
    options.outputFormats.filter(fmt => fmt !== mainFormat) : [];
  
  // 转换选项
  const convertOptions = {
    html,
    output: outputPath,
    type: options.format,
    quality: options.quality / 100,
    transparent: options.transparent,
    puppeteerArgs: {
      defaultViewport: {
        width: options.width || 1200,
        height: options.height || 800,
        deviceScaleFactor: options.deviceScaleFactor || 2
      },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
    waitUntil: 'networkidle0',
    timeout: options.timeout || 60000,
    puppeteerScript: `
      // 等待页面加载完成，使用传入的等待时间
      await page.waitForTimeout(${options.waitTime || 5000});
      
      // 执行自定义脚本来渲染Mermaid图表
      await page.evaluate(() => {
        // 确保mermaid已加载
        if (typeof mermaid !== 'undefined') {
          try {
            // 初始化mermaid
            mermaid.initialize({
              startOnLoad: true,
              theme: 'default'
            });
            
            // 查找所有mermaid代码块并渲染
            document.querySelectorAll('pre code.language-mermaid, .mermaid').forEach(function(el) {
              try {
                if (el.tagName === 'CODE') {
                  // 创建一个div来放置渲染后的图表
                  const div = document.createElement('div');
                  div.className = 'mermaid';
                  div.textContent = el.textContent;
                  
                  // 替换pre元素
                  const pre = el.parentElement;
                  pre.parentElement.replaceChild(div, pre);
                }
                
                // 尝试渲染
                mermaid.init(undefined, el);
              } catch (e) {
                console.error('Mermaid渲染错误:', e);
              }
            });
          } catch (e) {
            console.error('Mermaid初始化错误:', e);
          }
        }
      });
      
      // 再次等待，确保渲染完成
      await page.waitForTimeout(2000);
    `
  };
  
  // 执行主格式转换
  await nodeHtmlToImage(convertOptions);
  console.log(chalk.green(`✅ 图片已生成: ${outputPath}`));
  
  // 处理额外的输出格式
  for (const format of additionalFormats) {
    const additionalFileName = `${prefix}_${timestamp}.${format}`;
    const additionalOutputPath = path.resolve(options.outputDir, additionalFileName);
    
    console.log(chalk.blue(`📄 将生成额外格式图片(${format}): ${additionalFileName}`));
    
    const additionalOptions = {
      ...convertOptions,
      output: additionalOutputPath,
      type: format
    };
    
    try {
      await nodeHtmlToImage(additionalOptions);
      console.log(chalk.green(`✅ 额外格式图片已生成: ${additionalOutputPath}`));
      outputPaths.push(additionalOutputPath);
    } catch (error) {
      console.error(chalk.red(`❌ 生成 ${format} 格式图片失败: ${error.message}`));
    }
  }
  
  return outputPaths;
}

/**
 * 按章节分割并转换HTML到多张图片
 * @param {string} html HTML内容
 * @param {string} htmlPath HTML文件路径
 * @param {Object} options 选项
 * @returns {Promise<string[]>} 生成的图片文件路径数组
 */
async function convertWithSplitSections(html, htmlPath, options) {
  const nodeHtmlToImage = require('node-html-to-image');
  const puppeteer = require('puppeteer');
  
  console.log(chalk.blue('📑 按章节分割生成多张图片...'));
  
  // 启动浏览器
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // 设置内容
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // 等待页面加载完成
    await page.waitForTimeout(options.waitTime || 5000);
    
    // 执行自定义脚本来渲染Mermaid图表
    await page.evaluate(() => {
      // 确保mermaid已加载
      if (typeof mermaid !== 'undefined') {
        try {
          // 初始化mermaid
          mermaid.initialize({
            startOnLoad: true,
            theme: 'default'
          });
          
          // 查找所有mermaid代码块并渲染
          document.querySelectorAll('pre code.language-mermaid, .mermaid').forEach(function(el) {
            try {
              if (el.tagName === 'CODE') {
                // 创建一个div来放置渲染后的图表
                const div = document.createElement('div');
                div.className = 'mermaid';
                div.textContent = el.textContent;
                
                // 替换pre元素
                const pre = el.parentElement;
                pre.parentElement.replaceChild(div, pre);
              }
              
              // 尝试渲染
              mermaid.init(undefined, el);
            } catch (e) {
              console.error('Mermaid渲染错误:', e);
            }
          });
        } catch (e) {
          console.error('Mermaid初始化错误:', e);
        }
      }
    });
    
    // 再次等待，确保渲染完成
    await page.waitForTimeout(2000);
    
    // 获取所有章节元素
    const sectionSelector = options.sectionSelector || 'h1, h2, h3';
    const sections = await page.$$eval(sectionSelector, (elements) => {
      return elements.map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          id: el.id || '',
          text: el.textContent,
          top: rect.top + window.scrollY
        };
      });
    });
    
    // 获取页面总高度
    const pageHeight = await page.evaluate(() => {
      return Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
        document.body.clientHeight,
        document.documentElement.clientHeight
      );
    });
    
    // 如果没有找到章节，则生成单张图片
    if (sections.length === 0) {
      await browser.close();
      return await convertWithAutoSize(html, htmlPath, options);
    }
    
    // 计算每个章节的范围
    const sectionRanges = [];
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const nextSection = sections[i + 1];
      const end = nextSection ? nextSection.top : pageHeight;
      
      sectionRanges.push({
        title: section.text,
        start: section.top,
        end: end
      });
    }
    
    // 生成每个章节的图片
    const outputPaths = [];
    for (let i = 0; i < sectionRanges.length; i++) {
      const range = sectionRanges[i];
      const sectionHeight = range.end - range.start;
      
      // 生成唯一的文件名，包含原始文件名（如果有）、模板名称、章节编号和时间戳
      const timestamp = new Date().getTime();
      // 如果有文件名前缀，使用 "文件名_模板名" 作为前缀，否则只使用模板名
      const prefix = options.fileNamePrefix 
        ? `${options.fileNamePrefix}_${options.template}` 
        : options.template;
      const fileName = `${prefix}_section${i+1}_${timestamp}.${options.format}`;
      const outputPath = path.resolve(options.outputDir, fileName);
      
      // 确保输出目录存在
      if (!fs.existsSync(path.dirname(outputPath))) {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      }
      
      console.log(chalk.blue(`📄 将生成章节图片: ${fileName}`));
      
      // 设置视口大小
      await page.setViewport({
        width: options.width || 1200,
        height: sectionHeight + 100, // 添加一些额外空间
        deviceScaleFactor: options.deviceScaleFactor || 2
      });
      
      // 滚动到章节开始位置
      await page.evaluate((start) => {
        window.scrollTo(0, start);
      }, range.start);
      
      // 等待滚动完成
      await page.waitForTimeout(500);
      
      // 截取当前视口
      await page.screenshot({
        path: outputPath,
        type: options.format,
        quality: options.quality,
        fullPage: false
      });
      
      console.log(chalk.green(`✅ 章节图片已生成: ${outputPath}`));
      outputPaths.push(outputPath);
    }
    
    await browser.close();
    return outputPaths;
  } catch (error) {
    await browser.close();
    console.error(chalk.red(`❌ 分割章节失败: ${error.message}`));
    // 如果分割失败，回退到自动尺寸模式
    return await convertWithAutoSize(html, htmlPath, options);
  }
}

/**
 * 使用html-pdf转换HTML到图片
 * @param {string} htmlPath HTML文件路径
 * @param {Object} options 选项
 * @returns {Promise<string[]>} 生成的图片文件路径数组
 */
async function convertWithHtmlPdf(htmlPath, options) {
  try {
    const htmlPdf = require('html-pdf');
    console.log(chalk.blue('🚀 使用html-pdf转换...'));
    
    // 读取HTML内容
    const html = fs.readFileSync(htmlPath, 'utf8');
    
    // 生成唯一的文件名，包含原始文件名（如果有）、模板名称和时间戳
    const timestamp = new Date().getTime();
    // 如果有文件名前缀，使用 "文件名_模板名" 作为前缀，否则只使用模板名
    const prefix = options.fileNamePrefix 
      ? `${options.fileNamePrefix}_${options.template}` 
      : options.template;
    // 使用简短的文件名，避免中文路径问题
    const fileName = `${prefix}_${timestamp}.${options.format === 'png' ? 'png' : 'pdf'}`;
    const outputPath = path.resolve(options.outputDir, fileName);
    
    // 确保输出目录存在
    if (!fs.existsSync(path.dirname(outputPath))) {
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    }
    
    console.log(chalk.blue(`📄 将生成图片: ${fileName}`));
    
    // 转换选项
    const pdfOptions = {
      format: 'A4',
      orientation: 'portrait',
      border: '10mm',
      type: options.format === 'png' ? 'png' : 'pdf',
      quality: options.quality / 100
    };
    
    // 执行转换
    return new Promise((resolve, reject) => {
      htmlPdf.create(html, pdfOptions).toFile(outputPath, (err, res) => {
        if (err) {
          reject(err);
          return;
        }
        
        console.log(chalk.green(`✅ 图片已生成: ${outputPath}`));
        resolve([outputPath]);
      });
    });
  } catch (error) {
    console.error(chalk.red(`❌ html-pdf模块加载失败: ${error.message}`));
    throw error;
  }
}

/**
 * 生成HTML预览文件
 * @param {string} htmlPath HTML文件路径
 * @param {Object} options 选项
 * @returns {Promise<string>} 生成的HTML预览文件路径
 */
async function generateHtmlPreview(htmlPath, options) {
  try {
    // 读取HTML内容
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // 创建增强版HTML（添加打印样式和提示）
    const enhancedHtml = addPrintStyles(htmlContent);
    
    // 生成唯一的文件名，包含原始文件名（如果有）、模板名称和时间戳
    const timestamp = new Date().getTime();
    // 如果有文件名前缀，使用 "文件名_模板名" 作为前缀，否则只使用模板名
    const prefix = options.fileNamePrefix 
      ? `${options.fileNamePrefix}_${options.template}` 
      : options.template;
    // 使用简短的文件名，避免中文路径问题
    const fileName = `${prefix}_preview_${timestamp}.html`;
    const outputPath = path.resolve(options.outputDir, fileName);
    
    // 确保输出目录存在
    if (!fs.existsSync(path.dirname(outputPath))) {
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    }
    
    console.log(chalk.blue(`📄 将生成预览文件: ${fileName}`));
    
    // 保存增强版HTML
    fs.writeFileSync(outputPath, enhancedHtml, 'utf8');
    
    return outputPath;
  } catch (error) {
    console.error(chalk.red(`❌ 生成HTML预览失败: ${error.message}`));
    throw error;
  }
}

/**
 * 添加打印样式和提示到HTML
 * @param {string} htmlContent HTML内容
 * @returns {string} 增强版HTML
 */
function addPrintStyles(htmlContent) {
  // 添加打印样式
  const printStyles = `
<style>
@media print {
  body {
    margin: 0;
    padding: 20px;
  }
  
  @page {
    size: A4;
    margin: 10mm;
  }
  
  .print-button, .print-message {
    display: none;
  }
}

.print-button {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  z-index: 1000;
}

.print-button:hover {
  background-color: #45a049;
}

.print-message {
  position: fixed;
  bottom: 20px;
  left: 0;
  right: 0;
  background-color: #f8f9fa;
  color: #333;
  text-align: center;
  padding: 10px;
  border-top: 1px solid #ddd;
  font-size: 14px;
  z-index: 1000;
}
</style>
<script>
function printPage() {
  window.print();
}
</script>
`;

  // 添加打印按钮和提示
  const printButton = `
<button class="print-button" onclick="printPage()">打印为PDF</button>
<div class="print-message">
  提示: 您可以使用浏览器的打印功能将此页面保存为PDF或图片。
  点击右上角的"打印"按钮，或按Ctrl+P (Windows) / Cmd+P (Mac)。
</div>
`;

  // 在</head>前插入打印样式
  let enhancedHtml = htmlContent.replace('</head>', `${printStyles}</head>`);
  
  // 在<body>后插入打印按钮
  enhancedHtml = enhancedHtml.replace('<body>', `<body>${printButton}`);
  
  return enhancedHtml;
}

module.exports = htmlToPng;