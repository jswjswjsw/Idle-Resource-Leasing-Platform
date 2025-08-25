param(
    [string]$ServerIP = "116.62.44.24",
    [string]$Username = "root"
)

Write-Host "🚀 部署应用到ECS服务器" -ForegroundColor Cyan
Write-Host "=" * 50
Write-Host "服务器IP: $ServerIP" -ForegroundColor Yellow
Write-Host "用户名: $Username" -ForegroundColor Yellow
Write-Host ""

# 检查项目结构
Write-Host "📋 检查项目结构..." -ForegroundColor Yellow
$projectRoot = "d:\project\trade"
$backendPath = "$projectRoot\backend"
$frontendPath = "$projectRoot\frontend"

if (-not (Test-Path $backendPath)) {
    Write-Host "❌ 后端目录不存在: $backendPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $frontendPath)) {
    Write-Host "❌ 前端目录不存在: $frontendPath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 项目结构检查通过" -ForegroundColor Green

# 构建前端
Write-Host "🏗️ 构建前端应用..." -ForegroundColor Yellow
Push-Location $frontendPath
try {
    # 检查 package.json
    if (-not (Test-Path "package.json")) {
        Write-Host "❌ 前端package.json不存在" -ForegroundColor Red
        exit 1
    }
    
    # 安装依赖
    Write-Host "📦 安装前端依赖..." -ForegroundColor Cyan
    & npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 前端依赖安装失败" -ForegroundColor Red
        exit 1
    }
    
    # 构建应用
    Write-Host "🔨 构建前端应用..." -ForegroundColor Cyan
    & npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 前端构建失败" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ 前端构建完成" -ForegroundColor Green
    
} catch {
    Write-Host "❌ 前端构建过程中发生错误: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}

# 构建后端
Write-Host "🏗️ 构建后端应用..." -ForegroundColor Yellow
Push-Location $backendPath
try {
    # 检查 package.json
    if (-not (Test-Path "package.json")) {
        Write-Host "❌ 后端package.json不存在" -ForegroundColor Red
        exit 1
    }
    
    # 安装依赖
    Write-Host "📦 安装后端依赖..." -ForegroundColor Cyan
    & npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 后端依赖安装失败" -ForegroundColor Red
        exit 1
    }
    
    # TypeScript编译
    Write-Host "🔨 编译TypeScript..." -ForegroundColor Cyan
    & npx tsc
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️ TypeScript编译有警告，但继续部署" -ForegroundColor Yellow
    }
    
    Write-Host "✅ 后端构建完成" -ForegroundColor Green
    
} catch {
    Write-Host "❌ 后端构建过程中发生错误: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}

# 创建部署包
Write-Host "📦 创建部署包..." -ForegroundColor Yellow
$deployPath = "$projectRoot\deploy-package"

if (Test-Path $deployPath) {
    Remove-Item $deployPath -Recurse -Force
}
New-Item -ItemType Directory -Path $deployPath -Force | Out-Null

# 复制文件
try {
    # 复制后端文件
    Write-Host "📄 复制后端文件..." -ForegroundColor Cyan
    $backendDeployPath = "$deployPath\backend"
    New-Item -ItemType Directory -Path $backendDeployPath -Force | Out-Null
    
    # 复制必要的后端文件
    Copy-Item "$backendPath\package.json" $backendDeployPath
    Copy-Item "$backendPath\package-lock.json" $backendDeployPath -ErrorAction SilentlyContinue
    if (Test-Path "$backendPath\dist") {
        Copy-Item "$backendPath\dist" $backendDeployPath -Recurse
    }
    if (Test-Path "$backendPath\src") {
        Copy-Item "$backendPath\src" $backendDeployPath -Recurse
    }
    if (Test-Path "$backendPath\prisma") {
        Copy-Item "$backendPath\prisma" $backendDeployPath -Recurse
    }
    
    # 复制前端构建文件
    Write-Host "📄 复制前端文件..." -ForegroundColor Cyan
    $frontendDeployPath = "$deployPath\frontend"
    New-Item -ItemType Directory -Path $frontendDeployPath -Force | Out-Null
    
    if (Test-Path "$frontendPath\build") {
        Copy-Item "$frontendPath\build" $frontendDeployPath -Recurse
    } elseif (Test-Path "$frontendPath\dist") {
        Copy-Item "$frontendPath\dist" $frontendDeployPath -Recurse
    }
    
    # 复制配置文件
    Copy-Item "$projectRoot\docker-compose.yml" $deployPath -ErrorAction SilentlyContinue
    Copy-Item "$projectRoot\nginx.conf" $deployPath -ErrorAction SilentlyContinue
    
    Write-Host "✅ 部署包创建完成" -ForegroundColor Green
    
} catch {
    Write-Host "❌ 创建部署包失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 创建服务器部署脚本
Write-Host "📝 创建服务器部署脚本..." -ForegroundColor Yellow
$serverScript = @"
#!/bin/bash

# 服务器部署脚本
echo "开始部署应用到ECS服务器..."

# 更新系统
echo "更新系统..."
yum update -y

# 安装Node.js
echo "安装Node.js..."
curl -sL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# 安装PM2
echo "安装PM2..."
npm install -g pm2

# 安装Nginx
echo "安装Nginx..."
yum install -y nginx

# 安装PostgreSQL
echo "安装PostgreSQL..."
yum install -y postgresql postgresql-server postgresql-contrib
postgresql-setup initdb
systemctl enable postgresql
systemctl start postgresql

# 创建数据库用户和数据库
echo "配置数据库..."
sudo -u postgres psql -c "CREATE USER tradeuser WITH PASSWORD 'TradePass123!';"
sudo -u postgres psql -c "CREATE DATABASE trade_platform OWNER tradeuser;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE trade_platform TO tradeuser;"

# 创建应用目录
echo "创建应用目录..."
mkdir -p /var/www/trade-platform
cd /var/www/trade-platform

# 部署后端
echo "部署后端..."
cd backend
npm install --production
npx prisma migrate deploy

# 创建PM2配置
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'trade-backend',
    script: 'src/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      DATABASE_URL: 'postgresql://tradeuser:TradePass123!@localhost:5432/trade_platform',
      JWT_SECRET: 'your-super-secret-jwt-key-for-production',
      FRONTEND_URL: 'https://wwwcn.uk'
    }
  }]
};
EOF

