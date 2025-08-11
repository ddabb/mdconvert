/**
 * 设置 Puppeteer 下载镜像
 * 这个脚本会在用户安装包时自动运行
 */
console.log('正在配置 Puppeteer 下载镜像...');

const fs = require('fs');
const path = require('path');
const os = require('os');

// 提示用户如何设置环境变量
console.log('\n===== Puppeteer 安装提示 =====');
console.log('如果您在安装 Puppeteer 时遇到问题，请尝试以下方法：');
console.log('\n方法一：设置环境变量后再安装 Puppeteer');
console.log('# 针对 Puppeteer v19 以下版本');
console.log('export PUPPETEER_DOWNLOAD_HOST=https://cdn.npmmirror.com/binaries');
console.log('\n# 针对 Puppeteer v20 及以上版本');
console.log('export PUPPETEER_DOWNLOAD_BASE_URL=https://cdn.npmmirror.com/binaries/chrome-for-testing');
console.log('\n方法二：在项目根目录创建 .npmrc 文件，添加以下内容：');
console.log('PUPPETEER_DOWNLOAD_HOST=https://cdn.npmmirror.com/binaries');
console.log('PUPPETEER_DOWNLOAD_BASE_URL=https://cdn.npmmirror.com/binaries/chrome-for-testing');
console.log('\n方法三：全局安装特定版本的 Puppeteer');
console.log('# 安装 Puppeteer v19 版本');
console.log('set PUPPETEER_DOWNLOAD_HOST=https://cdn.npmmirror.com/binaries && npm install -g puppeteer@19.11.1');
console.log('\n# 安装 Puppeteer v20 及以上版本');
console.log('set PUPPETEER_DOWNLOAD_BASE_URL=https://cdn.npmmirror.com/binaries/chrome-for-testing && npm install -g puppeteer@latest');

console.log('\n方法四：使用 cnpm 安装');
console.log('npm install -g cnpm');
console.log('cnpm install puppeteer');
console.log('===========================\n');

// 尝试在用户主目录创建或更新 .npmrc 文件
try {
  const userNpmrcPath = path.join(os.homedir(), '.npmrc');
  let npmrcContent = '';
  
  // 如果文件存在，读取内容
  if (fs.existsSync(userNpmrcPath)) {
    npmrcContent = fs.readFileSync(userNpmrcPath, 'utf8');
  }
  
  // 检查是否已经包含 Puppeteer 配置
  const hasPuppeteerConfig = npmrcContent.includes('PUPPETEER_DOWNLOAD_HOST') || 
                            npmrcContent.includes('PUPPETEER_DOWNLOAD_BASE_URL');
  
  // 如果没有配置，添加配置
  if (!hasPuppeteerConfig) {
    const newConfig = '\n# Puppeteer 国内镜像配置\n' +
                     'PUPPETEER_DOWNLOAD_HOST=https://cdn.npmmirror.com/binaries\n' +
                     'PUPPETEER_DOWNLOAD_BASE_URL=https://cdn.npmmirror.com/binaries/chrome-for-testing\n';
    
    fs.writeFileSync(userNpmrcPath, npmrcContent + newConfig);
    console.log(`已在 ${userNpmrcPath} 中添加 Puppeteer 国内镜像配置`);
  } else {
    console.log('您的 .npmrc 文件已包含 Puppeteer 配置');
  }
} catch (error) {
  console.log('无法更新 .npmrc 文件，请手动设置 Puppeteer 下载镜像');
  console.log(error.message);
}
