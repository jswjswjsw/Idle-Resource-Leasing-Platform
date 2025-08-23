#!/usr/bin/env node

/**
 * 生产环境启动脚本
 * 包含健康检查、优雅关闭等生产特性
 */

const cluster = require('cluster');
const os = require('os');
const path = require('path');

// 环境变量检查
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ 缺少必需的环境变量: ${envVar}`);
    process.exit(1);
  }
}

// 生产环境配置
process.env.NODE_ENV = 'production';

if (cluster.isMaster) {
  console.log('🚀 启动交易平台生产服务器...');
  console.log(`📊 CPU核心数: ${os.cpus().length}`);
  
  // 根据CPU核心数启动工作进程（最多4个）
  const numWorkers = Math.min(os.cpus().length, 4);
  
  console.log(`🔄 启动 ${numWorkers} 个工作进程...`);
  
  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }
  
  // 监听工作进程退出
  cluster.on('exit', (worker, code, signal) => {
    console.log(`⚠️  工作进程 ${worker.process.pid} 已退出 (${signal || code})`);
    
    // 自动重启工作进程
    if (!worker.exitedAfterDisconnect) {
      console.log('🔄 重启工作进程...');
      cluster.fork();
    }
  });
  
  // 优雅关闭
  process.on('SIGTERM', () => {
    console.log('📤 收到SIGTERM信号，开始优雅关闭...');
    
    for (const id in cluster.workers) {
      cluster.workers[id].disconnect();
    }
    
    setTimeout(() => {
      console.log('💥 强制退出进程');
      process.exit(0);
    }, 10000);
  });
  
} else {
  // 工作进程
  try {
    require('./dist/server.js');
    console.log(`✅ 工作进程 ${process.pid} 启动成功`);
  } catch (error) {
    console.error(`❌ 工作进程 ${process.pid} 启动失败:`, error);
    process.exit(1);
  }
}