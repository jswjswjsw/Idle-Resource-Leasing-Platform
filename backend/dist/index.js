"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.io = exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const express_rate_limit_1 = require("express-rate-limit");
require("./config/cache"); // 初始化Redis连接
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./middleware/logger");
const auth_1 = require("./middleware/auth");
const auth_2 = __importDefault(require("./routes/auth"));
const user_1 = __importDefault(require("./routes/user"));
const resource_1 = __importDefault(require("./routes/resource"));
const order_1 = __importDefault(require("./routes/order"));
const payment_1 = __importDefault(require("./routes/payment"));
const chat_1 = __importDefault(require("./routes/chat"));
const notification_1 = __importDefault(require("./routes/notification"));
const file_1 = __importDefault(require("./routes/file"));
const location_1 = __importDefault(require("./routes/location"));
const wechatOAuth_1 = __importDefault(require("./routes/wechatOAuth"));
const githubOAuth_1 = __importDefault(require("./routes/githubOAuth"));
const swagger_1 = require("./config/swagger");
const socket_1 = require("./config/socket");
const cache_1 = require("./config/cache"); // 初始化缓存并导出状态查询
// 新增：数据库健康检查工具
const database_1 = require("./config/database"); // 复用统一的prisma实例
Object.defineProperty(exports, "prisma", { enumerable: true, get: function () { return database_1.prisma; } });
const package_json_1 = __importDefault(require("../package.json")); // 引入应用包信息用于健康检查返回版本
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
const server = (0, http_1.createServer)(app);
exports.server = server;
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
exports.io = io;
// 使用统一的prisma实例，见 config/database.ts
// 基础中间件
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
}));
// 请求限制
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 限制每个IP每15分钟最多100个请求
    message: {
        success: false,
        error: '请求过于频繁，请稍后再试',
        message: 'Too many requests from this IP'
    }
});
app.use('/api/', limiter);
// 解析请求体
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// 请求日志
app.use(logger_1.logger);
// 健康检查
// 提取健康检查处理器，便于复用不同路径
const healthHandler = async (req, res) => {
    try {
        // 读取缓存与数据库状态
        const cacheStatus = (0, cache_1.getRedisStatus)(); // 获取缓存连接状态（Redis/内存）
        const dbStatus = await (0, database_1.checkDatabaseHealth)(); // 检查数据库健康
        // 返回健康检查信息，包含应用名称与版本，便于灰度与巡检
        res.json({
            success: true,
            message: '服务器运行正常',
            timestamp: new Date().toISOString(), // 当前时间戳（ISO8601）
            environment: process.env.NODE_ENV, // 当前运行环境
            uptime: process.uptime(), // 进程运行时长（秒）
            application: {
                name: package_json_1.default.name, // 应用名称
                version: package_json_1.default.version // 应用版本
            },
            cache: cacheStatus, // 缓存状态（Redis/内存）
            database: dbStatus // 数据库状态（连接可用性）
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            error: '健康检查失败',
            message: err.message // 错误信息
        });
    }
};
// 注册默认健康检查路径（/health）
app.get('/health', healthHandler);
// 根据环境变量注册自定义健康检查路径，默认为中文路径“/健康检查”
const CUSTOM_HEALTH_PATH = process.env.HEALTH_PATH || '/健康检查'; // 自定义健康检查路径
if (CUSTOM_HEALTH_PATH !== '/health') {
    app.get(CUSTOM_HEALTH_PATH, healthHandler); // 注册自定义路径
}
// API路由
app.use('/api/auth', auth_2.default);
app.use('/api/auth/wechat', wechatOAuth_1.default); // 微信OAuth路由
app.use('/api/auth/github', githubOAuth_1.default); // GitHub OAuth路由
app.use('/api/users', auth_1.authenticate, user_1.default);
app.use('/api/resources', resource_1.default);
app.use('/api/orders', auth_1.authenticate, order_1.default);
app.use('/api/payments', auth_1.authenticate, payment_1.default);
app.use('/api/chat', auth_1.authenticate, chat_1.default);
app.use('/api/notifications', auth_1.authenticate, notification_1.default);
app.use('/api/files', file_1.default);
app.use('/api/location', location_1.default);
// Swagger文档
(0, swagger_1.setupSwagger)(app);
// Socket.IO设置
(0, socket_1.setupSocket)(server);
// 错误处理中间件
app.use(errorHandler_1.errorHandler);
// 404处理
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: '接口不存在',
        message: `Cannot ${req.method} ${req.originalUrl}`
    });
});
// 启动服务器
const PORT = process.env.PORT || 3001;
async function startServer() {
    try {
        // 测试数据库连接
        await database_1.prisma.$connect();
        console.log('✅ 数据库连接成功');
        // Redis连接已在 cache.ts 中自动初始化；此处输出当前缓存模式
        const cacheInfo = (0, cache_1.getRedisStatus)();
        if (cacheInfo.connected) {
            console.log('✅ Redis 已连接，缓存模式: Redis');
        }
        else {
            console.warn('⚠️ Redis 未连接，已降级为内存缓存模式');
        }
        // 启动服务器
        server.listen(PORT, () => {
            console.log(`🚀 服务器运行在端口 ${PORT}`);
            console.log(`📚 API文档: http://localhost:${PORT}/api-docs`);
            // 输出健康检查可用URL：默认 /health，同时根据配置输出自定义健康检查路径
            const healthUrls = [`http://localhost:${PORT}/health`]; // 默认健康检查地址
            if (CUSTOM_HEALTH_PATH !== '/health') {
                healthUrls.push(`http://localhost:${PORT}${CUSTOM_HEALTH_PATH}`); // 追加自定义地址
            }
            console.log(`❤️  健康检查: ${healthUrls.join(' | ')}`);
            // 输出应用版本信息，便于排查问题与对齐部署版本
            console.log(`🧩  版本: ${package_json_1.default.version} （${package_json_1.default.name}）`);
            // 输出缓存模式与环境信息
            const cacheInfoBoot = (0, cache_1.getRedisStatus)();
            console.log(`🗄️ 缓存模式: ${cacheInfoBoot.type}（connected=${cacheInfoBoot.connected}）`);
            console.log(`🌐 环境: ${process.env.NODE_ENV || 'development'}`);
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
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});
process.on('SIGINT', async () => {
    console.log('收到SIGINT信号，正在优雅关闭...');
    await database_1.prisma.$disconnect();
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});
startServer();
//# sourceMappingURL=index.js.map