Write-Host "🚀 准备部署到ECS服务器 (116.62.44.24)" -ForegroundColor Cyan
Write-Host "=" * 50

$projectRoot = "d:\project\trade"
$deployPath = "$projectRoot\deploy-package"

# 创建部署目录
Write-Host "📦 创建部署目录..." -ForegroundColor Yellow
if (Test-Path $deployPath) {
    Remove-Item $deployPath -Recurse -Force
}
New-Item -ItemType Directory -Path $deployPath -Force | Out-Null

# 复制项目文件
Write-Host "📄 复制项目文件..." -ForegroundColor Yellow
Copy-Item "$projectRoot\backend" "$deployPath\backend" -Recurse -Force
Copy-Item "$projectRoot\frontend" "$deployPath\frontend" -Recurse -Force
Copy-Item "$projectRoot\package.json" $deployPath -ErrorAction SilentlyContinue
Copy-Item "$projectRoot\docker-compose.yml" $deployPath -ErrorAction SilentlyContinue

# 创建服务器脚本
Write-Host "📝 创建服务器安装脚本..." -ForegroundColor Yellow

$installScript = @'
#!/bin/bash

echo "开始安装和配置服务器..."

# 更新系统
yum update -y

# 安装Node.js 18
curl -sL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# 安装PM2
npm install -g pm2

# 安装Nginx
yum install -y nginx

# 安装PostgreSQL
yum install -y postgresql postgresql-server postgresql-contrib
postgresql-setup initdb
systemctl enable postgresql
systemctl start postgresql

echo "基础环境安装完成"
'@

$installScript | Out-File -FilePath "$deployPath\install-server.sh" -Encoding UTF8

$configScript = @'
#!/bin/bash

echo "配置数据库和应用..."

# 配置数据库
sudo -u postgres psql -c "CREATE USER tradeuser WITH PASSWORD 'TradePass123!';"
sudo -u postgres psql -c "CREATE DATABASE trade_platform OWNER tradeuser;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE trade_platform TO tradeuser;"

# 创建应用目录
mkdir -p /var/www/trade-platform
cp -r * /var/www/trade-platform/
cd /var/www/trade-platform

# 安装后端依赖
cd backend
npm install --production

# 创建环境变量文件
cat > .env << 'EOF'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://tradeuser:TradePass123!@localhost:5432/trade_platform
JWT_SECRET=your-super-secret-jwt-key-for-production-change-this
FRONTEND_URL=https://wwwcn.uk
EOF

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
    env_file: '.env'
  }]
};
EOF

# 运行数据库迁移
npx prisma migrate deploy

# 启动后端
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "后端服务启动完成"
'@

$configScript | Out-File -FilePath "$deployPath\config-app.sh" -Encoding UTF8

$nginxScript = @'
#!/bin/bash

echo "配置Nginx..."

# 创建Nginx配置
cat > /etc/nginx/conf.d/trade-platform.conf << 'EOF'
server {
    listen 80;
    server_name wwwcn.uk www.wwwcn.uk;
    
    location / {
        root /var/www/trade-platform/frontend/build;
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

server {
    listen 80;
    server_name api.wwwcn.uk;
    
    location / {
        proxy_pass http://localhost:5000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

# 测试并启动Nginx
nginx -t
systemctl enable nginx
systemctl start nginx

# 配置防火墙
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload

echo "Nginx配置完成"
'@

$nginxScript | Out-File -FilePath "$deployPath\setup-nginx.sh" -Encoding UTF8

# 创建完整部署脚本
$fullDeployScript = @'
#!/bin/bash

echo "开始完整部署..."

# 执行所有步骤
bash install-server.sh
bash config-app.sh
bash setup-nginx.sh

echo "部署完成！"
echo "访问 http://wwwcn.uk 查看网站"
echo "访问 http://api.wwwcn.uk 查看API"
'@

$fullDeployScript | Out-File -FilePath "$deployPath\deploy-all.sh" -Encoding UTF8

Write-Host "✅ 部署文件准备完成" -ForegroundColor Green
Write-Host ""
Write-Host "📦 部署包位置: $deployPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔄 上传到服务器的步骤:" -ForegroundColor Yellow
Write-Host "1. 打包文件到服务器" -ForegroundColor White
Write-Host "2. SSH连接: ssh root@116.62.44.24" -ForegroundColor White
Write-Host "3. 运行: bash deploy-all.sh" -ForegroundColor White
Write-Host ""
Write-Host "💡 上传命令示例:" -ForegroundColor Cyan
Write-Host "# 方法1: 使用scp" -ForegroundColor Gray
Write-Host "cd $deployPath" -ForegroundColor Gray
Write-Host "tar -czf ../trade-deploy.tar.gz ." -ForegroundColor Gray
Write-Host "scp ../trade-deploy.tar.gz root@116.62.44.24:/tmp/" -ForegroundColor Gray
Write-Host ""
Write-Host "# 方法2: 在服务器上解压并运行" -ForegroundColor Gray
Write-Host "ssh root@116.62.44.24" -ForegroundColor Gray
Write-Host "cd /tmp && tar -xzf trade-deploy.tar.gz" -ForegroundColor Gray
Write-Host "bash deploy-all.sh" -ForegroundColor Gray