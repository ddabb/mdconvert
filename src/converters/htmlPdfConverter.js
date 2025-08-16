/**
 * htmlPdfConverter.js - 使用html-pdf库进行HTML到PDF/图片的转换
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { generateFileName } = require('../utils/fileUtils');

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
    
    // 生成唯一的文件名
    // 如果有文件名前缀，使用 "文件名_模板名" 作为前缀，否则只使用模板名
    const prefix = options.fileNamePrefix 
      ? `${options.fileNamePrefix}_${options.template}` 
      : options.template;
    // 使用简短的文件名，避免中文路径问题
    const fileName = generateFileName(prefix, options.template, options.format === 'png' ? 'png' : 'pdf');
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

module.exports = {
  convertWithHtmlPdf
};