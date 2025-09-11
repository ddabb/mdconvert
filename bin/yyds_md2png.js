#!/usr/bin/env node

/**
 * yyds_md2png - 命令行工具
 * 将Markdown文件转换为HTML或PNG
 * 支持多种模板和高级转换选项
 */

const { program } = require('commander');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const readline = require('readline');
const { 
  convertToHtml, 
  convertToPng, 
  batchProcess, 
  convertToPngDirect,
  batchConvertToPng
} = require('../src/index');
const templates = require('../src/templates');
const packageJson = require('../package.json');

// 创建readline接口，用于交互式命令行
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

// 询问用户是否处理当前目录下的所有Markdown文件
async function askForBatchProcessing() {
  const rl = createReadlineInterface();
  
  return new Promise((resolve) => {
    rl.question(chalk.yellow('未指定Markdown文件，是否转换当前目录下的所有Markdown文件？(Y/N) '), (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

// 设置命令行选项
program
  .version(packageJson.version)
  .description('将Markdown文件转换为HTML或PNG，支持多种模板和高级转换选项')
  .argument('[markdown-file]', 'Markdown文件路径')
  .option('-t, --theme <theme>', '设置主题 (light, dark)', 'light')
  .option('--toc', '生成目录', false)
  .option('-b, --batch <directory>', '批量处理指定目录中的所有Markdown文件')
  .option('--template <template>', '设置模板 (default, wechat, douyin, xiaohongshu等)，使用 * 表示所有模板，使用 prefix_* 表示所有以prefix_开头的模板', 'default')
  .option('--subfolders', '为每个模板创建子文件夹')
  .option('--css <file>', '使用自定义CSS文件')
  .option('--js <file>', '使用自定义JavaScript文件')
  .option('--mermaid-theme <theme>', '设置Mermaid图表主题', 'default')
  .option('-k, --katex', '启用KaTeX数学公式支持', false)
  .option('-o, --output <path>', '指定输出文件路径')
  .option('--browser', '在浏览器中打开生成的HTML文件', false)
  .option('--pre-render', '预渲染Mermaid图表', true)
  .option('--no-pre-render', '禁用Mermaid图表预渲染')
  .option('--wait <ms>', '等待页面渲染的时间（毫秒）', '2000')
  .option('--timeout <ms>', '渲染超时时间（毫秒）', '60000')
  .option('--no-save-svg', '不保存SVG文件到本地')
  .option('--svg-dir <directory>', '指定保存SVG文件的目录', 'mermaid-svg')
  .option('--keep-code-blocks', '保留Mermaid代码块', false)
  .option('--list-templates', '列出所有可用的模板')
  .option('--create-template <name>', '创建新模板')
  .option('--template-author <author>', '新模板的作者')
  .option('--template-desc <description>', '新模板的描述')
  
  // 转换相关选项
  .option('--to-html', '将Markdown转换为HTML而不是PNG图片', false)
  .option('--to-png', '将生成的HTML转换为PNG图片', true)
  .option('--png-quality <quality>', 'PNG图片质量(0-100)', '100')
  .option('--png-scale <scale>', '设备缩放比例', '2')
  .option('--png-width <width>', 'PNG图片宽度', '595')
  .option('--png-height <height>', 'PNG图片高度', '842')
  .option('--png-output <directory>', '指定PNG输出目录')
  .option('--split-sections', '按章节分割PNG图片', false)
  .option('--section-selector <selector>', '章节选择器', 'h1, h2, h3')
  .option('--auto-size', '自动确定图片尺寸（根据内容）', true)
  .option('--no-auto-size', '禁用自动尺寸')
  .option('--transparent', '使用透明背景（仅PNG格式有效）', false)
  .option('--format <format>', '主要图片格式 (png, jpeg, webp, pdf)', 'png')
  .option('--output-formats <formats>', '额外输出格式，用逗号分隔 (例如: png,jpeg,webp,pdf)')
  .option('--optimize', '优化图片大小', true)
  .option('--no-optimize', '不优化图片大小')
  .option('--delete-html', '转换完成后删除HTML文件', false)
  
  // 元数据选项
  .option('--author <author>', '设置文档作者')
  .option('--description <description>', '设置文档描述')
  .option('--keywords <keywords>', '设置文档关键词，用逗号分隔');

// 解析命令行参数
program.parse(process.argv);

// 获取选项
const options = program.opts();
const markdownFile = program.args[0];

// 显示所有可用模板
if (options.listTemplates) {
  console.log(chalk.blue('📋 可用的模板:'));
  const availableTemplates = templates.getAvailableTemplates();
  
  Object.keys(availableTemplates).forEach(name => {
    const template = availableTemplates[name];
    console.log(chalk.green(`- ${name}: ${template.description}`));
    console.log(`  作者: ${template.author}, 版本: ${template.version}`);
    if (template.tags && template.tags.length > 0) {
      console.log(`  标签: ${template.tags.join(', ')}`);
    }
    console.log();
  });
  
  process.exit(0);
}

// 创建新模板
if (options.createTemplate) {
  const templateName = options.createTemplate;
  const templateData = {
    description: options.templateDesc || `${templateName}模板`,
    author: options.templateAuthor || '用户创建',
    version: '1.0.0',
    tags: ['自定义']
  };
  
  const success = templates.createTemplate(templateName, templateData);
  if (success) {
    console.log(chalk.green(`✅ 成功创建模板: ${templateName}`));
    console.log(chalk.blue(`📝 模板文件位置: ./templates/styles/${templateName}.css`));
    console.log(chalk.blue('您可以编辑此文件来自定义模板样式'));
  } else {
    console.error(chalk.red(`❌ 创建模板失败: ${templateName}`));
  }
  
  process.exit(success ? 0 : 1);
}

/**
 * 处理模板通配符
 * @param {string} templatePattern 模板模式，可以是具体模板名、*、prefix_*等
 * @param {Object} availableTemplates 可用模板对象
 * @returns {string[]} 匹配的模板名称数组
 */
function processTemplatePattern(templatePattern, availableTemplates) {
  // 如果是逗号分隔的多个模板，递归处理每个模板模式
  if (templatePattern.includes(',')) {
    const patterns = templatePattern.split(',').map(p => p.trim());
    const allTemplates = new Set();
    
    patterns.forEach(pattern => {
      const matchedTemplates = processTemplatePattern(pattern, availableTemplates);
      matchedTemplates.forEach(t => allTemplates.add(t));
    });
    
    return Array.from(allTemplates);
  }
  
  // 处理单个模板模式
  const pattern = templatePattern.trim();
  
  // 如果是 * 通配符，返回所有模板
  if (pattern === '*') {
    return Object.keys(availableTemplates);
  }
  
  // 如果是 prefix_* 形式的通配符，返回所有以prefix_开头的模板
  if (pattern.endsWith('*') && pattern !== '*') {
    const prefix = pattern.slice(0, -1); // 去掉末尾的 *
    return Object.keys(availableTemplates).filter(name => name.startsWith(prefix));
  }
  
  // 如果是具体模板名，检查是否存在
  if (availableTemplates[pattern]) {
    return [pattern];
  }
  
  // 如果模板不存在，返回默认模板
  console.error(chalk.yellow(`⚠️ 模板 ${pattern} 不存在，使用默认模板`));
  return ['default'];
}

// 主函数
async function main() {
  try {
    console.log(chalk.blue('🚀 yyds_md2png 开始处理...'));
    
    // 解析选项
    const convertOptions = {
      theme: options.theme,
      template: options.template,
      toc: options.toc,
      katex: options.katex,
      mermaidTheme: options.mermaidTheme,
      preRender: options.preRender,
      waitTime: parseInt(options.wait),
      saveSvgFiles: options.saveSvg,
      keepCodeBlocks: options.keepCodeBlocks,
      svgDir: options.svgDir,
      browser: options.browser,
      output: options.output,
      deleteHtml: options.deleteHtml,
      meta: {
        author: options.author || '',
        description: options.description || '',
        keywords: options.keywords || ''
      }
    };

    // 如果指定了自定义CSS文件
    if (options.css) {
      if (!fs.existsSync(options.css)) {
        console.error(chalk.red(`❌ 错误: CSS文件 "${options.css}" 不存在`));
        process.exit(1);
      }
      convertOptions.customCss = fs.readFileSync(options.css, 'utf8');
    }

    // 如果指定了自定义JavaScript文件
    if (options.js) {
      if (!fs.existsSync(options.js)) {
        console.error(chalk.red(`❌ 错误: JavaScript文件 "${options.js}" 不存在`));
        process.exit(1);
      }
      convertOptions.customJs = fs.readFileSync(options.js, 'utf8');
    }

    // PNG转换选项
    const pngOptions = {
      quality: parseInt(options.pngQuality), // 这是从命令行参数获取的质量值
      pngQuality: parseInt(options.pngQuality), // 添加这个以匹配命令行参数名
      deviceScaleFactor: parseFloat(options.pngScale),
      width: parseInt(options.pngWidth),
      height: parseInt(options.pngHeight),
      splitSections: options.splitSections,
      sectionSelector: options.sectionSelector,
      transparent: options.transparent,
      format: options.format,
      optimize: options.optimize,
      waitTime: parseInt(options.wait),
      timeout: parseInt(options.timeout),
      autoSize: options.autoSize,
      // 添加文件名前缀选项，用于生成图片文件名，保留原始中文文件名
      fileNamePrefix: markdownFile ? (() => {
        // 获取文件名（不含扩展名）
        const fileName = path.basename(markdownFile, '.md');
        console.log(chalk.blue(`📄 原始文件名: ${markdownFile}`));
        console.log(chalk.blue(`📄 提取的文件名: ${fileName}`));
        return fileName;
      })() : undefined,
      // 默认不使用子文件夹，除非明确指定了 --subfolders 选项
      noSubfolders: true
    };
    
    // 处理额外的输出格式
    if (options.outputFormats) {
      pngOptions.outputFormats = options.outputFormats.split(',').map(fmt => fmt.trim());
    }

    // 如果指定了PNG输出目录
    if (options.pngOutput) {
      pngOptions.outputDir = options.pngOutput;
    }

    // 合并PNG选项到转换选项
    Object.assign(convertOptions, pngOptions);

    // 获取可用模板
    const availableTemplates = templates.getAvailableTemplates();
    
    // 处理模板通配符
    const templateList = processTemplatePattern(options.template, availableTemplates);
    
    // 检查是否使用多个模板
    if (templateList.length > 1) {
      console.log(chalk.blue(`🎨 使用多个模板处理: ${templateList.join(' ')}`));
      
      // 存储所有生成的图片路径
      const allPngPaths = [];
      
      // 依次使用每个模板处理
      for (const template of templateList) {
        console.log(chalk.blue(`🖌️ 使用模板 "${template}" 处理...`));
        
        // 为当前模板创建选项副本
        const templateOptions = { ...convertOptions, template };
        
        // 根据不同的处理模式执行相应的操作
        if (options.toHtml) {
          // 只转换为HTML
          if (options.batch) {
            const htmlPaths = await batchProcess(options.batch, templateOptions);
            console.log(chalk.green(`✅ 使用模板 "${template}" 成功生成 ${htmlPaths.length} 个HTML文件`));
          } else {
            const htmlPath = await convertToHtml(markdownFile, templateOptions);
            console.log(chalk.green(`✅ 使用模板 "${template}" 成功生成HTML文件: ${htmlPath}`));
          }
        } else {
          // 默认行为：直接将Markdown转换为PNG
          if (options.batch) {
            // 批量处理
            const pngPaths = await batchConvertToPng(options.batch, templateOptions);
            console.log(chalk.green(`✅ 使用模板 "${template}" 成功生成 ${pngPaths.length} 张图片`));
            allPngPaths.push(...pngPaths);
          } else {
            // 单文件处理
            const pngPaths = await convertToPngDirect(markdownFile, templateOptions);
            console.log(chalk.green(`✅ 使用模板 "${template}" 成功生成 ${pngPaths.length} 张图片`));
            allPngPaths.push(...pngPaths);
          }
        }
      }
      
      // 显示所有生成的图片路径
      if (!options.toHtml && allPngPaths.length > 0) {
        console.log(chalk.green(`✅ 总共成功生成 ${allPngPaths.length} 张图片:`));
        allPngPaths.forEach(pngPath => {
          console.log(chalk.blue(`- ${pngPath}`));
        });
      }
    } else {
      // 使用单一模板
      convertOptions.template = templateList[0]; // 使用处理后的模板名称
      
      // 根据不同的处理模式执行相应的操作
      if (options.toHtml) {
        // 只转换为HTML
        if (options.batch) {
          await batchProcess(options.batch, convertOptions);
        } else {
          await convertToHtml(markdownFile, convertOptions);
        }
      } else {
        // 默认行为：直接将Markdown转换为PNG
        if (options.batch) {
          // 批量处理
          await batchConvertToPng(options.batch, convertOptions);
        } else {
          // 单文件处理
          const pngPaths = await convertToPngDirect(markdownFile, convertOptions);
          console.log(chalk.green(`✅ 成功生成 ${pngPaths.length} 张图片:`));
          pngPaths.forEach(pngPath => {
            console.log(chalk.blue(`- ${pngPath}`));
          });
        }
      }
    }
    
    console.log(chalk.green('🎉 处理完成!'));
  } catch (error) {
    console.error(chalk.red(`❌ 错误: ${error.message}`));
    process.exit(1);
  }
}

// 检查是否提供了Markdown文件或批处理目录
if (!markdownFile && !options.batch) {
  // 主函数包装器，处理交互式确认
  async function mainWrapper() {
    const shouldProcessCurrentDir = await askForBatchProcessing();
    
    if (shouldProcessCurrentDir) {
      console.log(chalk.blue('📁 将处理当前目录下的所有Markdown文件...'));
      options.batch = process.cwd(); // 设置批处理目录为当前目录
      await main();
    } else {
      console.log(chalk.yellow('❌ 已取消操作'));
      program.help();
    }
  }
  
  mainWrapper();
} else {
  // 直接执行主函数
  main();
}