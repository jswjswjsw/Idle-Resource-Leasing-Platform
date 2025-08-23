@echo off
echo 正在启动闲置资源租赁平台开发环境...
echo.

REM 设置环境变量
copy .env.local backend\.env
cd backend

REM 安装依赖
echo 正在检查后端依赖...
if not exist "node_modules" (
    echo 正在安装后端依赖...
    npm install
)

REM 检查数据库连接
echo 正在测试数据库连接...
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$connect()
  .then(() => {
    console.log('✅ 数据库连接成功');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 数据库连接失败:', error.message);
    console.log('请确保MySQL服务已启动，并使用以下配置：');
    console.log('数据库: mysql://root:rootpassword@localhost:3306/idle_resource_rental');
    process.exit(1);
  });
"

if %errorlevel% neq 0 (
    echo.
    echo 请先启动MySQL数据库服务：
    echo 1. 启动MySQL服务
    echo 2. 创建数据库：CREATE DATABASE idle_resource_rental;
    echo 3. 重新运行此脚本
    pause
    exit /b 1
)

REM 运行数据库迁移
echo 正在运行数据库迁移...
npx prisma migrate dev --name init

REM 启动后端服务
echo 正在启动后端API服务...
start cmd /k "npm run dev"

cd ..

REM 启动前端服务
echo 正在启动前端React应用...
cd frontend

if not exist "node_modules" (
    echo 正在安装前端依赖...
    npm install
)

start cmd /k "npm start"

cd ..

echo.
echo 🚀 开发环境启动完成！
echo 📱 前端应用: http://localhost:3000
echo 🔌 后端API: http://localhost:3001
echo 📊 API测试: http://localhost:3001/api/test
echo ❤️  健康检查: http://localhost:3001/health
echo.
pause