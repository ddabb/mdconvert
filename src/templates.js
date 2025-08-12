/**
 * templates.js - 模板管理模块
 * 提供模板渲染和管理功能
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// 模板目录
const TEMPLATES_DIR = path.join(__dirname, '../templates');
const STYLES_DIR = path.join(TEMPLATES_DIR, 'styles');

// 确保目录存在
if (!fs.existsSync(STYLES_DIR)) {
  fs.mkdirSync(STYLES_DIR, { recursive: true });
}

/**
 * 获取可用模板列表
 * @returns {Object} 模板列表，键为模板名称，值为模板对象
 */
function getAvailableTemplates() {
  const templates = {};
  
  try {
    // 读取样式目录
    if (fs.existsSync(STYLES_DIR)) {
      const files = fs.readdirSync(STYLES_DIR);
      
      // 加载每个CSS模板
      files.forEach(file => {
        if (file.endsWith('.css')) {
          const templateName = path.basename(file, '.css');
          const cssPath = path.join(STYLES_DIR, file);
          
          // 读取CSS内容
          const cssContent = fs.readFileSync(cssPath, 'utf8');
          
          // 提取模板元数据（从CSS注释中）
          const metadata = extractMetadataFromCss(cssContent);
          
          templates[templateName] = {
            name: templateName,
            description: metadata.description || `${templateName}模板`,
            author: metadata.author || '未知',
            version: metadata.version || '1.0.0',
            tags: metadata.tags || [],
            cssPath: cssPath,
            cssContent: cssContent
          };
        }
      });
    }
  } catch (error) {
    console.error('读取模板目录失败:', error);
  }
  
  return templates;
}

/**
 * 从CSS注释中提取元数据
 * @param {string} cssContent CSS内容
 * @returns {Object} 元数据对象
 */
function extractMetadataFromCss(cssContent) {
  const metadata = {
    description: '',
    author: '',
    version: '',
    tags: []
  };
  
  // 查找元数据注释块
  const metadataMatch = cssContent.match(/\/\*\s*模板信息\s*([\s\S]*?)\*\//);
  
  if (metadataMatch && metadataMatch[1]) {
    const metadataContent = metadataMatch[1];
    
    // 提取描述
    const descMatch = metadataContent.match(/描述:\s*(.*)/);
    if (descMatch) metadata.description = descMatch[1].trim();
    
    // 提取作者
    const authorMatch = metadataContent.match(/作者:\s*(.*)/);
    if (authorMatch) metadata.author = authorMatch[1].trim();
    
    // 提取版本
    const versionMatch = metadataContent.match(/版本:\s*(.*)/);
    if (versionMatch) metadata.version = versionMatch[1].trim();
    
    // 提取标签
    const tagsMatch = metadataContent.match(/标签:\s*(.*)/);
    if (tagsMatch) metadata.tags = tagsMatch[1].split(',').map(tag => tag.trim());
  }
  
  return metadata;
}

/**
 * 获取模板CSS内容
 * @param {string} templateName 模板名称
 * @returns {string} CSS内容
 */
function getTemplateCss(templateName) {
  const templates = getAvailableTemplates();
  
  if (templates[templateName]) {
    return templates[templateName].cssContent;
  }
  
  // 如果找不到指定模板，返回默认模板
  console.error(chalk.yellow(`⚠️ 模板 ${templateName} 不存在，使用默认模板`));
  return templates.default ? templates.default.cssContent : '';
}

/**
 * 渲染HTML模板
 * @param {string} templateName 模板名称
 * @param {Object} params 渲染参数
 * @returns {string} 渲染后的HTML
 */
function renderTemplate(templateName, params) {
  const { title, content, options = {}, meta = {} } = params;
  const css = getTemplateCss(templateName);
  
  // 处理元数据
  const metaTags = `
    <meta name="author" content="${meta.author || ''}">
    <meta name="description" content="${meta.description || ''}">
    <meta name="keywords" content="${meta.keywords || ''}">
  `;
  
  // 处理自定义CSS
  const customCss = params.customCss ? `\n/* 用户自定义CSS */\n${params.customCss}` : '';
  
  // 构建HTML
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${metaTags}
  <title>${title}</title>
  
  <!-- 添加Mermaid支持 -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11.9.0/dist/mermaid.min.js"></script>
  
  ${params.katex ? `
  <!-- 添加KaTeX支持 -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.js"></script>
  ` : ''}
  
  <!-- 添加代码高亮样式 -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11.7.0/styles/github.min.css">
  
  <style>
    ${css}
    ${customCss}
  </style>
</head>
<body>
  <div class="markdown-content">
    ${content}
  </div>
  
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // 初始化Mermaid
      mermaid.initialize({
        startOnLoad: true,
        theme: '${options.theme === 'dark' ? 'dark' : 'default'}',
        securityLevel: 'loose',
        flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'linear' },
        fontSize: 14,
        fontFamily: 'sans-serif'
      });
      
      // 添加图片加载完成事件
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        img.addEventListener('load', function() {
          this.classList.add('loaded');
        });
        img.addEventListener('error', function() {
          this.classList.add('error');
          this.alt = '图片加载失败';
        });
      });
    });
  </script>
</body>
</html>
  `;
}

/**
 * 创建新模板
 * @param {string} templateName 模板名称
 * @param {string} cssContent CSS内容
 * @returns {boolean} 是否创建成功
 */
function createTemplate(templateName, cssContent) {
  try {
    if (!templateName.match(/^[a-zA-Z0-9_-]+$/)) {
      throw new Error('模板名称只能包含字母、数字、下划线和连字符');
    }
    
    const cssPath = path.join(STYLES_DIR, `${templateName}.css`);
    
    if (fs.existsSync(cssPath)) {
      throw new Error(`模板 "${templateName}" 已存在`);
    }
    
    fs.writeFileSync(cssPath, cssContent, 'utf8');
    console.log(chalk.green(`✅ 成功创建模板: ${templateName}`));
    return true;
  } catch (error) {
    console.error(chalk.red(`❌ 创建模板失败:`), error.message);
    return false;
  }
}

module.exports = {
  getAvailableTemplates,
  renderTemplate,
  getTemplateCss,
  createTemplate
};