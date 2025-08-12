# yyds_md2png

一个功能强大的 Markdown 转换工具，支持将 Markdown 文件转换为精美的 HTML 或 PNG 图片，内置多种样式模板（微信、抖音、小红书等）。

## 特性

- **多模板支持**：内置多种样式模板（默认、微信、抖音、小红书、手写体等）
- **高质量图片生成**：优化的图片生成流程，支持多种图片格式
- **智能分页**：自动检测内容尺寸，超长内容自动分页，或按章节分割
- **流程图支持**：完美支持 Mermaid 流程图、序列图、甘特图等
- **数学公式**：支持 KaTeX 数学公式渲染
- **批量处理**：支持批量处理整个目录的 Markdown 文件
- **交互式命令**：无参数运行时，自动询问是否处理当前目录下所有文件
- **高级定制**：支持代码高亮、目录生成、自定义 CSS/JS、透明背景等

## 安装

```bash
npm install -g yyds_md2png
```

### 国内用户安装说明

本工具依赖 Puppeteer 生成图片，国内用户可能会遇到 Chromium 下载失败的问题。我们已经配置了国内镜像源，但如果仍然遇到问题，可以尝试以下方法：

```bash
# 方法一：设置环境变量后再安装
# 针对 Puppeteer v19 以下版本
export PUPPETEER_DOWNLOAD_HOST=https://cdn.npmmirror.com/binaries

# 针对 Puppeteer v20 及以上版本
export PUPPETEER_DOWNLOAD_BASE_URL=https://cdn.npmmirror.com/binaries/chrome-for-testing

# 然后安装
npm install -g yyds_md2png

# 方法二：全局安装特定版本的 Puppeteer
# 安装 Puppeteer v19 版本
set PUPPETEER_DOWNLOAD_HOST=https://cdn.npmmirror.com/binaries && npm install -g puppeteer@19.11.1

# 安装 Puppeteer v20 及以上版本
set PUPPETEER_DOWNLOAD_BASE_URL=https://cdn.npmmirror.com/binaries/chrome-for-testing && npm install -g puppeteer@latest

# 然后安装本工具
npm install -g yyds_md2png

# 方法三：使用 cnpm 安装
npm install -g cnpm
cnpm install -g yyds_md2png
```

## 快速开始

### 基本用法

```bash
# 直接转换为 PNG 图片（默认行为）
yyds_md2png document.md

# 使用微信公众号模板
yyds_md2png document.md --template wechat

# 转换为 HTML
yyds_md2png document.md --to-html

# 无参数运行，将询问是否处理当前目录下所有 Markdown 文件
yyds_md2png
```

## 内置模板

yyds_md2png 提供了多种精心设计的模板，适用于不同场景和平台：

### 默认模板 (default)

现代简约风格，适合一般用途的文档展示。

- 清晰的层次结构
- 蓝色系标题
- 优化的代码块和表格样式
- 适合技术文档和一般内容

```bash
yyds_md2png document.md --template default
```

### 微信公众号模板 (wechat)

专为微信公众号设计，符合微信平台的视觉风格。

- 微信绿色作为主色调
- 标题下方添加装饰线
- 优化的引用块样式，带有引号装饰
- 适合在微信公众号发布的内容

```bash
yyds_md2png document.md --template wechat
```

### 抖音模板 (douyin)

深色背景配合抖音特有的红蓝配色，现代感强烈。

- 深色背景配合抖音标志性的红蓝配色
- 标题使用渐变色效果
- 高对比度设计
- 适合在抖音平台分享的内容

```bash
yyds_md2png document.md --template douyin
```

### 小红书模板 (xiaohongshu)

粉色系为主，符合小红书平台的温馨风格。

- 使用小红书特有的粉红色调
- 标题居中并添加下划线装饰
- 圆角设计元素
- 适合在小红书平台分享的内容

```bash
yyds_md2png document.md --template xiaohongshu
```

### 手写体模板 (handwriting)

模拟手写效果，适合展示诗歌、随笔等内容。

- 使用楷体风格字体
- 米黄色背景，模拟纸张质感
- 棕色系文字，模拟墨水颜色
- 虚线边框和装饰，增强手写感
- 适合展示诗歌、随笔、感悟等内容

```bash
yyds_md2png document.md --template handwriting
```

### 极简风格 (minimalist)

简约、留白、精致的排版，适合商务内容。

- 大量留白空间
- 简约的黑白配色，辅以少量强调色
- 精简的线条和边框
- 无衬线字体
- 适合展示商务报告或技术文档

```bash
yyds_md2png document.md --template minimalist
```

### 复古报纸风格 (vintage)

模拟老式报纸的排版和设计，怀旧感强。

- 米色或淡黄色背景，模拟旧纸张
- 衬线字体，增强古典感
- 装饰性分隔线和花边
- 适合展示新闻类或历史类内容

```bash
yyds_md2png document.md --template vintage
```

### 科技感风格 (tech)

现代、锐利的设计，适合科技主题。

- 深色背景（深蓝或黑色）
- 霓虹色调的强调色
- 几何线条和形状
- 代码风格的等宽字体
- 适合展示科技、编程或未来主题的内容

```bash
yyds_md2png document.md --template tech
```

### 自然风格 (nature)

温暖、有机的设计，适合环保或健康主题。

- 柔和的绿色或棕色调
- 有机形状和自然纹理
- 圆润的字体
- 装饰性植物或自然元素
- 适合展示环保、旅行或健康类内容

```bash
yyds_md2png document.md --template nature
```

### 儿童风格 (kids)

活泼、色彩丰富的设计，适合教育内容。