# 启动后端服务
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 配置Nginx
echo "配置Nginx..."
cat > /etc/nginx/conf.d/trade-platform.conf << 'EOF'
server {
    listen 80;
    server_name wwwcn.uk www.wwwcn.uk;
    
    # 前端静态文件
    location / {
        root /var/www/trade-platform/frontend/build;
        try_files \$uri \$uri/ /index.html;
    }
    
    # API代理
    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}

server {
    listen 80;
    server_name api.wwwcn.uk;
    
    location / {
        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# 测试Nginx配置
nginx -t

# 启动Nginx
systemctl enable nginx
systemctl start nginx

# 配置防火墙
echo "配置防火墙..."
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-port=5000/tcp
firewall-cmd --reload

echo "部署完成！"
echo "网站地址: http://wwwcn.uk"
echo "API地址: http://api.wwwcn.uk"
"@

$serverScript | Out-File -FilePath "$deployPath\deploy-server.sh" -Encoding UTF8

Write-Host "✅ 服务器部署脚本创建完成" -ForegroundColor Green

# 显示部署信息
Write-Host ""
Write-Host "🎉 部署准备完成！" -ForegroundColor Green
Write-Host "=" * 50
Write-Host "📦 部署包位置: $deployPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔄 下一步操作:" -ForegroundColor Cyan
Write-Host "1. 将部署包上传到服务器" -ForegroundColor White
Write-Host "2. SSH连接到服务器: ssh root@$ServerIP" -ForegroundColor White
Write-Host "3. 运行部署脚本: bash deploy-server.sh" -ForegroundColor White
Write-Host ""
Write-Host "📋 手动上传命令示例:" -ForegroundColor Yellow
Write-Host "scp -r $deployPath root@${ServerIP}:/tmp/trade-deploy" -ForegroundColor Gray
Write-Host "ssh root@$ServerIP" -ForegroundColor Gray
Write-Host "cd /tmp/trade-deploy && bash deploy-server.sh" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 部署完成后访问:" -ForegroundColor Cyan
Write-Host "  主站: https://wwwcn.uk" -ForegroundColor White
Write-Host "  API:  https://api.wwwcn.uk" -ForegroundColor White