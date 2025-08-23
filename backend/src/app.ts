import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { globalErrorHandler, notFoundHandler } from '@/middleware/errorHandler';
import { requestLogger } from '@/middleware/logger';

// 导入所有路由
import authRoutes from '@/routes/auth';
import oauthRoutes from '@/routes/oauth';
import userRoutes from '@/routes/user';
import locationRoutes from '@/routes/location';
import paymentRoutes from '@/routes/payment';
import notificationRoutes from '@/routes/notification';
import chatRoutes from '@/routes/chat';
import orderRoutes from '@/routes/order';
import resourceRoutes from '@/routes/resource';
import fileRoutes from '@/routes/file';

const app = express();

// 基础中间件
app.use(helmet()); // 安全头
app.use(compression()); // 响应压缩
app.use(express.json({ limit: '10mb' })); // JSON解析
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // URL编码解析

// CORS配置
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// 请求日志
app.use(requestLogger);

// 全局限流
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 每个IP最多1000个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试',
    code: 'TOO_MANY_REQUESTS'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(globalLimiter);

// 严格限流（登录、注册等敏感操作）
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 每个IP最多5次尝试
  message: {
    success: false,
    message: '尝试次数过多，请15分钟后再试',
    code: 'TOO_MANY_ATTEMPTS'
  }
});

// API版本和健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// API信息
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: '交易平台API',
    data: {
      name: 'Trade Platform API',
      version: process.env.API_VERSION || '1.0.0',
      description: '一个功能完整的交易平台后端API',
      environment: process.env.NODE_ENV || 'development',
      features: [
        '用户认证与授权',
        'OAuth第三方登录',
        '即时通讯系统',
        '地理位置服务',
        '支付系统',
        '实时通知',
        '文件上传',
        '订单管理',
        '资源交易'
      ],
      endpoints: {
        auth: '/api/auth',
        oauth: '/api/auth/oauth',
        users: '/api/users',
        location: '/api/location',
        payments: '/api/payments',
        notifications: '/api/notifications',
        chat: '/api/chat',
        orders: '/api/orders',
        resources: '/api/resources',
        files: '/api/files'
      }
    }
  });
});

// 注册所有路由
app.use('/api/auth', authRoutes);
app.use('/api/auth/oauth', oauthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/files', fileRoutes);

// 限流路由（需要严格限制的端点）
app.use('/api/auth/login', strictLimiter);
app.use('/api/auth/register', strictLimiter);
app.use('/api/auth/forgot-password', strictLimiter);
app.use('/api/auth/reset-password', strictLimiter);
app.use('/api/auth/send-email-code', strictLimiter);
app.use('/api/auth/send-sms-code', strictLimiter);

// 处理未找到的路由
app.use(notFoundHandler);

// 全局错误处理
app.use(globalErrorHandler);

export default app;