/**
 * metadataExtractor.js - 元数据提取模块
 * 从Markdown内容中提取标题和元数据
 */

const path = require('path');

/**
 * 从Markdown内容中提取标题和元数据
 * @param {string} mdContent Markdown内容
 * @param {string} filePath 文件路径
 * @returns {Object} 标题和元数据
 */
function extractMetadata(mdContent, filePath) {
  // 默认使用文件名作为标题
  let title = path.basename(filePath, '.md');
  const meta = {};

  // 尝试从内容中提取H1标题
  const titleMatch = mdContent.match(/^# (.+)$/m);
  if (titleMatch) {
    title = titleMatch[1];
  }

  // 尝试提取YAML前置元数据
  const yamlMatch = mdContent.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (yamlMatch) {
    const yamlContent = yamlMatch[1];
    
    // 简单解析YAML
    const lines = yamlContent.split('\n');
    for (const line of lines) {
      const match = line.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        
        // 如果是标题，更新标题
        if (key.toLowerCase() === 'title') {
          title = value;
        }
        
        // 存储元数据
        meta[key] = value;
      }
    }
  }

  return { title, meta };
}

module.exports = {
  extractMetadata
};