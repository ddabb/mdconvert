/**
 * HTML转图片工具
 * 提供轻量级的HTML到图片转换方案
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// 导入各个模块
const { injectMermaidRenderer } = require('./renderers/mermaidRenderer');
const { ensureDirectoryExists, getOutputDirectory } = require('./utils/fileUtils');
const { convertWithNodeHtmlToImage } = require('./converters/nodeHtmlToImageConverter');
const { convertWithHtmlPdf } = require('./converters/htmlPdfConverter');
const { generateHtmlPreview } = require('./utils/previewGenerator');

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
    outputFormats: [] // 额外的输出格式，例如 ['png', 'jpeg', 'webp', 'pdf']
  };

  // 合并选项
  const opts = { ...defaultOptions, ...options };
  
  // 确定输出目录
  if (opts.noSubfolders !== false) {
    // 直接使用原始输出目录
  } else {
    // 创建与模板相关的输出目录
    const templateDir = path.resolve(opts.outputDir, opts.template);
    opts.outputDir = templateDir;
  }
  
  // 确保输出目录存在
  try {
    if (!ensureDirectoryExists(opts.outputDir)) {
      // 如果创建目录失败，回退到原始输出目录
      opts.outputDir = path.resolve(opts.outputDir, '..');
      console.log(chalk.yellow(`⚠️ 回退到上级目录: ${opts.outputDir}`));
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

module.exports = htmlToPng;