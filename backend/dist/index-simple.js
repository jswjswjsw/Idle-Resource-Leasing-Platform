"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database"); // 统一Prisma实例
dotenv_1.default.config();
const app = (0, express_1.default)();
// 基础中间件
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
}));
// 解析请求体
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// 健康检查
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: '服务器运行正常',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});
// 简单的API路由
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'API连接成功',
        data: {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            version: '1.0.0'
        }
    });
});
// 获取示例资源
app.get('/api/resources', async (req, res) => {
    try {
        const resources = await database_1.prisma.resource.findMany({
            take: 10,
            include: {
                owner: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true
                    }
                },
                category: true
            }
        });
        res.json({
            success: true,
            data: resources,
            pagination: {
                page: 1,
                limit: 10,
                total: await database_1.prisma.resource.count(),
                totalPages: Math.ceil(await database_1.prisma.resource.count() / 10)
            }
        });
    }
    catch (error) {
        console.error('获取资源失败:', error);
        res.status(500).json({
            success: false,
            message: '获取资源失败',
            error: error
        });
    }
});
// 创建示例资源
app.post('/api/resources', async (req, res) => {
    try {
        const { title, description, price, categoryId, images } = req.body;
        const resource = await database_1.prisma.resource.create({
            data: {
                title,
                description,
                price: parseFloat(price),
                categoryId,
                // 将图片数组序列化为字符串，schema 中 images 为 String 类型
                images: Array.isArray(images) ? JSON.stringify(images) : (typeof images === 'string' ? images : '[]'),
                ownerId: 'temp-user-id',
                // 位置字段：根据 schema 定义为字符串，避免使用 GeoJSON 对象
                location: '北京市朝阳区（经度:116.4074, 纬度:39.9042）',
                latitude: 39.9042, // 纬度：示例值，北京市
                longitude: 116.4074, // 经度：示例值，北京市
                status: 'AVAILABLE'
            }
        });
        res.status(201).json({
            success: true,
            data: resource,
            message: '资源创建成功'
        });
    }
    catch (error) {
        console.error('创建资源失败:', error);
        res.status(500).json({
            success: false,
            message: '创建资源失败',
            error: error
        });
    }
});
const PORT = process.env.PORT || 3001;
async function startServer() {
    try {
        // 测试数据库连接
        await database_1.prisma.$connect();
        console.log('✅ 数据库连接成功');
        // 启动服务器
        app.listen(PORT, () => {
            console.log(`🚀 服务器运行在端口 ${PORT}`);
            console.log(`❤️  健康检查: http://localhost:${PORT}/health`);
            console.log(`📊 测试API: http://localhost:${PORT}/api/test`);
        });
    }
    catch (error) {
        console.error('❌ 启动失败:', error);
        process.exit(1);
    }
}
// 优雅关闭
process.on('SIGTERM', async () => {
    console.log('收到SIGTERM信号，正在优雅关闭...');
    await database_1.prisma.$disconnect();
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('收到SIGINT信号，正在优雅关闭...');
    await database_1.prisma.$disconnect();
    process.exit(0);
});
startServer();
//# sourceMappingURL=index-simple.js.map