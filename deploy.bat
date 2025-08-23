@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

:: ==============================================
:: 交易平台 Windows 自动化部署脚本
:: ==============================================

:: 颜色定义（如果支持）
set "GREEN=[32m"
set "RED=[31m"
set "YELLOW=[33m"
set "BLUE=[34m"
set "NC=[0m"

:: 打印消息函数
:print_message
echo [部署] %~1
goto :eof

:print_error
echo [错误] %~1
goto :eof

:print_info
echo [信息] %~1
goto :eof

:: 检查环境
:check_environment
call :print_message "检查部署环境..."

where node >nul 2>&1
if %errorlevel% neq 0 (
    call :print_error "Node.js 未安装，请先安装 Node.js"
    exit /b 1
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
    call :print_error "npm 未安装，请先安装 npm"
    exit /b 1
)

for /f "delims=" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "delims=" %%i in ('npm --version') do set NPM_VERSION=%%i

call :print_info "Node.js 版本: %NODE_VERSION%"
call :print_info "npm 版本: %NPM_VERSION%"
goto :eof

:: 构建前端
:build_frontend
call :print_message "构建前端应用..."

cd frontend

call :print_info "安装前端依赖..."
npm install --only=production
if %errorlevel% neq 0 (
    call :print_error "前端依赖安装失败"
    exit /b 1
)

call :print_info "构建前端应用..."
npm run build
if %errorlevel% neq 0 (
    call :print_error "前端构建失败"
    exit /b 1
)

if not exist "build" if not exist "dist" (
    call :print_error "前端构建失败，未找到构建目录"
    exit /b 1
)

call :print_message "前端构建完成 ✅"
cd ..
goto :eof

:: 构建后端
:build_backend
call :print_message "构建后端应用..."

cd backend

call :print_info "安装后端依赖..."
npm install --only=production
if %errorlevel% neq 0 (
    call :print_error "后端依赖安装失败"
    exit /b 1
)

call :print_info "编译 TypeScript..."
npx tsc
if %errorlevel% neq 0 (
    call :print_error "TypeScript 编译失败"
    exit /b 1
)

if not exist "dist" (
    call :print_error "后端编译失败，未找到 dist 目录"
    exit /b 1
)

call :print_message "后端构建完成 ✅"
cd ..
goto :eof

:: Railway 部署
:deploy_railway
call :print_message "部署到 Railway..."

where railway >nul 2>&1
if %errorlevel% neq 0 (
    call :print_info "安装 Railway CLI..."
    npm install -g @railway/cli
)

call :print_info "请登录 Railway..."
railway login

call :print_info "初始化 Railway 项目..."
railway init

cd backend
call :print_info "部署后端到 Railway..."
railway up
cd ..

call :print_message "Railway 部署完成 ✅"
goto :eof

:: Vercel 部署
:deploy_vercel
call :print_message "部署前端到 Vercel..."

where vercel >nul 2>&1
if %errorlevel% neq 0 (
    call :print_info "安装 Vercel CLI..."
    npm install -g vercel
)

cd frontend

call :print_info "请登录 Vercel..."
vercel login

call :print_info "部署前端到 Vercel..."
vercel --prod

cd ..
call :print_message "Vercel 部署完成 ✅"
goto :eof

:: 本地生产测试
:test_production
call :print_message "启动本地生产环境测试..."

cd backend
start /b cmd /c "set NODE_ENV=production && npm start"
cd ..

call :print_info "后端运行在 http://localhost:5000"
call :print_info "前端构建文件在 frontend/build 目录"
call :print_info "按任意键停止服务"
pause > nul

taskkill /f /im node.exe 2>nul
goto :eof

:: 数据库迁移
:migrate_database
call :print_message "执行数据库迁移..."

cd backend

call :print_info "生成 Prisma 客户端..."
npx prisma generate

call :print_info "执行数据库迁移..."
npx prisma migrate deploy

call :print_message "数据库迁移完成 ✅"
cd ..
goto :eof

:: 显示帮助
:show_help
echo =========================================
echo 🚀 交易平台部署脚本 (Windows)
echo =========================================
echo.
echo 用法: %~nx0 [选项]
echo.
echo 选项:
echo   build-all      构建前后端应用
echo   build-frontend 只构建前端
echo   build-backend  只构建后端
echo   deploy-railway 部署到 Railway
echo   deploy-vercel  部署前端到 Vercel
echo   test-prod      本地生产环境测试
echo   migrate        数据库迁移
echo   help           显示此帮助信息
echo.
echo 示例:
echo   %~nx0 build-all
echo   %~nx0 deploy-railway
echo.
goto :eof

:: 主函数
:main
echo =========================================
echo 🚀 交易平台自动化部署脚本
echo =========================================

set ACTION=%~1
if "%ACTION%"=="" set ACTION=help

if "%ACTION%"=="build-all" (
    call :check_environment
    call :build_backend
    call :build_frontend
) else if "%ACTION%"=="build-frontend" (
    call :check_environment
    call :build_frontend
) else if "%ACTION%"=="build-backend" (
    call :check_environment
    call :build_backend
) else if "%ACTION%"=="deploy-railway" (
    call :check_environment
    call :build_backend
    call :deploy_railway
) else if "%ACTION%"=="deploy-vercel" (
    call :check_environment
    call :build_frontend
    call :deploy_vercel
) else if "%ACTION%"=="test-prod" (
    call :check_environment
    call :test_production
) else if "%ACTION%"=="migrate" (
    call :migrate_database
) else if "%ACTION%"=="help" (
    call :show_help
) else (
    call :print_error "未知选项: %ACTION%"
    call :show_help
    exit /b 1
)

goto :eof

:: 调用主函数
call :main %*