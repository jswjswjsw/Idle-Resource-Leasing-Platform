import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { rateLimit } from 'express-rate-limit';

import '@/config/cache'; // 初始化Redis连接
import { errorHandler } from '@/middleware/errorHandler';
import { requestLogger as logger, winstonLogger } from '@/middleware/logger';
import { authenticate } from '@/middleware/auth';

import authRoutes from '@/routes/auth';
import userRoutes from '@/routes/user';
import resourceRoutes from '@/routes/resource';
import orderRoutes from '@/routes/order';
import paymentRoutes from '@/routes/payment';
import chatRoutes from '@/routes/chat';
import notificationRoutes from '@/routes/notification';
import fileRoutes from '@/routes/file';
import locationRoutes from '@/routes/location';
import wechatOAuthRoutes from '@/routes/wechatOAuth';
import githubOAuthRoutes from '@/routes/githubOAuth';

import { setupSwagger } from '@/config/swagger';
import { setupSocket } from '@/config/socket';
import { getRedisStatus } from '@/config/cache'; // 初始化缓存并导出状态查询
// 新增：数据库健康检查工具
import { checkDatabaseHealth, prisma } from '@/config/database'; // 复用统一的prisma实例
import pkg from '../package.json'; // 引入应用包信息用于健康检查返回版本

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// 使用统一的prisma实例，见 config/database.ts

// 基础中间件
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// 请求限制
const limiter = rateLimit({
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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志
app.use(logger);

// 健康检查
// 提取健康检查处理器，便于复用不同路径
const healthHandler = async (req: express.Request, res: express.Response) => {
  try {
    // 读取缓存与数据库状态
    const cacheStatus = getRedisStatus(); // 获取缓存连接状态（Redis/内存）
    const dbStatus = await checkDatabaseHealth(); // 检查数据库健康

    // 返回健康检查信息，包含应用名称与版本，便于灰度与巡检
    res.json({
      success: true,
      message: '服务器运行正常',
      timestamp: new Date().toISOString(), // 当前时间戳（ISO8601）
      environment: process.env.NODE_ENV, // 当前运行环境
      uptime: process.uptime(), // 进程运行时长（秒）
      application: { // 应用信息
        name: pkg.name, // 应用名称
        version: pkg.version // 应用版本
      },
      cache: cacheStatus, // 缓存状态（Redis/内存）
      database: dbStatus // 数据库状态（连接可用性）
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '健康检查失败',
      message: (err as Error).message // 错误信息
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
app.use('/api/auth', authRoutes);
app.use('/api/auth/wechat', wechatOAuthRoutes); // 微信OAuth路由
app.use('/api/auth/github', githubOAuthRoutes); // GitHub OAuth路由
app.use('/api/users', authenticate, userRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/orders', authenticate, orderRoutes);
app.use('/api/payments', authenticate, paymentRoutes);
app.use('/api/chat', authenticate, chatRoutes);
app.use('/api/notifications', authenticate, notificationRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/location', locationRoutes);

// Swagger文档
setupSwagger(app);

// Socket.IO设置
setupSocket(server);

// 错误处理中间件
app.use(errorHandler);

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
    await prisma.$connect();
    console.log('✅ 数据库连接成功');

    // Redis连接已在 cache.ts 中自动初始化；此处输出当前缓存模式
    const cacheInfo = getRedisStatus();
    if (cacheInfo.connected) {
      console.log('✅ Redis 已连接，缓存模式: Redis');
    } else {
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
      console.log(`🧩  版本: ${pkg.version} （${pkg.name}）`);
      // 输出缓存模式与环境信息
      const cacheInfoBoot = getRedisStatus();
      console.log(`🗄️ 缓存模式: ${cacheInfoBoot.type}（connected=${cacheInfoBoot.connected}）`);
      console.log(`🌐 环境: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('❌ 启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('收到SIGTERM信号，正在优雅关闭...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('收到SIGINT信号，正在优雅关闭...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

startServer();

export { app, server, io, prisma };