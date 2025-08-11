/**
 * 模板渲染器
 * 基于CSS样式文件的模板系统
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// 模板样式目录
const STYLES_DIR = path.join(__dirname, '../templates/styles');

/**
 * 渲染HTML模板
 * @param {string} templateName 模板名称
 * @param {Object} params 渲染参数
 * @param {string} params.title 文档标题
 * @param {string} params.content 渲染后的HTML内容
 * @param {Object} params.options 选项
 * @param {Object} params.meta 元数据
 * @returns {string} 完整的HTML
 */
function renderTemplate(templateName, params) {
  const { title, content, options = {}, meta = {} } = params;
  
  // 加载模板样式
  const cssContent = loadTemplateStyle(templateName);
  
  // 生成HTML
  return generateHTML(title, content, cssContent, options, meta);
}

/**
 * 加载模板样式
 * @param {string} templateName 模板名称
 * @returns {string} CSS内容
 */
function loadTemplateStyle(templateName) {
  try {
    const cssPath = path.join(STYLES_DIR, `${templateName}.css`);
    
    if (fs.existsSync(cssPath)) {
      return fs.readFileSync(cssPath, 'utf8');
    } else {
      console.warn(chalk.yellow(`⚠️ 模板样式 "${templateName}.css" 不存在，使用默认样式`));
      return fs.readFileSync(path.join(STYLES_DIR, 'default.css'), 'utf8');
    }
  } catch (error) {
    console.error(chalk.red(`❌ 加载模板样式失败:`), error.message);
    return '/* 默认样式 */\nbody { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }';
  }
}

/**
 * 生成完整的HTML
 * @param {string} title 标题
 * @param {string} content 内容
 * @param {string} cssContent CSS内容
 * @param {Object} options 选项
 * @param {Object} meta 元数据
 * @returns {string} 完整的HTML
 */
function generateHTML(title, content, cssContent, options, meta) {
  // 处理元数据
  const metaTags = `
    <meta name="author" content="${meta.author || ''}">
    <meta name="description" content="${meta.description || ''}">
    <meta name="keywords" content="${meta.keywords || ''}">
  `;
  
  // 处理自定义CSS
  const customCss = options.customCss ? `\n/* 用户自定义CSS */\n${options.customCss}` : '';
  
  // 根据模板名称添加特定的容器类
  let containerClass = '';
  let headerHtml = '';
  let footerHtml = '';
  let tagsHtml = '';
  
  // 处理小红书模板特殊元素
  if (cssContent.includes('.xhs-container')) {
    containerClass = 'xhs-container';
    
    // 生成小红书头部
    headerHtml = `
      <div class="xhs-header">
        <div class="xhs-user">
          <div class="xhs-avatar"></div>
          <div class="xhs-info">
            <div class="xhs-name">${meta.author || '小红书用户'}</div>
            <div class="xhs-date">${new Date().toLocaleDateString('zh-CN')}</div>
          </div>
        </div>
        <div class="xhs-follow-btn">关注</div>
      </div>
    `;
    
    // 生成小红书标签
    const tags = meta.keywords ? meta.keywords.split(',').map(tag => tag.trim()) : ['Markdown', '笔记', '分享'];
    tagsHtml = `
      <div class="xhs-tags">
        ${tags.map(tag => `<span class="xhs-tag">#${tag}</span>`).join(' ')}
      </div>
    `;
    
    // 生成小红书底部
    footerHtml = `
      <div class="xhs-actions">
        <div class="xhs-action">
          <div class="xhs-action-icon">❤️</div>
          <span>点赞</span>
        </div>
        <div class="xhs-action">
          <div class="xhs-action-icon">💬</div>
          <span>评论</span>
        </div>
        <div class="xhs-action">
          <div class="xhs-action-icon">🔖</div>
          <span>收藏</span>
        </div>
        <div class="xhs-action">
          <div class="xhs-action-icon">⤴️</div>
          <span>分享</span>
        </div>
      </div>
      
      <div class="xhs-footer">
        <p>—— 本文使用 MDConvert 生成 ——</p>
        <p>${meta.author ? `作者: ${meta.author}` : ''}</p>
      </div>
    `;
  }
  
  // 处理抖音模板特殊元素
  else if (cssContent.includes('.douyin-container')) {
    containerClass = 'douyin-container';
    
    // 生成抖音头部
    headerHtml = `
      <div class="douyin-header">
        <div class="douyin-avatar"></div>
        <div class="douyin-info">
          <div class="douyin-name">${meta.author || '抖音用户'}</div>
          <div class="douyin-date">${new Date().toLocaleDateString('zh-CN')}</div>
        </div>
        <div class="douyin-follow-btn">关注</div>
      </div>
      <div class="douyin-effect"></div>
    `;
    
    // 生成抖音标签
    const tags = meta.keywords ? meta.keywords.split(',').map(tag => tag.trim()) : ['Markdown', '笔记', '分享'];
    tagsHtml = `
      <div class="douyin-tags">
        ${tags.map(tag => `<span class="douyin-tag">#${tag}</span>`).join(' ')}
      </div>
    `;
    
    // 生成抖音底部
    footerHtml = `
      <div class="douyin-actions">
        <div class="douyin-action">
          <div class="douyin-action-icon">❤️</div>
          <span>点赞</span>
        </div>
        <div class="douyin-action">
          <div class="douyin-action-icon">💬</div>
          <span>评论</span>
        </div>
        <div class="douyin-action">
          <div class="douyin-action-icon">🔄</div>
          <span>转发</span>
        </div>
        <div class="douyin-action">
          <div class="douyin-action-icon">⭐</div>
          <span>收藏</span>
        </div>
      </div>
      
      <div class="douyin-footer">
        <p>—— 本文使用 MDConvert 生成 ——</p>
        <p>${meta.author ? `作者: ${meta.author}` : ''}</p>
      </div>
    `;
  }
  
  // 处理微信模板特殊元素
  else if (cssContent.includes('/* 微信公众号风格样式 */')) {
    // 微信模板不需要特殊容器
    
    // 生成微信底部
    footerHtml = `
      <div class="wechat-footer">
        <p>—— 本文使用 MDConvert 生成 ——</p>
        <p>${meta.author ? `作者: ${meta.author}` : ''}</p>
      </div>
    `;
  }
  
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
  
  ${options.katex ? `
  <!-- 添加KaTeX支持 -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.js"></script>
  ` : ''}
  
  <!-- 添加代码高亮样式 -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11.7.0/styles/github.min.css">
  
  <style>
    ${cssContent}
    ${customCss}
  </style>
</head>
<body>
  ${containerClass ? `<div class="${containerClass}">` : ''}
  ${headerHtml}
  
  <div class="${containerClass ? 'xhs-content' : containerClass === 'douyin-container' ? 'douyin-content' : ''}">
    <h1>${title}</h1>
    ${content}
    ${tagsHtml}
  </div>
  
  ${footerHtml}
  ${containerClass ? '</div>' : ''}
  
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
 * 获取可用模板列表
 * @returns {Array} 模板名称数组
 */
function getAvailableTemplates() {
  try {
    const files = fs.readdirSync(STYLES_DIR);
    return files
      .filter(file => file.endsWith('.css'))
      .map(file => path.basename(file, '.css'));
  } catch (error) {
    console.error(chalk.red(`❌ 获取模板列表失败:`), error.message);
    return ['default'];
  }
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
  renderTemplate,
  getAvailableTemplates,
  createTemplate
};