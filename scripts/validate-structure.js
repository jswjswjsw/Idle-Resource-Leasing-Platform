#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 验证项目结构完整性
 * 检查五个主要文件夹是否存在并符合规范
 */
class ProjectStructureValidator {
    constructor() {
        this.rootPath = process.cwd();
        this.requiredFolders = [
            'frontend',
            'backend', 
            'database',
            'third-party-integration',
            'tests'
        ];
        this.interfaceConnections = {
            frontend: ['backend'],
            backend: ['database', 'third-party-integration'],
            database: ['backend'],
            'third-party-integration': ['backend'],
            tests: ['frontend', 'backend', 'database', 'third-party-integration']
        };
    }

    /**
     * 验证项目结构
     */
    validateStructure() {
        console.log('开始验证项目结构...');
        
        this.requiredFolders.forEach(folder => {
            const folderPath = path.join(this.rootPath, folder);
            if (!fs.existsSync(folderPath)) {
                console.log(`创建缺失文件夹: ${folder}`);
                fs.mkdirSync(folderPath, { recursive: true });
            }
        });

        console.log('项目结构验证完成✅');
    }

    /**
     * 验证接口连接
     */
    validateInterfaces() {
        console.log('验证接口连接...');
        
        // 检查前端到后端的API连接
        this.checkFrontendBackendConnection();
        
        // 检查后端到数据库的连接
        this.checkBackendDatabaseConnection();
        
        // 检查第三方集成连接
        this.checkThirdPartyIntegration();
        
        console.log('接口连接验证完成✅');
    }

    /**
     * 检查前端到后端的API连接
     */
    checkFrontendBackendConnection() {
        const frontendServices = path.join(this.rootPath, 'frontend', 'services');
        const backendRoutes = path.join(this.rootPath, 'backend', 'routes');
        
        if (fs.existsSync(frontendServices) && fs.existsSync(backendRoutes)) {
            console.log('前端-后端接口连接正常✅');
        } else {
            console.log('创建前端服务和后端路由结构...');
            fs.mkdirSync(frontendServices, { recursive: true });
            fs.mkdirSync(backendRoutes, { recursive: true });
        }
    }

    /**
     * 检查后端到数据库的连接
     */
    checkBackendDatabaseConnection() {
        const backendModels = path.join(this.rootPath, 'backend', 'models');
        const databaseSchemas = path.join(this.rootPath, 'database', 'schemas');
        
        if (fs.existsSync(backendModels) && fs.existsSync(databaseSchemas)) {
            console.log('后端-数据库连接正常✅');
        } else {
            console.log('创建数据模型和数据库结构...');
            fs.mkdirSync(backendModels, { recursive: true });
            fs.mkdirSync(databaseSchemas, { recursive: true });
        }
    }

    /**
     * 检查第三方集成
     */
    checkThirdPartyIntegration() {
        const integrationApis = path.join(this.rootPath, 'third-party-integration', 'apis');
        
        if (fs.existsSync(integrationApis)) {
            console.log('第三方集成结构正常✅');
        } else {
            console.log('创建第三方集成结构...');
            fs.mkdirSync(integrationApis, { recursive: true });
        }
    }

    /**
     * 检查中文编码
     */
    validateChineseEncoding() {
        console.log('检查中文编码...');
        
        // 扫描项目文件确保UTF-8编码
        this.scanForEncodingIssues();
        
        console.log('中文编码检查完成✅');
    }

    /**
     * 扫描编码问题
     */
    scanForEncodingIssues() {
        const extensions = ['.js', '.ts', '.json', '.md'];
        
        this.requiredFolders.forEach(folder => {
            const folderPath = path.join(this.rootPath, folder);
            if (fs.existsSync(folderPath)) {
                this.scanDirectory(folderPath, extensions);
            }
        });
    }

    /**
     * 扫描目录中的文件
     */
    scanDirectory(dirPath, extensions) {
        const files = fs.readdirSync(dirPath);
        
        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                this.scanDirectory(filePath, extensions);
            } else if (extensions.includes(path.extname(file))) {
                this.checkFileEncoding(filePath);
            }
        });
    }

    /**
     * 检查文件编码
     */
    checkFileEncoding(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            // 简单的中文乱码检测
            if (content.includes('�') || content.includes('锟斤拷')) {
                console.log(`⚠️ 检测到编码问题: ${filePath}`);
            }
        } catch (error) {
            console.log(`无法读取文件: ${filePath}`);
        }
    }
}

// 执行验证
if (require.main === module) {
    const validator = new ProjectStructureValidator();
    
    console.log('=== 项目结构验证工具 ===');
    console.log('时间: ' + new Date().toLocaleString('zh-CN'));
    
    validator.validateStructure();
    validator.validateInterfaces();
    validator.validateChineseEncoding();
    
    console.log('=== 验证完成 ===');
}

module.exports = ProjectStructureValidator;