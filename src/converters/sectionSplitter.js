/**
 * sectionSplitter.js - 按章节分割HTML并转换为图片
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const puppeteer = require('puppeteer');
const { generateFileName } = require('../utils/fileUtils');
const { convertWithAutoSize } = require('./htmlToImageConverter');

/**
 * 按章节分割并转换HTML到多张图片
 * @param {string} html HTML内容
 * @param {string} htmlPath HTML文件路径
 * @param {Object} options 选项
 * @returns {Promise<string[]>} 生成的图片文件路径数组
 */
async function convertWithSplitSections(html, htmlPath, options) {
  console.log(chalk.blue('📑 按章节分割生成多张图片...'));
  
  // 启动浏览器
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // 设置内容
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // 等待页面加载完成
    await page.waitForTimeout(options.waitTime || 5000);
    
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
    
    // 获取所有章节元素
    const sectionSelector = options.sectionSelector || 'h1, h2, h3';
    const sections = await page.$$eval(sectionSelector, (elements) => {
      return elements.map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          id: el.id || '',
          text: el.textContent,
          top: rect.top + window.scrollY
        };
      });
    });
    
    // 获取页面总高度
    const pageHeight = await page.evaluate(() => {
      return Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
        document.body.clientHeight,
        document.documentElement.clientHeight
      );
    });
    
    // 如果没有找到章节，则生成单张图片
    if (sections.length === 0) {
      await browser.close();
      return await convertWithAutoSize(html, htmlPath, options);
    }
    
    // 计算每个章节的范围
    const sectionRanges = [];
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const nextSection = sections[i + 1];
      const end = nextSection ? nextSection.top : pageHeight;
      
      sectionRanges.push({
        title: section.text,
        start: section.top,
        end: end
      });
    }
    
    // 生成每个章节的图片
    const outputPaths = [];
    for (let i = 0; i < sectionRanges.length; i++) {
      const range = sectionRanges[i];
      const sectionHeight = range.end - range.start;
      
      // 生成唯一的文件名
      // 如果有文件名前缀，使用 "文件名_模板名" 作为前缀，否则只使用模板名
      const prefix = options.fileNamePrefix 
        ? `${options.fileNamePrefix}_${options.template || 'default'}` 
        : (options.template || 'default');
      const fileName = generateFileName(prefix, options.template, options.format, i+1);
      const outputPath = path.resolve(options.outputDir, fileName);
      
      // 确保输出目录存在
      if (!fs.existsSync(path.dirname(outputPath))) {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      }
      
      console.log(chalk.blue(`📄 将生成章节图片: ${fileName}`));
      
      // 设置视口大小
      await page.setViewport({
        width: options.width || 1200,
        height: sectionHeight + 100, // 添加一些额外空间
        deviceScaleFactor: options.deviceScaleFactor || 2
      });
      
      // 滚动到章节开始位置
      await page.evaluate((start) => {
        window.scrollTo(0, start);
      }, range.start);
      
      // 等待滚动完成
      await page.waitForTimeout(500);
      
      // 截取当前视口
      await page.screenshot({
        path: outputPath,
        type: options.format,
        quality: options.quality,
        fullPage: false
      });
      
      console.log(chalk.green(`✅ 章节图片已生成: ${outputPath}`));
      outputPaths.push(outputPath);
    }
    
    await browser.close();
    return outputPaths;
  } catch (error) {
    await browser.close();
    console.error(chalk.red(`❌ 分割章节失败: ${error.message}`));
    // 如果分割失败，回退到自动尺寸模式
    return await convertWithAutoSize(html, htmlPath, options);
  }
}

module.exports = {
  convertWithSplitSections
};