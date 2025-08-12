/**
 * batchProcessor.js - 批量处理模块
 * 提供批量处理Markdown文件的功能
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { convertToHtml, convertToPng } = require('./converters');

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
  batchProcess,
  batchConvertToPng
};