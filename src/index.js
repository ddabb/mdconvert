/**
 * yyds_md2png - Markdown转换工具
 * 支持多种样式模板，如微信、抖音、小红书等
 * 高可用的Markdown转PNG图片工具
 */

const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');
const hljs = require('highlight.js');
const chalk = require('chalk');
const templates = require('./templates');
const htmlToPng = require('./htmlToPng');

/**
 * 将Markdown文件转换为HTML
 * @param {string} filePath Markdown文件路径
 * @param {Object} options 选项
 * @returns {Promise<string>} 生成的HTML文件路径
 */
async function convertToHtml(filePath, options = {}) {
  // 默认选项
  const defaultOptions = {
    theme: 'light',
    template: 'default',
    toc: false,
    katex: false,
    mermaidTheme: 'default',
    preRender: true,
    waitTime: 2000,
    saveSvgFiles: true,
    keepCodeBlocks: false,
    svgDir: 'mermaid-svg',
    browser: false,
    customCss: null,
    customJs: null,
    meta: {
      author: '',
      description: '',
      keywords: ''
    }
  };

  // 合并选项
  const opts = { ...defaultOptions, ...options };

  try {
    console.log(chalk.blue(`🔍 处理Markdown文件: ${path.basename(filePath)}`));
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new Error(`文件 "${filePath}" 不存在`);
    }

    // 读取Markdown文件
    const mdContent = fs.readFileSync(filePath, 'utf8');

    // 创建Markdown解析器
    const md = createMarkdownParser(opts);

    // 渲染HTML内容
    let htmlContent = renderMarkdownContent(md, mdContent, opts);

    // 从Markdown文件中提取标题和元数据
    const { title, meta } = extractMetadata(mdContent, filePath);
    
    // 合并元数据
    opts.meta = { ...opts.meta, ...meta };

    // 创建HTML输出文件路径
    const htmlFilePath = options.output || path.join(
      path.dirname(filePath),
      path.basename(filePath, '.md') + '.html'
    );

    // 获取模板
    const templateName = opts.template;
    
    // 使用模板渲染HTML
    const fullHtml = templates.renderTemplate(templateName, { 
      title, 
      content: htmlContent, 
      options: opts, 
      filePath,
      meta: opts.meta,
      customCss: opts.customCss,
      customJs: opts.customJs,
      katex: opts.katex,
      mermaidTheme: opts.mermaidTheme
    });

    // 保存HTML文件
    fs.writeFileSync(htmlFilePath, fullHtml, 'utf8');
    console.log(chalk.green(`✅ HTML文件已生成：${htmlFilePath}`));

    // 在浏览器中打开HTML文件
    if (opts.browser) {
      const open = require('open');
      open(htmlFilePath);
      console.log(chalk.blue(`🌐 已在浏览器中打开HTML文件`));
    }

    return htmlFilePath;
  } catch (error) {
    console.error(chalk.red('❌ 处理文件时出错:'));
    if (error.code === 'ENOENT') {
      console.error(chalk.red(`找不到文件: "${filePath}"`));
    } else if (error.code === 'EISDIR') {
      console.error(chalk.red(`"${filePath}" 是一个目录，不是文件`));
    } else if (error.message.includes('markdown-it')) {
      console.error(chalk.red('Markdown解析错误，请检查Markdown语法'));
    } else {
      console.error(chalk.red(error.message));
    }
    throw error;
  }
}

/**
 * 创建Markdown解析器
 * @param {Object} options 选项
 * @returns {MarkdownIt} Markdown解析器实例
 */
function createMarkdownParser(options) {
  // 创建Markdown解析器
  const md = new MarkdownIt({
    html: true,
    breaks: true,
    linkify: true,
    typographer: true,
    tables: true,
    highlight: function (str, lang) {
      // 特殊处理Mermaid代码块
      if (lang === 'mermaid') {
        return `<div class="mermaid">${str}</div>`;
      }
      
      if (lang && hljs.getLanguage(lang)) {
        try {
          return '<pre class="hljs"><code>' +
                 hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                 '</code></pre>';
        } catch (__) {}
      }
      return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
    }
  });

  // 添加任务列表支持
  md.use(require('markdown-it-task-lists'), {
    enabled: true,
    disabled: false,
    label: true,
    labelAfter: false
  });

  // 添加目录支持
  if (options.toc) {
    md.use(require('markdown-it-anchor'), {
      permalink: true,
      permalinkSymbol: '§',
      slugify: s => encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, '-'))
    });
    md.use(require('markdown-it-toc-done-right'), {
      containerClass: 'toc-container',
      listType: 'ul',
      listClass: 'toc-list',
      itemClass: 'toc-item',
      linkClass: 'toc-link'
    });
  }

  // 添加KaTeX支持
  if (options.katex) {
    md.use(require('markdown-it-katex'));
  }

  return md;
}

