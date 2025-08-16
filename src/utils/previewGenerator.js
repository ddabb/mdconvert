/**
 * previewGenerator.js - 生成HTML预览文件
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { generateFileName, ensureDirectoryExists } = require('./fileUtils');

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
    
    // 生成唯一的文件名
    // 如果有文件名前缀，使用 "文件名_模板名" 作为前缀，否则只使用模板名
    const prefix = options.fileNamePrefix 
      ? `${options.fileNamePrefix}_${options.template}` 
      : options.template;
    // 使用与PNG图片一致的命名方式
    const fileName = generateFileName(prefix, options.template, 'html');
    
    // 确保输出目录存在并按模板分类
    let outputDir = options.outputDir;
    
    // 如果没有指定不使用子文件夹，则创建与模板相关的输出目录
    if (options.noSubfolders !== true) {
      outputDir = path.resolve(options.outputDir, options.template);
      ensureDirectoryExists(outputDir);
      console.log(chalk.blue(`📁 为HTML预览创建模板目录: ${outputDir}`));
    }
    
    const outputPath = path.resolve(outputDir, fileName);
    
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

module.exports = {
  generateHtmlPreview,
  addPrintStyles
};