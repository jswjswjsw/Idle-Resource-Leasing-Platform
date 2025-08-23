#!/bin/bash

# ==============================================
# 交易平台自动化部署脚本
# 支持多种免费部署平台
# ==============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${GREEN}[部署] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[警告] $1${NC}"
}

print_error() {
    echo -e "${RED}[错误] $1${NC}"
}

print_info() {
    echo -e "${BLUE}[信息] $1${NC}"
}

# 检查环境
check_environment() {
    print_message "检查部署环境..."
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装，请先安装 Node.js"
        exit 1
    fi
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        print_error "npm 未安装，请先安装 npm"
        exit 1
    fi
    
    # 检查Git
    if ! command -v git &> /dev/null; then
        print_warning "Git 未安装，某些部署方式可能需要 Git"
    fi
    
    print_info "Node.js 版本: $(node --version)"
    print_info "npm 版本: $(npm --version)"
}

# 构建前端
build_frontend() {
    print_message "构建前端应用..."
    
    cd frontend
    
    # 安装依赖
    print_info "安装前端依赖..."
    npm install --only=production
    
    # 构建应用
    print_info "构建前端应用..."
    npm run build
    
    # 检查构建结果
    if [ ! -d "build" ] && [ ! -d "dist" ]; then
        print_error "前端构建失败，未找到构建目录"
        exit 1
    fi
    
    print_message "前端构建完成 ✅"
    cd ..
}

# 构建后端
build_backend() {
    print_message "构建后端应用..."
    
    cd backend
    
    # 安装依赖
    print_info "安装后端依赖..."
    npm install --only=production
    
    # TypeScript 编译
    print_info "编译 TypeScript..."
    npx tsc
    
    # 检查编译结果
    if [ ! -d "dist" ]; then
        print_error "后端编译失败，未找到 dist 目录"
        exit 1
    fi
    
    print_message "后端构建完成 ✅"
    cd ..
}

# Railway 部署
deploy_railway() {
    print_message "部署到 Railway..."
    
    # 检查 Railway CLI
    if ! command -v railway &> /dev/null; then
        print_info "安装 Railway CLI..."
        npm install -g @railway/cli
    fi
    
    # 登录 Railway
    print_info "请登录 Railway..."
    railway login
    
    # 创建项目（如果不存在）
    print_info "初始化 Railway 项目..."
    railway init
    
    # 部署后端
    cd backend
    print_info "部署后端到 Railway..."
    railway up
    cd ..
    
    # 部署前端（可选，也可以部署到 Vercel）
    cd frontend
    print_info "部署前端到 Railway..."
    railway up
    cd ..
    
    print_message "Railway 部署完成 ✅"
}

# Vercel 部署
deploy_vercel() {
    print_message "部署前端到 Vercel..."
    
    # 检查 Vercel CLI
    if ! command -v vercel &> /dev/null; then
        print_info "安装 Vercel CLI..."
        npm install -g vercel
    fi
    
    cd frontend
    
    # 登录 Vercel
    print_info "请登录 Vercel..."
    vercel login
    
    # 部署
    print_info "部署前端到 Vercel..."
    vercel --prod
    
    cd ..
    print_message "Vercel 部署完成 ✅"
}

# Render 部署
deploy_render() {
    print_message "准备 Render 部署文件..."
    
    # 创建 render.yaml
    cat > render.yaml << EOF
services:
  - type: web
    name: trade-backend
    env: node
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: trade-db
          property: connectionString
    
  - type: web
    name: trade-frontend
    env: static
    buildCommand: cd frontend && npm install && npm run build
    staticPublishPath: frontend/build
    
databases:
  - name: trade-db
    databaseName: trade_platform
    user: trade_user
EOF
    
    print_message "Render 配置文件已创建 ✅"
    print_info "请将项目推送到 Git 仓库，然后在 Render 控制台导入项目"
}

# Docker 构建
build_docker() {
    print_message "构建 Docker 镜像..."
    
    # 构建后端镜像
    print_info "构建后端 Docker 镜像..."
    docker build -t trade-backend ./backend
    
    # 构建前端镜像
    print_info "构建前端 Docker 镜像..."
    docker build -t trade-frontend ./frontend
    
    print_message "Docker 镜像构建完成 ✅"
}

# 本地生产环境测试
test_production() {
    print_message "启动本地生产环境测试..."
    
    # 使用生产配置启动
    cd backend
    NODE_ENV=production npm start &
    BACKEND_PID=$!
    cd ..
    
    # 启动前端（如果有生产服务器）
    cd frontend
    if [ -f "package.json" ] && grep -q "serve" package.json; then
        npm run serve &
        FRONTEND_PID=$!
    fi
    cd ..
    
    print_info "后端运行在 http://localhost:5000"
    print_info "前端运行在 http://localhost:3000"
    print_warning "按 Ctrl+C 停止服务"
    
    # 等待用户停止
    wait
}

# 环境变量检查
check_env_vars() {
    print_message "检查生产环境变量..."
    
    REQUIRED_VARS=(
        "DATABASE_URL"
        "JWT_SECRET"
        "JWT_REFRESH_SECRET"
    )
    
    MISSING_VARS=()
    
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            MISSING_VARS+=($var)
        fi
    done
    
    if [ ${#MISSING_VARS[@]} -ne 0 ]; then
        print_error "缺少必需的环境变量:"
        for var in "${MISSING_VARS[@]}"; do
            echo "  - $var"
        done
        print_info "请在部署平台设置这些环境变量"
        return 1
    fi
    
    print_message "环境变量检查通过 ✅"
}

# 数据库迁移
migrate_database() {
    print_message "执行数据库迁移..."
    
    cd backend
    
    # 生成 Prisma 客户端
    npx prisma generate
    
    # 执行迁移
    npx prisma migrate deploy
    
    print_message "数据库迁移完成 ✅"
    cd ..
}

# 显示帮助信息
show_help() {
    echo "交易平台部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  build-all      构建前后端应用"
    echo "  build-frontend 只构建前端"
    echo "  build-backend  只构建后端"
    echo "  deploy-railway 部署到 Railway"
    echo "  deploy-vercel  部署前端到 Vercel"
    echo "  deploy-render  准备 Render 部署"
    echo "  build-docker   构建 Docker 镜像"
    echo "  test-prod      本地生产环境测试"
    echo "  migrate        数据库迁移"
    echo "  check-env      检查环境变量"
    echo "  help           显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 build-all && $0 deploy-railway"
    echo "  $0 check-env && $0 build-docker"
}

# 主函数
main() {
    echo "========================================="
    echo "🚀 交易平台自动化部署脚本"
    echo "========================================="
    
    case "${1:-help}" in
        "build-all")
            check_environment
            build_backend
            build_frontend
            ;;
        "build-frontend")
            check_environment
            build_frontend
            ;;
        "build-backend")
            check_environment
            build_backend
            ;;
        "deploy-railway")
            check_environment
            build_backend
            deploy_railway
            ;;
        "deploy-vercel")
            check_environment
            build_frontend
            deploy_vercel
            ;;
        "deploy-render")
            check_environment
            deploy_render
            ;;
        "build-docker")
            check_environment
            build_docker
            ;;
        "test-prod")
            check_environment
            test_production
            ;;
        "migrate")
            migrate_database
            ;;
        "check-env")
            check_env_vars
            ;;
        "help")
            show_help
            ;;
        *)
            print_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"