/**
 * 渲染Markdown内容
 * @param {MarkdownIt} md Markdown解析器
 * @param {string} mdContent Markdown内容
 * @param {Object} options 选项
 * @returns {string} 渲染后的HTML内容
 */
function renderMarkdownContent(md, mdContent, options) {
  // 预处理Mermaid代码块，确保它们能被正确渲染
  mdContent = preprocessMermaidBlocks(mdContent);
  
  // 只有明确指定toc选项时才生成目录
  if (options.toc) {
    // 检查文档中是否已经包含了目录标记
    if (mdContent.includes('[[toc]]') || mdContent.includes('[TOC]')) {
      // 如果已经包含目录标记，直接渲染
      return md.render(mdContent);
    } else {
      // 如果没有目录标记，在文档开头添加目录
      // 尝试在标题和引言之后添加目录
      const lines = mdContent.split('\n');
      let tocInsertPosition = 0;
      
      // 查找第一个非标题、非引言的位置
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // 跳过标题行
        if (line.startsWith('# ')) {
          tocInsertPosition = i + 1;
          continue;
        }
        // 跳过引言
        if (line.startsWith('> ')) {
          tocInsertPosition = i + 1;
          continue;
        }
        // 找到第一个非空行且不是标题或引言的位置
        if (line && !line.startsWith('#') && !line.startsWith('>')) {
          tocInsertPosition = i;
          break;
        }
      }
      
      // 在适当位置插入目录标记
      lines.splice(tocInsertPosition, 0, '', '[[toc]]', '');
      return md.render(lines.join('\n'));
    }
  } else {
    // 不需要目录，直接渲染
    return md.render(mdContent);
  }
}

/**
 * 预处理Mermaid代码块
 * @param {string} mdContent Markdown内容
 * @returns {string} 处理后的Markdown内容
 */
function preprocessMermaidBlocks(mdContent) {
  // 查找所有Mermaid代码块
  const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
  
  // 替换为带有特殊标记的div，以便后续处理
  return mdContent.replace(mermaidRegex, (match, code) => {
    // 直接使用mermaid类，这样可以被mermaid.js自动识别
    return `<div class="mermaid">
${code}
</div>`;
  });
}

/**
 * 从Markdown内容中提取标题和元数据
 * @param {string} mdContent Markdown内容
 * @param {string} filePath 文件路径
 * @returns {Object} 标题和元数据
 */
function extractMetadata(mdContent, filePath) {
  // 默认使用文件名作为标题
  let title = path.basename(filePath, '.md');
  const meta = {};

  // 尝试从内容中提取H1标题
  const titleMatch = mdContent.match(/^# (.+)$/m);
  if (titleMatch) {
    title = titleMatch[1];
  }

  // 尝试提取YAML前置元数据
  const yamlMatch = mdContent.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (yamlMatch) {
    const yamlContent = yamlMatch[1];
    
    // 简单解析YAML
    const lines = yamlContent.split('\n');
    for (const line of lines) {
      const match = line.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        
        // 如果是标题，更新标题
        if (key.toLowerCase() === 'title') {
          title = value;
        }
        
        // 存储元数据
        meta[key] = value;
      }
    }
  }

  return { title, meta };
}

/**
 * 将HTML文件转换为PNG图片
 * @param {string} htmlPath HTML文件路径
 * @param {Object} options 选项
 * @returns {Promise<string[]>} 生成的PNG文件路径数组
 */
async function convertToPng(htmlPath, options = {}) {
  console.log(chalk.blue(`🖼️ 开始将HTML转换为图片: ${path.basename(htmlPath)}`));
  return htmlToPng(htmlPath, options);
}

/**
 * 批量处理目录中的所有Markdown文件
 * @param {string} dirPath 目录路径
 * @param {Object} options 选项
 * @returns {Promise<string[]>} 生成的HTML文件路径数组
 */
