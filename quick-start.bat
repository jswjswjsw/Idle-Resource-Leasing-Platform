@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM ==============================================
REM wwwcn.uk 域名快速部署脚本 (Windows版)
REM ==============================================

echo.
echo 🌐 wwwcn.uk 域名快速部署向导
echo ==========================================
echo.

REM 检查Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: Node.js 未安装
    echo 请先安装 Node.js: https://nodejs.org
    pause
    exit /b 1
)

REM 检查npm
where npm >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: npm 未安装
    echo 请确保Node.js正确安装
    pause
    exit /b 1
)

echo ✅ Node.js 环境检查通过
echo.

REM 显示菜单
:MENU
echo 📋 请选择要执行的操作：
echo.
echo [1] 🔧 第三方服务配置向导
echo [2] ☁️  Cloudflare域名配置
echo [3] 🚀 应用本地启动
echo [4] 📦 构建和部署准备
echo [5] 📖 查看配置指南
echo [6] ❌ 退出
echo.

set /p choice="请输入选择 (1-6): "

if "%choice%"=="1" goto SETUP_SERVICES
if "%choice%"=="2" goto CLOUDFLARE_CONFIG
if "%choice%"=="3" goto START_LOCAL
if "%choice%"=="4" goto BUILD_DEPLOY
if "%choice%"=="5" goto VIEW_GUIDES
if "%choice%"=="6" goto EXIT

echo ⚠️  无效选择，请重新输入
echo.
goto MENU

REM 第三方服务配置
:SETUP_SERVICES
echo.
echo 🔧 启动第三方服务配置向导...
echo.
node scripts\setup-services.js
if errorlevel 1 (
    echo ❌ 配置向导运行失败
    pause
)
echo.
echo 按任意键返回主菜单...
pause >nul
goto MENU

REM Cloudflare配置
:CLOUDFLARE_CONFIG
echo.
echo ☁️  启动Cloudflare域名配置...
echo.
echo 📋 请确保您已准备好以下信息：
echo    - Cloudflare API Token
echo    - Zone ID
echo    - 服务器IP地址（如果已有）
echo.
set /p continue="继续配置？(y/n): "
if /i "!continue!"=="y" (
    call deploy-cloudflare.bat
) else (
    echo 💡 您可以稍后运行 deploy-cloudflare.bat 进行配置
)
echo.
echo 按任意键返回主菜单...
pause >nul
goto MENU

REM 本地启动
:START_LOCAL
echo.
echo 🚀 启动本地开发环境...
echo.

REM 检查依赖
if not exist "node_modules" (
    echo 📦 安装项目依赖...
    npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败
        pause
        goto MENU
    )
)

if not exist "backend\node_modules" (
    echo 📦 安装后端依赖...
    cd backend
    npm install
    if errorlevel 1 (
        echo ❌ 后端依赖安装失败
        pause
        goto MENU
    )
    cd ..
)

REM 检查环境变量文件
if not exist ".env.local" (
    if exist ".env.example" (
        echo 📝 复制环境变量模板...
        copy ".env.example" ".env.local"
    ) else (
        echo ⚠️  未找到环境变量文件，请先运行配置向导
        pause
        goto MENU
    )
)

echo ✅ 准备就绪，启动开发服务器...
echo.
echo 📊 开发服务器将在以下地址运行：
echo    前端: http://localhost:3000
echo    后端: http://localhost:5000
echo.
echo 💡 按 Ctrl+C 可停止服务器
echo.

REM 启动开发服务器
start "后端服务器" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
start "前端服务器" cmd /k "cd frontend && npm start"

echo ✅ 开发服务器已启动
echo.
echo 按任意键返回主菜单...
pause >nul
goto MENU

REM 构建和部署准备
:BUILD_DEPLOY
echo.
echo 📦 构建和部署准备...
echo.

REM 检查环境变量
if not exist ".env.production" (
    echo ⚠️  未找到生产环境配置文件
    echo 请先运行配置向导创建 .env.production 文件
    pause
    goto MENU
)

echo 🔨 构建后端项目...
cd backend
npm run build
if errorlevel 1 (
    echo ❌ 后端构建失败
    cd ..
    pause
    goto MENU
)
cd ..

echo 🔨 构建前端项目...
cd frontend
npm run build
if errorlevel 1 (
    echo ❌ 前端构建失败
    cd ..
    pause
    goto MENU
)
cd ..

