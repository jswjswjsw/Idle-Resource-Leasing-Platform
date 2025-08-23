#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 项目自动整理工具
 * 根据功能将文件自动分类到对应的文件夹
 */
class ProjectOrganizer {
    constructor() {
        this.rootPath = process.cwd();
        this.fileMapping = {
            // 前端文件
            'frontend': {
                patterns: [
                    /\.(jsx?|tsx?|css|scss|html)$/i,
                    /react|vue|angular/i,
                    /component|page|view/i
                ],
                subfolders: {
                    'components': /component/i,
                    'pages': /page|screen/i,
                    'services': /service|api/i,
                    'utils': /util|helper/i,
                    'styles': /\.(css|scss|less)$/i,
                    'assets': /\.(png|jpg|jpeg|gif|svg)$/i
                }
            },
            // 后端文件
            'backend': {
                patterns: [
                    /\.(js|ts)$/i,
                    /server|api|route|controller|model|middleware/i
                ],
                subfolders: {
                    'controllers': /controller/i,
                    'models': /model|schema/i,
                    'routes': /route/i,
                    'middleware': /middleware/i,
                    'services': /service/i,
                    'utils': /util|helper/i,
                    'config': /config|env/i
                }
            },
            // 数据库文件
            'database': {
                patterns: [
                    /\.(sql|prisma|mongo)$/i,
                    /database|db|migration|seed/i
                ],
                subfolders: {
                    'schemas': /schema|structure/i,
                    'migrations': /migration/i,
                    'seeds': /seed|data/i,
                    'queries': /query/i,
                    'config': /config/i
                }
            },
            // 第三方集成
            'third-party-integration': {
                patterns: [
                    /integration|api|service|oauth|payment/i,
                    /\.(config|wrapper|adapter)$/i
                ],
                subfolders: {
                    'apis': /api|service/i,
                    'adapters': /adapter|wrapper/i,
                    'config': /config/i,
                    'auth': /auth|oauth|login/i,
                    'payment': /payment|stripe|paypal/i
                }
            },
            // 测试文件
            'tests': {
                patterns: [
                    /\.(test|spec)\.(js|ts)$/i,
                    /test|spec|mock|fixture/i
                ],
                subfolders: {
                    'unit': /unit|test/i,
                    'integration': /integration|e2e/i,
                    'fixtures': /fixture|mock/i,
                    'utils': /util|helper/i
                }
            }
        };
    }

    /**
     * 整理项目文件
     */
    organizeProject() {
        console.log('开始整理项目结构...');
        
        // 创建必要的文件夹结构
        this.createFolderStructure();
        
        // 扫描并移动文件
        this.scanAndOrganizeFiles();
        
        // 连接接口
        this.connectInterfaces();
        
        console.log('项目整理完成✅');
    }

    /**
     * 创建文件夹结构
     */
    createFolderStructure() {
        Object.keys(this.fileMapping).forEach(mainFolder => {
            const mainPath = path.join(this.rootPath, mainFolder);
            
            if (!fs.existsSync(mainPath)) {
                fs.mkdirSync(mainPath, { recursive: true });
            }

            // 创建子文件夹
            Object.keys(this.fileMapping[mainFolder].subfolders).forEach(subfolder => {
                const subPath = path.join(mainPath, subfolder);
                if (!fs.existsSync(subPath)) {
                    fs.mkdirSync(subPath, { recursive: true });
                }
            });
        });
    }

    /**
     * 扫描并整理文件
     */
    scanAndOrganizeFiles() {
        const sourceDir = this.rootPath;
        const files = fs.readdirSync(sourceDir);

        files.forEach(file => {
            if (this.shouldIgnore(file)) return;

            const filePath = path.join(sourceDir, file);
            const stat = fs.statSync(filePath);

            if (stat.isFile()) {
                this.categorizeAndMoveFile(filePath);
            }
        });
    }

    /**
     * 判断是否应该忽略的文件
     */
    shouldIgnore(filename) {
        const ignorePatterns = [
            /^\./,           // 隐藏文件
            /^node_modules$/, // node_modules
            /^package\.json$/, // package.json
            /^package-lock\.json$/, // package-lock.json
            /^\.claude/,     // Claude配置文件
            /^requirement\.md$/, // 需求文档
            /^design\.md$/,   // 设计文档
            /^task-breakdown\.md$/ // 任务分解
        ];

        return ignorePatterns.some(pattern => pattern.test(filename));
    }