async function batchProcess(dirPath, options = {}) {
  try {
    console.log(chalk.blue(`📁 批量处理目录: ${dirPath}`));
    
    // 检查目录是否存在
    if (!fs.existsSync(dirPath)) {
      throw new Error(`目录 "${dirPath}" 不存在`);
    }

    // 获取目录中的所有文件
    const files = fs.readdirSync(dirPath);
    const mdFiles = files.filter(file => file.endsWith('.md'));

    if (mdFiles.length === 0) {
      console.log(chalk.yellow(`⚠️ 目录 "${dirPath}" 中没有Markdown文件`));
      return [];
    }

    console.log(chalk.blue(`📄 找到 ${mdFiles.length} 个Markdown文件`));

    // 处理每个Markdown文件
    const htmlPaths = [];
    let successCount = 0;
    let failCount = 0;
    
    for (const file of mdFiles) {
      const filePath = path.join(dirPath, file);
      try {
        const htmlPath = await convertToHtml(filePath, options);
        htmlPaths.push(htmlPath);
        successCount++;
      } catch (error) {
        console.error(chalk.red(`❌ 处理文件 "${file}" 时出错: ${error.message}`));
        failCount++;
      }
    }

    console.log(chalk.green(`✅ 批量处理完成: 成功 ${successCount} 个, 失败 ${failCount} 个`));
    return htmlPaths;
  } catch (error) {
    console.error(chalk.red(`❌ 批量处理目录时出错: ${error.message}`));
    throw error;
  }
}

/**
 * 直接将Markdown文件转换为PNG图片
 * @param {string} filePath Markdown文件路径
 * @param {Object} options 选项
 * @returns {Promise<string[]>} 生成的PNG文件路径数组
 */
async function convertToPngDirect(filePath, options = {}) {
  try {
    console.log(chalk.blue(`🚀 直接将Markdown转换为图片: ${path.basename(filePath)}`));
    
    // 先转换为HTML
    const htmlPath = await convertToHtml(filePath, options);
    
    // 再转换为PNG
    const pngOptions = {
      outputDir: options.pngOutput || path.join(path.dirname(filePath), 'images'),
      quality: options.pngQuality || 90,
      deviceScaleFactor: options.pngScale || 2,
      splitSections: options.splitSections || false,
      sectionSelector: options.sectionSelector || 'h1, h2, h3',
      width: options.pngWidth || 1200,
      height: options.pngHeight || 800,
      waitTime: options.waitTime || 2000,
      transparent: options.transparent || false,
      format: options.format || 'png',
      optimize: options.optimize !== false,
      template: options.template || 'default' // 传递模板名称
    };
    
    // 转换为PNG
    const pngPaths = await convertToPng(htmlPath, pngOptions);
    
    // 如果不需要保留HTML文件，则删除
    if (options.deleteHtml) {
      fs.unlinkSync(htmlPath);
      console.log(chalk.blue(`🗑️ 已删除临时HTML文件: ${path.basename(htmlPath)}`));
    }
    
    return pngPaths;
  } catch (error) {
    console.error(chalk.red(`❌ 直接转换为PNG时出错: ${error.message}`));
    throw error;
  }
}

/**
 * 批量将目录中的Markdown文件转换为PNG图片
 * @param {string} dirPath 目录路径
 * @param {Object} options 选项
 * @returns {Promise<string[]>} 生成的PNG文件路径数组
 */
async function batchConvertToPng(dirPath, options = {}) {
  try {
    console.log(chalk.blue(`📁 批量将目录中的Markdown转换为图片: ${dirPath}`));
    
    // 先批量转换为HTML
    const htmlPaths = await batchProcess(dirPath, options);
    
    if (htmlPaths.length === 0) {
      return [];
    }
    
    // 再批量转换为PNG
    const pngOptions = {
      outputDir: options.pngOutput || path.join(dirPath, 'images'),
      quality: options.pngQuality || 90,
      deviceScaleFactor: options.pngScale || 2,
      splitSections: options.splitSections || false,
      sectionSelector: options.sectionSelector || 'h1, h2, h3',
      width: options.pngWidth || 1200,
      height: options.pngHeight || 800,
      waitTime: options.waitTime || 2000,
      transparent: options.transparent || false,
      format: options.format || 'png',
      optimize: options.optimize !== false,
      template: options.template || 'default' // 传递模板名称
    };
    
    // 转换每个HTML文件为PNG
    const allPngPaths = [];
    for (const htmlPath of htmlPaths) {
      try {
        const pngPaths = await convertToPng(htmlPath, pngOptions);
        allPngPaths.push(...pngPaths);
        
        // 如果不需要保留HTML文件，则删除
        if (options.deleteHtml) {
          fs.unlinkSync(htmlPath);
        }
      } catch (error) {
        console.error(chalk.red(`❌ 转换HTML文件 "${htmlPath}" 为PNG时出错: ${error.message}`));
      }
    }
    
    console.log(chalk.green(`✅ 批量转换完成: 共生成 ${allPngPaths.length} 张图片`));
    return allPngPaths;
  } catch (error) {
    console.error(chalk.red(`❌ 批量转换为PNG时出错: ${error.message}`));
    throw error;
  }
}

module.exports = {
  convertToHtml,
  convertToPng,
  batchProcess,
  convertToPngDirect,
  batchConvertToPng
};