- 明亮、多彩的配色方案
- 圆润、可爱的字体
- 手绘风格的装饰元素
- 活泼的布局和间距
- 适合展示教育或儿童相关内容

```bash
yyds_md2png document.md --template kids
```

## 高级功能

```bash
# 生成目录
yyds_md2png document.md --toc

# 启用数学公式支持
yyds_md2png document.md --katex

# 设置渲染等待时间（对于复杂的 Mermaid 图表很有用）
yyds_md2png document.md --wait 5000

# 批量处理目录中的所有 Markdown 文件
yyds_md2png --batch ./docs

# 在浏览器中打开生成的 HTML 文件
yyds_md2png document.md --to-html --browser
```

## 图片转换选项

```bash
# 自动确定图片尺寸（根据内容）
yyds_md2png document.md --auto-size

# 按章节分割成多个 PNG 图片
yyds_md2png document.md --split-sections

# 自定义 PNG 图片尺寸和缩放
yyds_md2png document.md --png-width 1200 --png-height 800 --png-scale 2

# 设置图片最大高度，超过此高度将自动分页
yyds_md2png document.md --max-height 15000

# 使用透明背景
yyds_md2png document.md --transparent

# 使用不同图片格式
yyds_md2png document.md --format webp
```

## 命令行选项

```
选项:
  -V, --version                  输出版本号
  -t, --theme <theme>            设置主题 (light, dark) (默认: "light")
  --toc                          生成目录 (默认: false)
  -b, --batch <directory>        批量处理指定目录中的所有 Markdown 文件
  --template <template>          设置模板 (default, wechat, douyin, xiaohongshu等) (默认: "default")
  --css <file>                   使用自定义 CSS 文件
  --js <file>                    使用自定义 JavaScript 文件
  --mermaid-theme <theme>        设置 Mermaid 图表主题 (默认: "default")
  -k, --katex                    启用 KaTeX 数学公式支持 (默认: false)
  -o, --output <path>            指定输出文件路径
  --browser                      在浏览器中打开生成的 HTML 文件 (默认: false)
  --pre-render                   预渲染 Mermaid 图表 (默认: true)
  --no-pre-render                禁用 Mermaid 图表预渲染
  --wait <ms>                    等待页面渲染的时间（毫秒） (默认: "2000")
  --timeout <ms>                 渲染超时时间（毫秒） (默认: "60000")
  --no-save-svg                  不保存 SVG 文件到本地
  --svg-dir <directory>          指定保存 SVG 文件的目录 (默认: "mermaid-svg")
  --keep-code-blocks             保留 Mermaid 代码块 (默认: false)
  --list-templates               列出所有可用的模板
  --create-template <name>       创建新模板
  --template-author <author>     新模板的作者
  --template-desc <description>  新模板的描述
  
  # 转换相关选项
  --to-html                      将 Markdown 转换为 HTML 而不是 PNG 图片 (默认: false)
  --to-png                       将生成的 HTML 转换为 PNG 图片 (默认: true)
  --png-quality <quality>        PNG 图片质量(0-100) (默认: "90")
  --png-scale <scale>            设备缩放比例 (默认: "2")
  --png-width <width>            PNG 图片宽度
  --png-height <height>          PNG 图片高度
  --png-output <directory>       指定 PNG 输出目录
  --split-sections               按章节分割 PNG 图片 (默认: false)
  --section-selector <selector>  章节选择器 (默认: "h1, h2, h3")
  --auto-size                    自动确定图片尺寸（根据内容） (默认: true)
  --no-auto-size                 禁用自动尺寸
  --max-height <height>          图片最大高度，超过此高度将自动分页 (默认: "15000")
  --transparent                  使用透明背景（仅 PNG 格式有效） (默认: false)
  --format <format>              图片格式 (png, jpeg, webp) (默认: "png")
  --optimize                     优化图片大小 (默认: true)
  --no-optimize                  不优化图片大小
  --delete-html                  转换完成后删除 HTML 文件 (默认: false)
  
  # 元数据选项
  --author <author>              设置文档作者
  --description <description>    设置文档描述
  --keywords <keywords>          设置文档关键词，用逗号分隔
  -h, --help                     显示帮助信息
```

## 自定义模板

yyds_md2png 使用基于 CSS 的模板系统，您可以通过以下方式创建自己的模板：

### 方法一：使用命令行创建模板

```bash
yyds_md2png --create-template my-template --template-author "我的名字" --template-desc "我的自定义模板"
```

### 方法二：手动创建模板文件

在 `templates/styles` 目录下创建一个新的 CSS 文件，例如 `my-template.css`：

```css
/* 模板信息
 * 描述: 我的自定义模板
 * 作者: 我的名字
 * 版本: 1.0.0
 * 标签: 自定义, 简洁
 */

/* 自定义样式 */
body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f9f9f9;
}

h1, h2, h3, h4, h5, h6 {
  color: #0066cc;
}

/* 更多自定义样式... */
```

### 使用自定义模板

```bash
yyds_md2png document.md --template my-template
```

## 在代码中使用

您也可以在 Node.js 项目中直接使用 yyds_md2png：

```javascript
const { convertToPngDirect } = require('yyds_md2png');

async function convert() {
  const options = {
    template: 'wechat',
    waitTime: 5000,
    autoSize: true
  };
  
  const pngPaths = await convertToPngDirect('document.md', options);
  console.log(`生成的图片: ${pngPaths}`);
}

convert();
```

## 常见问题解答

### 流程图不显示？

增加渲染等待时间：`--wait 5000`

### 内容被截断？

使用自动尺寸选项：`--auto-size`

### 图片质量不佳？

增加质量和缩放比例：`--png-quality 95 --png-scale 2`

## 许可证

MIT