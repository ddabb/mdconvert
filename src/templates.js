/**
 * 模板管理模块
 * 基于CSS的模板系统，使不同模板主要通过CSS样式区分
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
  const { title, content, meta = {} } = params;
  const css = getTemplateCss(templateName);
  
  // 构建HTML
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
${css}
  </style>
`;

  // 添加自定义CSS
  if (params.customCss) {
    html += `  <style>
${params.customCss}
  </style>
`;
  }

  // 添加KaTeX支持
  if (params.katex) {
    html += `  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/contrib/auto-render.min.js" onload="renderMathInElement(document.body);"></script>
`;
  }

  // 添加Mermaid支持
  html += `  <script src="https://cdn.jsdelivr.net/npm/mermaid@11.9.0/dist/mermaid.min.js"></script>
  <script>
    // 立即初始化Mermaid，不等待DOMContentLoaded事件
    window.mermaid = window.mermaid || {};
    mermaid.initialize({
      startOnLoad: true,
      theme: '${params.mermaidTheme || 'default'}',
      securityLevel: 'loose'
    });
    
    // 确保在DOMContentLoaded后再次尝试渲染
    document.addEventListener('DOMContentLoaded', function() {
      // 查找所有未渲染的mermaid图表
      document.querySelectorAll('.mermaid:not(svg), pre code.language-mermaid').forEach(function(el) {
        try {
          if (el.tagName === 'CODE') {
            // 创建一个div来放置渲染后的图表
            const div = document.createElement('div');
            div.className = 'mermaid';
            div.textContent = el.textContent;
            
            // 替换pre元素
            const pre = el.parentElement;
            pre.parentElement.replaceChild(div, pre);
            
            // 尝试渲染
            mermaid.init(undefined, div);
          } else {
            mermaid.init(undefined, el);
          }
        } catch (e) {
          console.error('Mermaid渲染错误:', e);
        }
      });
    });
  </script>
`;

  // 添加自定义JavaScript
  if (params.customJs) {
    html += `  <script>
${params.customJs}
  </script>
`;
  }

  html += `</head>
<body>
`;

  // 添加元数据
  if (meta.author || meta.keywords || meta.description) {
    html += `  <div class="metadata">
`;
    if (meta.author) {
      html += `    <div class="author">作者: ${meta.author}</div>
`;
    }
    if (meta.keywords) {
      html += `    <div class="keywords">关键词: ${meta.keywords}</div>
`;
    }
    if (meta.description) {
      html += `    <div class="description">${meta.description}</div>
`;
    }
    html += `  </div>
`;
  }

  // 添加内容
  html += content;

  html += `</body>
</html>`;

  return html;
}

module.exports = {
  getAvailableTemplates,
  renderTemplate,
  getTemplateCss
};