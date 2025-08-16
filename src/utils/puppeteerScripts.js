/**
 * puppeteerScripts.js - Puppeteer相关脚本和配置
 */

/**
 * 获取页面尺寸检测脚本
 * @returns {string} 页面尺寸检测脚本
 */
function getPageDimensionsScript() {
  return `
    // 获取页面内容的实际尺寸
    const dimensions = await page.evaluate(() => {
      return {
        width: Math.max(
          document.body.scrollWidth,
          document.documentElement.scrollWidth,
          document.body.offsetWidth,
          document.documentElement.offsetWidth,
          document.body.clientWidth,
          document.documentElement.clientWidth
        ),
        height: Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.offsetHeight,
          document.body.clientHeight,
          document.documentElement.clientHeight
        )
      };
    });
  `;
}

/**
 * 获取自动尺寸设置脚本
 * @param {number} deviceScaleFactor 设备缩放因子
 * @returns {string} 自动尺寸设置脚本
 */
function getAutoSizeViewportScript(deviceScaleFactor = 2) {
  return `
    ${getPageDimensionsScript()}
    
    // 设置视口大小为内容实际大小
    await page.setViewport({
      width: dimensions.width,
      height: dimensions.height,
      deviceScaleFactor: ${deviceScaleFactor}
    });
  `;
}

/**
 * 获取固定尺寸设置脚本
 * @param {number} width 宽度
 * @param {number} height 高度
 * @param {number} deviceScaleFactor 设备缩放因子
 * @returns {string} 固定尺寸设置脚本
 */
function getFixedSizeViewportScript(width = 1200, height = 800, deviceScaleFactor = 2) {
  return `
    // 设置视口大小为固定尺寸
    await page.setViewport({
      width: ${width},
      height: ${height},
      deviceScaleFactor: ${deviceScaleFactor}
    });
  `;
}

/**
 * 获取等待渲染完成脚本
 * @param {number} waitTime 等待时间(毫秒)
 * @returns {string} 等待渲染完成脚本
 */
function getWaitForRenderScript(waitTime = 2000) {
  return `
    // 等待渲染完成
    await page.waitForTimeout(${waitTime});
  `;
}

module.exports = {
  getPageDimensionsScript,
  getAutoSizeViewportScript,
  getFixedSizeViewportScript,
  getWaitForRenderScript
};