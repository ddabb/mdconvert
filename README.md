# yyds_md2png

一个功能强大的 Markdown 转换工具，支持将 Markdown 文件转换为精美的 HTML 或 PNG 图片，内置多种样式模板（微信、抖音、小红书等）。

> **1.0.7版本更新**：优化了所有CSS模板，使特定样式能够自动应用到Markdown转HTML生成的标准HTML元素上，无需添加特定类名。

## 特性

- **多模板支持**：内置多种样式模板（默认、微信、抖音、小红书、手写体等）
- **高质量图片生成**：优化的图片生成流程，支持多种图片格式
- **智能分页**：自动检测内容尺寸，超长内容自动分页，或按章节分割
- **流程图支持**：完美支持 Mermaid 流程图、序列图、甘特图等
- **数学公式**：支持 KaTeX 数学公式渲染
- **批量处理**：支持批量处理整个目录的 Markdown 文件
- **交互式命令**：无参数运行时，自动询问是否处理当前目录下所有文件
- **高级定制**：支持代码高亮、目录生成、自定义 CSS/JS、透明背景等
- **智能样式应用**：特定样式自动应用到Markdown转HTML生成的标准HTML元素上，无需添加特定类名

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

### 模板列表

| 分类 | 模板名称 | 模板代码 | 主要特点 | 适用场景 |
|------|---------|---------|---------|---------|
| **基础风格** | 默认模板 | default | 现代简约风格，蓝色系标题 | 技术文档和一般内容 |
| | 微信公众号模板 | wechat | 微信绿色主色调，装饰线 | 微信公众号内容 |
| | 抖音模板 | douyin | 深色背景，红蓝配色 | 抖音平台内容 |
| | 小红书模板 | xiaohongshu | 粉色系为主，圆角设计 | 小红书平台内容 |
| | 手写体模板 | handwriting | 楷体风格，纸张质感 | 诗歌、随笔、感悟 |
| **设计风格** | 极简风格 | minimalist | 大量留白，黑白配色 | 商务报告或技术文档 |
| | 复古报纸风格 | vintage | 旧纸张质感，衬线字体 | 新闻类或历史类内容 |
| | 科技感风格 | tech | 深色背景，霓虹色调 | 科技、编程内容 |
| | 自然风格 | nature | 绿色或棕色调，有机形状 | 环保、旅行或健康内容 |
| | 儿童风格 | kids | 明亮多彩，可爱字体 | 教育或儿童相关内容 |
| | 赛博朋克风格 | cyberpunk | 霓虹色彩，故障艺术效果 | 科幻内容、游戏相关 |
| | 中国传统风格 | chinese | 中国红、金色，传统纹样 | 中国传统文化、诗词 |
| | 电影海报风格 | movie | 大标题，高对比度 | 影评、电影介绍 |
| | 杂志风格 | magazine | 多栏布局，首字下沉 | 时尚、生活方式、访谈 |
| | 水墨画风格 | ink | 黑白灰色调，水墨晕染 | 艺术评论、哲学思考 |
| | 极简禅风格 | zen | 大量留白，极简线条 | 哲学内容、简约生活 |
| | 霓虹灯风格 | neon | 深色背景，发光文字 | 夜生活、音乐、娱乐 |
| | 像素艺术风格 | pixel_art | 像素化字体和边框 | 游戏相关、复古科技 |
| | 蒸汽朋克风格 | steampunk | 铜色、棕色、金色 | 复古科幻、机械主题 |
| | 波普艺术风格 | pop_art | 原色使用，点状半色调 | 现代艺术、时尚内容 |
| | 未来主义风格 | futurism | 斜线和动态线条 | 前卫科技、动态内容 |
| | 哥特风格 | gothic | 黑色和深紫色，神秘符号 | 恐怖、神秘或中世纪主题 |
| | 热带风格 | tropical | 鲜艳热带色彩，植物元素 | 旅游、度假相关内容 |
| | 北欧简约风格 | nordic | 极简配色，几何图形 | 家居、设计、简约生活 |
| | 波西米亚风格 | bohemian | 丰富图案，暖色调 | 艺术、多元文化内容 |
| | 食品菜单风格 | food_menu | 菜单排版，手写风格 | 美食、烹饪内容 |
| | 医疗健康风格 | medical | 蓝白配色，专业布局 | 健康、医疗相关内容 |
| | 校园笔记风格 | school_notes | 方格纸背景，手写注释 | 教育、学习内容 |
| | 电子邮件风格 | email | 邮件界面元素 | 商务通信内容 |
| | 社交媒体风格 | social_media | 社交平台界面元素 | 社交媒体内容分享 |
| | 航空旅行风格 | air_travel | 登机牌设计，航空元素 | 旅行、航空相关内容 |
| | 丧尸风格 | zombie | 绿色调，破损效果 | 恐怖、末日题材内容 |
| | 吸血鬼风格 | vampire | 深红色调，哥特元素 | 神秘、黑暗题材内容 |
| | 天堂风格 | heaven | 淡蓝色调，云朵元素 | 宗教、精神、平和内容 |
| **节日风格** | 春节风格 | spring_festival | 红色和金色，花朵符号 | 新年祝福、家庭团聚 |
| | 中秋节风格 | mid_autumn | 蓝紫色调，月亮符号 | 思乡、团圆、诗词 |
| | 国庆节风格 | national_day | 红色主调，金黄星星 | 爱国主题、历史回顾 |
| | 端午节风格 | dragon_boat | 绿色主调，清新自然 | 传统文化、健康养生 |
| | 元旦风格 | new_year | 蓝色主调，雪花元素 | 新年计划、总结展望 |

### 基础风格模板示例

#### 默认模板 (default)

```bash
yyds_md2png document.md --template default
```

#### 微信公众号模板 (wechat)

```bash
yyds_md2png document.md --template wechat
```

#### 抖音模板 (douyin)

```bash
yyds_md2png document.md --template douyin
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
yyds_md2png document.md --max-height 1123

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
  --max-height <height>          图片最大高度，超过此高度将自动分页 (默认: "1123")
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

yyds_md2png 使用基于 CSS 的模板系统，所有样式会自动应用到Markdown转HTML生成的标准HTML元素上，您可以通过以下方式创建自己的模板：

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

/* 特殊效果 - 使用伪元素自动应用于标准HTML元素 */
h1:after {
  content: "";
  display: block;
  width: 100px;
  height: 2px;
  background-color: #0066cc;
  margin-top: 10px;
}

/* 首字下沉效果 - 自动应用于第一段的首字母 */
p:first-of-type::first-letter {
  float: left;
  font-size: 3em;
  line-height: 0.8;
  margin-right: 0.1em;
  color: #0066cc;
}

/* 更多自定义样式... */
```

> **提示**：在创建自定义模板时，尽量使用标准HTML元素选择器（如h1, p, blockquote等）、伪元素（::before, ::after）和位置选择器（:first-of-type, :last-of-type等），这样样式就能自动应用到Markdown转HTML生成的元素上，无需添加特定类名。

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

### 特定样式没有应用？

从1.0.7版本开始，所有CSS模板已优化为自动应用样式到标准HTML元素，无需添加特定类名。如果您使用自定义模板，请参考上面的"自定义模板"部分，使用标准HTML元素选择器和伪元素。

## 许可证

MIT