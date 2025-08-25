// server.ts SSL支持示例（稍后实施）

import 'module-alias/register';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { createServer as createSecureServer } from 'https';
import { readFileSync } from 'fs';
import { Server as SocketIOServer } from 'socket.io';

dotenv.config();

import app from '@/app';
// ... 其他导入

const PORT = process.env.PORT || 5000;
const SSL_ENABLED = process.env.SSL_ENABLED === 'true';

let server;

if (SSL_ENABLED) {
  // HTTPS服务器
  const sslOptions = {
    key: readFileSync('C:/ssl/key.pem'),
    cert: readFileSync('C:/ssl/cert.pem')
  };
  server = createSecureServer(sslOptions, app);
  console.log(`🔒 HTTPS服务器启动: https://localhost:${PORT}`);
} else {
  // HTTP服务器
  server = createServer(app);
  console.log(`🌐 HTTP服务器启动: http://localhost:${PORT}`);
}

// ... 其余代码保持不变