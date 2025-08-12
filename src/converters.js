/**
 * converters.js - 转换器模块
 * 提供Markdown到HTML和HTML到PNG的转换功能
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { renderTemplate } = require('./templates');
const htmlToPng = require('./htmlToPng');
const { createMarkdownParser, renderMarkdownContent } = require('./markdownParser');
const { extractMetadata } = require('./metadataExtractor');

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
    const fullHtml = renderTemplate(templateName, { 
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
      template: options.template || 'default', // 传递模板名称
      fileNamePrefix: options.fileNamePrefix, // 传递文件名前缀
      noSubfolders: options.noSubfolders // 传递是否使用子文件夹的选项
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

module.exports = {
  convertToHtml,
  convertToPng,
  convertToPngDirect
};