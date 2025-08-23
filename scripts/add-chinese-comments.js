#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 自动添加中文注释工具
 * 为代码添加语句级别的中文注释
 */
class CommentGenerator {
    constructor() {
        this.rootPath = process.cwd();
        this.supportedExtensions = ['.js', '.ts', '.jsx', '.tsx'];
    }

    /**
     * 为文件添加注释
     */
    addCommentsToFile(filePath) {
        const ext = path.extname(filePath);
        if (!this.supportedExtensions.includes(ext)) {
            return;
        }

        const content = fs.readFileSync(filePath, 'utf8');
        const commentedContent = this.generateComments(content, ext);
        
        if (commentedContent !== content) {
            fs.writeFileSync(filePath, commentedContent, 'utf8');
            console.log(`已添加注释: ${path.relative(this.rootPath, filePath)}`);
        }
    }

    /**
     * 根据文件类型生成注释
     */
    generateComments(content, extension) {
        let lines = content.split('\n');
        let commentedLines = [];
        
        // 添加文件头注释
        if (!content.includes('文件名:')) {
            const fileName = path.basename(filePath);
            const header = this.generateFileHeader(fileName);
            commentedLines.push(header);
        }

        // 为每个函数和复杂语句添加注释
        lines.forEach(line => {
            const trimmedLine = line.trim();
            
            // 函数声明
            if (this.isFunctionDeclaration(trimmedLine)) {
                const funcComment = this.generateFunctionComment(trimmedLine);
                commentedLines.push(funcComment);
            }
            
            // 类声明
            if (this.isClassDeclaration(trimmedLine)) {
                const classComment = this.generateClassComment(trimmedLine);
                commentedLines.push(classComment);
            }
            
            commentedLines.push(line);
            
            // 复杂逻辑语句
            if (this.isComplexLogic(trimmedLine)) {
                const logicComment = this.generateLogicComment(trimmedLine);
                commentedLines.push(logicComment);
            }
        });

        return commentedLines.join('\n');
    }

    /**
     * 生成文件头注释
     */
    generateFileHeader(fileName) {
        return `/**
 * 文件名: ${fileName}
 * 功能描述: [请填写功能描述]
 * 创建时间: ${new Date().toLocaleString('zh-CN')}
 * 作者: Claude Code
 */

`;
    }

    /**
     * 生成函数注释
     */
    generateFunctionComment(line) {
        const funcName = this.extractFunctionName(line);
        return `    // 函数功能: ${funcName} - [功能描述]
    // 参数说明: [参数列表]
    // 返回值: [返回类型]
    // 使用场景: [使用场景]`;
    }

    /**
     * 生成类注释
     */
    generateClassComment(line) {
        const className = this.extractClassName(line);
        return `/**
 * 类功能: ${className} - [功能描述]
 * 主要属性: [属性列表]
 * 核心方法: [方法列表]
 * 设计模式: [设计模式]
 */`;
    }

    /**
     * 生成逻辑注释
     */
    generateLogicComment(line) {
        if (line.includes('if')) {
            return '    // 条件判断: [判断条件说明]';
        }
        if (line.includes('for')) {
            return '    // 循环处理: [循环目的说明]';
        }
        if (line.includes('return')) {
            return '    // 返回结果: [返回值说明]';
        }
        return '    // 处理逻辑: [功能说明]';
    }

    /**
     * 检查是否是函数声明
     */
    isFunctionDeclaration(line) {
        return line.includes('function') || 
               line.match(/\w+\s*\([^)]*\)\s*\{/);
    }

    /**
     * 检查是否是类声明
     */
    isClassDeclaration(line) {
        return line.includes('class');
    }

    /**
     * 检查是否是复杂逻辑
     */
    isComplexLogic(line) {
        return line.includes('if') || 
               line.includes('for') || 
               line.includes('while') ||
               line.includes('return') ||
               line.includes('try') ||
               line.includes('catch');
    }

    /**
     * 提取函数名
     */
    extractFunctionName(line) {
        const match = line.match(/function\s+(\w+)/) || 
                     line.match(/(\w+)\s*\([^)]*\)\s*\{/);
        return match ? match[1] : 'unnamed';
    }

    /**
     * 提取类名
     */
    extractClassName(line) {
        const match = line.match(/class\s+(\w+)/);
        return match ? match[1] : 'unnamed';
    }

    /**
     * 递归处理目录
     */
    processDirectory(dirPath) {
        if (!fs.existsSync(dirPath)) return;

        const files = fs.readdirSync(dirPath);
        
        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                this.processDirectory(filePath);
            } else {
                this.addCommentsToFile(filePath);
            }
        });
    }

    /**
     * 为整个项目添加注释
     */
    addCommentsToProject() {
        console.log('开始为项目添加中文注释...');
        
        const folders = ['frontend', 'backend', 'database', 'third-party-integration', 'tests'];
        
        folders.forEach(folder => {
            const folderPath = path.join(this.rootPath, folder);
            this.processDirectory(folderPath);
        });
        
        console.log('中文注释添加完成✅');
    }
}

// 执行注释添加
if (require.main === module) {
    const generator = new CommentGenerator();
    generator.addCommentsToProject();
}

module.exports = CommentGenerator;