    /**
     * 分类并移动文件
     */
    categorizeAndMoveFile(filePath) {
        const filename = path.basename(filePath);
        const targetFolder = this.determineTargetFolder(filename);
        
        if (targetFolder) {
            const targetSubfolder = this.determineSubfolder(filename, targetFolder);
            const targetPath = path.join(this.rootPath, targetFolder, targetSubfolder, filename);
            
            // 确保目标目录存在
            fs.mkdirSync(path.dirname(targetPath), { recursive: true });
            
            // 移动文件
            fs.renameSync(filePath, targetPath);
            console.log(`移动文件: ${filename} → ${targetFolder}/${targetSubfolder}/`);
        }
    }

    /**
     * 确定目标主文件夹
     */
    determineTargetFolder(filename) {
        for (const [folder, config] of Object.entries(this.fileMapping)) {
            if (config.patterns.some(pattern => pattern.test(filename))) {
                return folder;
            }
        }
        
        // 默认分类规则
        if (/\.(js|ts|jsx|tsx)$/i.test(filename)) {
            return 'backend'; // 默认放到后端
        }
        
        return null;
    }

    /**
     * 确定子文件夹
     */
    determineSubfolder(filename, mainFolder) {
        const subfolders = this.fileMapping[mainFolder].subfolders;
        
        for (const [subfolder, pattern] of Object.entries(subfolders)) {
            if (pattern.test(filename)) {
                return subfolder;
            }
        }
        
        return 'misc'; // 默认子文件夹
    }

    /**
     * 连接接口
     */
    connectInterfaces() {
        console.log('正在连接各个接口...');
        
        // 创建接口配置文件
        this.createInterfaceConfigs();
        
        // 生成连接测试文件
        this.generateConnectionTests();
        
        console.log('接口连接完成✅');
    }

    /**
     * 创建接口配置
     */
    createInterfaceConfigs() {
        // 前端-后端接口配置
        const frontendConfig = {
            apiBaseUrl: 'http://localhost:3000/api',
            endpoints: {
                users: '/users',
                auth: '/auth',
                data: '/data'
            }
        };

        // 后端-数据库接口配置
        const backendConfig = {
            database: {
                type: 'postgresql',
                host: 'localhost',
                port: 5432,
                name: 'project_db'
            },
            orm: 'prisma'
        };

        // 第三方集成配置
        const integrationConfig = {
            services: {
                auth: 'oauth',
                payment: 'stripe',
                storage: 'aws-s3'
            }
        };

        // 写入配置文件
        fs.writeFileSync(
            path.join(this.rootPath, 'frontend', 'config', 'api.config.json'),
            JSON.stringify(frontendConfig, null, 2)
        );

        fs.writeFileSync(
            path.join(this.rootPath, 'backend', 'config', 'database.config.json'),
            JSON.stringify(backendConfig, null, 2)
        );

        fs.writeFileSync(
            path.join(this.rootPath, 'third-party-integration', 'config', 'services.config.json'),
            JSON.stringify(integrationConfig, null, 2)
        );
    }

    /**
     * 生成连接测试文件
     */
    generateConnectionTests() {
        const testContent = `
// 接口连接测试
const request = require('supertest');

// 测试前端-后端连接
describe('Frontend-Backend Connection', () => {
    test('should connect to backend API', async () => {
        // 测试代码
    });
});

// 测试后端-数据库连接
describe('Backend-Database Connection', () => {
    test('should connect to database', async () => {
        // 测试代码
    });
});

// 测试第三方集成
describe('Third-party Integration', () => {
    test('should connect to external services', async () => {
        // 测试代码
    });
});
`;

        fs.writeFileSync(
            path.join(this.rootPath, 'tests', 'integration', 'connection.test.js'),
            testContent.trim()
        );
    }
}

// 执行整理
if (require.main === module) {
    const organizer = new ProjectOrganizer();
    organizer.organizeProject();
}

module.exports = ProjectOrganizer;