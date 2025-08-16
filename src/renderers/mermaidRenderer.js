/**
 * mermaidRenderer.js - Mermaid图表渲染工具
 * 提供Mermaid图表的渲染功能
 */

/**
 * 注入Mermaid渲染脚本
 * @param {string} html HTML内容
 * @returns {string} 注入脚本后的HTML
 */
function injectMermaidRenderer(html) {
  // 注入在<body>标签后的脚本，确保在页面加载时立即执行
  const mermaidScript = `
<script>
  // 立即执行的Mermaid渲染函数
  (function() {
    // 确保mermaid已加载
    if (typeof mermaid === 'undefined') {
      console.error('Mermaid库未加载');
      return;
    }
    
    // 初始化mermaid
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default'
    });
    
    // 查找所有mermaid代码块并渲染
    document.querySelectorAll('pre code.language-mermaid').forEach(function(el) {
      try {
        // 创建一个div来放置渲染后的图表
        const div = document.createElement('div');
        div.className = 'mermaid';
        div.textContent = el.textContent;
        
        // 替换pre元素
        const pre = el.parentElement;
        pre.parentElement.replaceChild(div, pre);
        
        // 尝试渲染
        mermaid.init(undefined, div);
      } catch (e) {
        console.error('Mermaid渲染错误:', e);
      }
    });
  })();
</script>
`;

  // 在</body>前插入脚本
  return html.replace('</body>', `${mermaidScript}</body>`);
}

/**
 * 获取Puppeteer脚本用于渲染Mermaid图表
 * @param {number} waitTime 等待时间(毫秒)
 * @returns {string} Puppeteer脚本
 */
function getMermaidRenderScript(waitTime = 5000) {
  return `
    // 等待页面加载完成，使用传入的等待时间
    await page.waitForTimeout(${waitTime});
    
    // 执行自定义脚本来渲染Mermaid图表
    await page.evaluate(() => {
      // 确保mermaid已加载
      if (typeof mermaid !== 'undefined') {
        try {
          // 初始化mermaid
          mermaid.initialize({
            startOnLoad: true,
            theme: 'default'
          });
          
          // 查找所有mermaid代码块并渲染
          document.querySelectorAll('pre code.language-mermaid, .mermaid').forEach(function(el) {
            try {
              if (el.tagName === 'CODE') {
                // 创建一个div来放置渲染后的图表
                const div = document.createElement('div');
                div.className = 'mermaid';
                div.textContent = el.textContent;
                
                // 替换pre元素
                const pre = el.parentElement;
                pre.parentElement.replaceChild(div, pre);
              }
              
              // 尝试渲染
              mermaid.init(undefined, el);
            } catch (e) {
              console.error('Mermaid渲染错误:', e);
            }
          });
        } catch (e) {
          console.error('Mermaid初始化错误:', e);
        }
      }
    });
    
    // 再次等待，确保渲染完成
    await page.waitForTimeout(2000);
  `;
}

module.exports = {
  injectMermaidRenderer,
  getMermaidRenderScript
};