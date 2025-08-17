/**
 * fileUtils.js - 文件操作工具
 * 提供文件操作和路径处理的通用功能
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

/**
 * 确保目录存在，如果不存在则创建
 * @param {string} dirPath 目录路径
 * @returns {boolean} 是否成功创建或已存在
 */
function ensureDirectoryExists(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(chalk.blue(`📁 创建输出目录: ${dirPath}`));
    }
    return true;
  } catch (error) {
    console.error(chalk.red(`❌ 创建目录失败: ${error.message}`));
    return false;
  }
}

/**
 * 生成唯一的文件名
 * @param {string} prefix 文件名前缀
 * @param {string} template 模板名称
 * @param {string} format 文件格式
 * @param {string} [section] 章节标识（可选）
 * @returns {string} 生成的文件名
 */
function generateFileName(prefix, template, format, section = null) {
  const timestamp = new Date().getTime();
  const sectionPart = section !== null ? `_section${section}` : '';
  
  // 检查prefix是否已经包含template名称，避免重复
  if (prefix.endsWith(`_${template}`)) {
    return `${prefix}${sectionPart}_${timestamp}.${format}`;
  } else {
    return `${prefix}_${template}${sectionPart}_${timestamp}.${format}`;
  }
}

/**
 * 获取输出目录路径
 * @param {string} baseDir 基础目录
 * @param {string} template 模板名称
 * @param {boolean} noSubfolders 是否不使用子文件夹
 * @returns {string} 输出目录路径
 */
function getOutputDirectory(baseDir, template, noSubfolders = false) {
  if (noSubfolders) {
    return baseDir;
  }
  return path.resolve(baseDir, template);
}

/**
 * 保存文件内容
 * @param {string} filePath 文件路径
 * @param {string} content 文件内容
 * @returns {boolean} 是否成功保存
 */
function saveFile(filePath, content) {
  try {
    ensureDirectoryExists(path.dirname(filePath));
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(chalk.red(`❌ 保存文件失败: ${error.message}`));
    return false;
  }
}

module.exports = {
  ensureDirectoryExists,
  generateFileName,
  getOutputDirectory,
  saveFile
};