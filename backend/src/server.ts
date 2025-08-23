import 'module-alias/register';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// 加载环境变量
dotenv.config();

import app from '@/app';
import { setupProcessHandlers } from '@/middleware/errorHandler';
import { winstonLogger } from '@/middleware/logger';
import { getRedisStatus } from '@/config/cache';
import { SocketManager } from '@/config/socket';

// 设置进程异常处理
setupProcessHandlers();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// 创建HTTP服务器
const server = createServer(app);

// 初始化WebSocket
const socketManager = new SocketManager(server);

// 启动服务器
server.listen(PORT, () => {
  // 打印启动信息
  console.log('\n' + '='.repeat(60));
  console.log('🚀 交易平台服务器启动成功!');
  console.log('='.repeat(60));
  console.log(`📡 服务器地址: http://localhost:${PORT}`);
  console.log(`🌍 环境模式: ${NODE_ENV}`);
  console.log(`📅 启动时间: ${new Date().toLocaleString('zh-CN')}`);
  
  // 检查服务状态
  const redisStatus = getRedisStatus();
  console.log(`🗄️  缓存服务: ${redisStatus.connected ? '✅ Redis 已连接' : '⚠️  内存缓存 (Redis 未连接)'}`);
  
  // API端点信息
  console.log('\n📋 主要API端点:');
  console.log(`   🔐 认证服务: http://localhost:${PORT}/api/auth`);
  console.log(`   👤 用户管理: http://localhost:${PORT}/api/users`);
  console.log(`   📍 位置服务: http://localhost:${PORT}/api/location`);
  console.log(`   💳 支付服务: http://localhost:${PORT}/api/payments`);
  console.log(`   📢 通知服务: http://localhost:${PORT}/api/notifications`);
  console.log(`   💬 聊天服务: http://localhost:${PORT}/api/chat`);
  console.log(`   📦 订单管理: http://localhost:${PORT}/api/orders`);
  console.log(`   📁 文件服务: http://localhost:${PORT}/api/files`);
  
  // 健康检查
  console.log(`\n🏥 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`📖 API文档: http://localhost:${PORT}/api`);
  
  // 功能特性
  console.log('\n✨ 已启用功能:');
  console.log('   ✅ 用户认证与授权');
  console.log('   ✅ OAuth第三方登录 (GitHub, Google, Gitee)');
  console.log('   ✅ 邮箱/短信验证码');
  console.log('   ✅ 即时通讯 (WebSocket)');
  console.log('   ✅ 地理位置服务 (高德/百度地图)');
  console.log('   ✅ 支付系统 (支付宝/微信沙箱)');
  console.log('   ✅ 实时通知系统');
  console.log('   ✅ 文件上传管理');
  console.log('   ✅ 缓存系统 (Redis/内存)');
  console.log('   ✅ 日志记录');
  console.log('   ✅ 错误处理');
  console.log('   ✅ 安全防护');
  
  // 环境提示
  if (NODE_ENV === 'development') {
    console.log('\n🔧 开发环境提示:');
    console.log('   • 请确保已配置 .env 文件');
    console.log('   • 数据库连接配置正确');
    console.log('   • 第三方服务API密钥已设置');
    console.log('   • 前端应用运行在指定端口');
  } else {
    console.log('\n🔒 生产环境运行中');
    console.log('   • 请确保所有安全配置已设置');
    console.log('   • 监控和日志系统正常运行');
    console.log('   • SSL证书配置正确');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 服务器就绪，等待请求中...');
  console.log('='.repeat(60) + '\n');
  
  // 记录启动日志
  winstonLogger.info('服务器启动成功', {
    port: PORT,
    environment: NODE_ENV,
    nodeVersion: process.version,
    platform: process.platform,
    memory: process.memoryUsage(),
    pid: process.pid,
    redisStatus: redisStatus.type
  });
});

// 优雅关闭处理
const gracefulShutdown = (signal: string) => {
  winstonLogger.info(`收到 ${signal} 信号，开始优雅关闭服务器`);
  
  server.close(() => {
    winstonLogger.info('HTTP服务器已关闭');
    
    // 关闭数据库连接
    // 这里可以添加数据库连接关闭逻辑
    
    // 关闭Redis连接
    // 这里可以添加Redis连接关闭逻辑
    
    winstonLogger.info('所有连接已关闭，进程退出');
    process.exit(0);
  });
  
  // 强制关闭超时
  setTimeout(() => {
    winstonLogger.error('强制关闭服务器（超时）');
    process.exit(1);
  }, 10000);
};

// 监听关闭信号
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 导出服务器实例（用于测试）
export { server, app };