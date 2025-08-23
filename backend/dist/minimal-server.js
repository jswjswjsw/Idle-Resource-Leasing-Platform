"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketManager = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_1 = require("./config/socket");
const notification_1 = __importDefault(require("./routes/notification"));
const chat_1 = __importDefault(require("./routes/chat"));
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const PORT = process.env.PORT || 3001;
// 初始化Socket.IO
let socketManager;
try {
    exports.socketManager = socketManager = (0, socket_1.setupSocket)(server);
    console.log('🔌 Socket.IO 服务已启动');
}
catch (error) {
    console.error('Socket.IO 启动失败:', error);
}
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
}));
app.use(express_1.default.json());
// 注册路由
app.use('/api/notifications', notification_1.default);
app.use('/api/messages', chat_1.default);
// 健康检查
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: '服务器运行正常',
        timestamp: new Date().toISOString(),
        socket: {
            onlineUsers: socketManager?.getOnlineUserCount() || 0,
            uptime: process.uptime()
        }
    });
});
// 服务器状态
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        data: {
            server: {
                port: PORT,
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                timestamp: new Date().toISOString()
            },
            socket: socketManager?.getServerStats() || null,
            version: '1.0.0'
        }
    });
});
// 测试API连接
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'API连接成功',
        data: {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            endpoints: [
                '/health - 健康检查',
                '/api/test - 测试连接',
                '/api/resources - 示例资源',
                '/api/status - 服务器状态',
                '/api/socket/stats - Socket统计'
            ],
            socket: {
                onlineUsers: socketManager?.getOnlineUserCount() || 0
            }
        }
    });
});
// Socket.IO 统计
app.get('/api/socket/stats', (req, res) => {
    if (!socketManager) {
        return res.status(503).json({
            success: false,
            message: 'Socket服务未启动'
        });
    }
    res.json({
        success: true,
        data: socketManager.getServerStats()
    });
});
// 示例资源数据
const sampleResources = [
    {
        id: '1',
        title: '高端相机租赁',
        description: '佳能EOS R5专业相机，适合拍摄高质量照片和视频',
        price: 150.00,
        images: ['https://example.com/camera1.jpg'],
        location: '北京市朝阳区',
        status: 'AVAILABLE'
    },
    {
        id: '2',
        title: '无人机航拍服务',
        description: '大疆Mavic 3无人机，专业航拍，4K画质',
        price: 200.00,
        images: ['https://example.com/drone1.jpg'],
        location: '上海市浦东新区',
        status: 'AVAILABLE'
    },
    {
        id: '3',
        title: '会议室租赁',
        description: '现代化会议室，可容纳20人，配备投影和音响',
        price: 300.00,
        images: ['https://example.com/meeting1.jpg'],
        location: '深圳市南山区',
        status: 'AVAILABLE'
    }
];
// 获取示例资源
app.get('/api/resources', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResources = sampleResources.slice(startIndex, endIndex);
    res.json({
        success: true,
        data: paginatedResources,
        pagination: {
            page,
            limit,
            total: sampleResources.length,
            totalPages: Math.ceil(sampleResources.length / limit)
        }
    });
});
// 创建资源
app.post('/api/resources', (req, res) => {
    const { title, description, price, images, location } = req.body;
    const newResource = {
        id: (sampleResources.length + 1).toString(),
        title,
        description,
        price: parseFloat(price),
        images: images || [],
        location,
        status: 'AVAILABLE'
    };
    sampleResources.push(newResource);
    res.status(201).json({
        success: true,
        data: newResource,
        message: '资源创建成功'
    });
});
server.listen(PORT, () => {
    console.log(`🚀 服务器运行在端口 ${PORT}`);
    console.log(`🔌 Socket.IO 已集成`);
    console.log(`❤️  健康检查: http://localhost:${PORT}/health`);
    console.log(`📊 测试API: http://localhost:${PORT}/api/test`);
    console.log(`📦 示例资源: http://localhost:${PORT}/api/resources`);
    console.log(`📈 Socket统计: http://localhost:${PORT}/api/socket/stats`);
});
//# sourceMappingURL=minimal-server.js.map