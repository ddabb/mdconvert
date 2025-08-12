/**
 * markdownParser.js - Markdown解析器模块
 * 提供Markdown解析和渲染功能
 */

const MarkdownIt = require('markdown-it');
const hljs = require('highlight.js');

/**
 * 创建Markdown解析器
 * @param {Object} options 选项
 * @returns {MarkdownIt} Markdown解析器实例
 */
function createMarkdownParser(options) {
  // 创建Markdown解析器
  const md = new MarkdownIt({
    html: true,
    breaks: true,
    linkify: true,
    typographer: true,
    tables: true,
    highlight: function (str, lang) {
      // 特殊处理Mermaid代码块
      if (lang === 'mermaid') {
        return `<div class="mermaid">${str}</div>`;
      }
      
      if (lang && hljs.getLanguage(lang)) {
        try {
          return '<pre class="hljs"><code>' +
                 hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                 '</code></pre>';
        } catch (__) {}
      }
      return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
    }
  });

  // 添加任务列表支持
  md.use(require('markdown-it-task-lists'), {
    enabled: true,
    disabled: false,
    label: true,
    labelAfter: false
  });

  // 添加目录支持
  if (options.toc) {
    md.use(require('markdown-it-anchor'), {
      permalink: true,
      permalinkSymbol: '§',
      slugify: s => encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, '-'))
    });
    md.use(require('markdown-it-toc-done-right'), {
      containerClass: 'toc-container',
      listType: 'ul',
      listClass: 'toc-list',
      itemClass: 'toc-item',
      linkClass: 'toc-link'
    });
  }

  // 添加KaTeX支持
  if (options.katex) {
    md.use(require('markdown-it-katex'));
  }

  return md;
}

/**
 * 渲染Markdown内容
 * @param {MarkdownIt} md Markdown解析器
 * @param {string} mdContent Markdown内容
 * @param {Object} options 选项
 * @returns {string} 渲染后的HTML内容
 */
function renderMarkdownContent(md, mdContent, options) {
  // 预处理Mermaid代码块，确保它们能被正确渲染
  mdContent = preprocessMermaidBlocks(mdContent);
  
  // 只有明确指定toc选项时才生成目录
  if (options.toc) {
    // 检查文档中是否已经包含了目录标记
    if (mdContent.includes('[[toc]]') || mdContent.includes('[TOC]')) {
      // 如果已经包含目录标记，直接渲染
      return md.render(mdContent);
    } else {
      // 如果没有目录标记，在文档开头添加目录
      // 尝试在标题和引言之后添加目录
      const lines = mdContent.split('\n');
      let tocInsertPosition = 0;
      
      // 查找第一个非标题、非引言的位置
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // 跳过标题行
        if (line.startsWith('# ')) {
          tocInsertPosition = i + 1;
          continue;
        }
        // 跳过引言
        if (line.startsWith('> ')) {
          tocInsertPosition = i + 1;
          continue;
        }
        // 找到第一个非空行且不是标题或引言的位置
        if (line && !line.startsWith('#') && !line.startsWith('>')) {
          tocInsertPosition = i;
          break;
        }
      }
      
      // 在适当位置插入目录标记
      lines.splice(tocInsertPosition, 0, '', '[[toc]]', '');
      return md.render(lines.join('\n'));
    }
  } else {
    // 不需要目录，直接渲染
    return md.render(mdContent);
  }
}

/**
 * 预处理Mermaid代码块
 * @param {string} mdContent Markdown内容
 * @returns {string} 处理后的Markdown内容
 */
function preprocessMermaidBlocks(mdContent) {
  // 查找所有Mermaid代码块
  const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
  
  // 替换为带有特殊标记的div，以便后续处理
  return mdContent.replace(mermaidRegex, (match, code) => {
    // 直接使用mermaid类，这样可以被mermaid.js自动识别
    return `<div class="mermaid">
${code}
</div>`;
  });
}

module.exports = {
  createMarkdownParser,
  renderMarkdownContent,
  preprocessMermaidBlocks
};