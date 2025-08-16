/**
 * nodeHtmlToImageConverter.js - 使用node-html-to-image库进行HTML到图片的转换
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { injectMermaidRenderer, getMermaidRenderScript } = require('../renderers/mermaidRenderer');
const { ensureDirectoryExists, generateFileName, getOutputDirectory } = require('../utils/fileUtils');

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
  // 如果有文件名前缀，使用 "文件名_模板名" 作为前缀，否则只使用模板名
  const prefix = options.fileNamePrefix 
    ? `${options.fileNamePrefix}_${options.template}` 
    : options.template;
  
  // 输出调试信息
  console.log(chalk.blue(`📄 文件名前缀: ${options.fileNamePrefix || '未设置'}`));
  console.log(chalk.blue(`📄 使用的前缀: ${prefix}`));
  
  // 确保输出目录存在
  ensureDirectoryExists(options.outputDir);
  
  // 主要输出格式
  const mainFormat = options.format || 'png';
  // 生成文件名
  const fileName = generateFileName(prefix, options.template, mainFormat);
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
      
      ${getMermaidRenderScript(options.waitTime)}
      
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
    const additionalFileName = generateFileName(prefix, options.template, format);
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
  // 如果有文件名前缀，使用 "文件名_模板名" 作为前缀，否则只使用模板名
  const prefix = options.fileNamePrefix 
    ? `${options.fileNamePrefix}_${options.template}` 
    : (options.template || 'default');
  
  // 确保输出目录存在
  ensureDirectoryExists(options.outputDir);
  
  // 主要输出格式
  const mainFormat = options.format || 'png';
  const fileName = generateFileName(prefix, options.template, mainFormat);
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
      
      ${getMermaidRenderScript(options.waitTime)}
      
      // 再次等待，确保渲染完成
      await page.waitForTimeout(2000);
    `
  };
  
  // 执行主格式转换
  await nodeHtmlToImage(convertOptions);
  console.log(chalk.green(`✅ 图片已生成: ${outputPath}`));
  
  // 处理额外的输出格式
  for (const format of additionalFormats) {
    const additionalFileName = generateFileName(prefix, options.template, format);
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

module.exports = {
  convertWithNodeHtmlToImage,
  convertWithAutoSize,
  convertWithFixedSize
};