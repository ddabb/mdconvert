/**
 * outputFormatHandler.js - 处理不同输出格式的逻辑
 */

const path = require('path');
const chalk = require('chalk');
const { generateFileName } = require('./fileUtils');

/**
 * 处理多格式输出
 * @param {Function} convertFunction 转换函数
 * @param {Object} baseOptions 基本选项
 * @param {string} mainOutputPath 主输出路径
 * @param {Array<string>} additionalFormats 额外的输出格式
 * @returns {Promise<Array<string>>} 所有输出路径
 */
async function handleMultipleFormats(convertFunction, baseOptions, mainOutputPath, additionalFormats) {
  const outputPaths = [mainOutputPath];
  
  // 处理额外的输出格式
  for (const format of additionalFormats) {
    const prefix = baseOptions.fileNamePrefix 
      ? `${baseOptions.fileNamePrefix}_${baseOptions.template}` 
      : (baseOptions.template || 'default');
    
    const additionalFileName = generateFileName(prefix, baseOptions.template, format);
    const additionalOutputPath = path.resolve(baseOptions.outputDir, additionalFileName);
    
    console.log(chalk.blue(`📄 将生成额外格式图片(${format}): ${additionalFileName}`));
    
    const additionalOptions = {
      ...baseOptions,
      format: format
    };
    
    try {
      const result = await convertFunction(additionalOptions, additionalOutputPath);
      console.log(chalk.green(`✅ 额外格式图片已生成: ${additionalOutputPath}`));
      outputPaths.push(additionalOutputPath);
    } catch (error) {
      console.error(chalk.red(`❌ 生成 ${format} 格式图片失败: ${error.message}`));
    }
  }
  
  return outputPaths;
}

/**
 * 获取支持的输出格式
 * @returns {Array<string>} 支持的输出格式
 */
function getSupportedFormats() {
  return ['png', 'jpeg', 'webp', 'pdf'];
}

/**
 * 验证输出格式是否支持
 * @param {string} format 输出格式
 * @returns {boolean} 是否支持
 */
function isFormatSupported(format) {
  return getSupportedFormats().includes(format);
}

/**
 * 获取格式的MIME类型
 * @param {string} format 输出格式
 * @returns {string} MIME类型
 */
function getFormatMimeType(format) {
  const mimeTypes = {
    'png': 'image/png',
    'jpeg': 'image/jpeg',
    'jpg': 'image/jpeg',
    'webp': 'image/webp',
    'pdf': 'application/pdf',
    'html': 'text/html'
  };
  
  return mimeTypes[format] || 'application/octet-stream';
}

module.exports = {
  handleMultipleFormats,
  getSupportedFormats,
  isFormatSupported,
  getFormatMimeType
};