echo ✅ 构建完成！
echo.
echo 📋 部署文件位置：
echo    后端: backend\dist\
echo    前端: frontend\build\
echo.
echo 🚀 部署选项：
echo [1] Railway 部署（推荐）
echo [2] Vercel + PlanetScale 部署
echo [3] Render 部署
echo [4] 阿里云ECS部署
echo [5] 查看部署指南
echo.

set /p deploy_choice="选择部署方式 (1-5): "

if "%deploy_choice%"=="1" (
    echo 🚀 Railway 部署指南：
    echo 1. 访问 https://railway.app 并登录
    echo 2. 创建新项目，选择从GitHub部署
    echo 3. 添加PostgreSQL数据库
    echo 4. 配置环境变量
    echo 5. 设置自定义域名: api.wwwcn.uk
)

if "%deploy_choice%"=="2" (
    echo 🚀 Vercel + PlanetScale 部署指南：
    echo 1. 注册 PlanetScale 并创建数据库
    echo 2. 安装 Vercel CLI: npm install -g vercel
    echo 3. 运行: vercel --prod
    echo 4. 配置环境变量和自定义域名
)

if "%deploy_choice%"=="3" (
    echo 🚀 Render 部署指南：
    echo 1. 访问 https://render.com 并登录
    echo 2. 创建PostgreSQL数据库
    echo 3. 创建Web Service，连接GitHub仓库
    echo 4. 配置环境变量和自定义域名
)

if "%deploy_choice%"=="4" (
    echo 🚀 阿里云ECS部署指南：
    echo 1. 购买ECS实例并配置安全组
    echo 2. 安装Node.js、Docker、Nginx
    echo 3. 克隆代码并部署
    echo 4. 配置SSL证书和域名解析
)

if "%deploy_choice%"=="5" (
    echo 📖 查看详细部署指南：
    echo    docs\APPLICATION_DEPLOYMENT_GUIDE.md
    start notepad "docs\APPLICATION_DEPLOYMENT_GUIDE.md"
)

echo.
echo 按任意键返回主菜单...
pause >nul
goto MENU

REM 查看配置指南
:VIEW_GUIDES
echo.
echo 📖 配置指南文档
echo.
echo 可用的指南文档：
echo.
echo [1] 📄 Cloudflare API 配置指南
echo [2] 📄 Cloudflare 配置使用指南  
echo [3] 📄 第三方服务申请指南
echo [4] 📄 应用部署配置指南
echo [5] 📄 wwwcn.uk 域名部署指南
echo [6] 🔙 返回主菜单
echo.

set /p guide_choice="选择要查看的指南 (1-6): "

if "%guide_choice%"=="1" (
    if exist "docs\CLOUDFLARE_API_SETUP.md" (
        start notepad "docs\CLOUDFLARE_API_SETUP.md"
    ) else (
        echo ❌ 文件不存在
    )
)

if "%guide_choice%"=="2" (
    if exist "docs\CLOUDFLARE_CONFIGURATION_GUIDE.md" (
        start notepad "docs\CLOUDFLARE_CONFIGURATION_GUIDE.md"
    ) else (
        echo ❌ 文件不存在
    )
)

if "%guide_choice%"=="3" (
    if exist "docs\THIRD_PARTY_SERVICES_GUIDE.md" (
        start notepad "docs\THIRD_PARTY_SERVICES_GUIDE.md"
    ) else (
        echo ❌ 文件不存在
    )
)

if "%guide_choice%"=="4" (
    if exist "docs\APPLICATION_DEPLOYMENT_GUIDE.md" (
        start notepad "docs\APPLICATION_DEPLOYMENT_GUIDE.md"
    ) else (
        echo ❌ 文件不存在
    )
)

if "%guide_choice%"=="5" (
    if exist "docs\WWWCN_UK_DEPLOYMENT_GUIDE.md" (
        start notepad "docs\WWWCN_UK_DEPLOYMENT_GUIDE.md"
    ) else (
        echo ❌ 文件不存在
    )
)

if "%guide_choice%"=="6" goto MENU

echo.
echo 按任意键返回指南菜单...
pause >nul
goto VIEW_GUIDES

REM 退出
:EXIT
echo.
echo 👋 感谢使用 wwwcn.uk 域名部署向导！
echo.
echo 📋 部署步骤总结：
echo 1. ✅ 第三方服务配置
echo 2. ✅ Cloudflare 域名配置
echo 3. ✅ 应用构建和部署
echo 4. ✅ 测试和验证
echo.
echo 🌐 您的域名：
echo    主站: https://wwwcn.uk
echo    API: https://api.wwwcn.uk
echo.
echo 📞 需要帮助？请查看 docs/ 目录中的详细指南
echo.
pause
exit /b 0