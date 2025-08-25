#!/bin/bash

# 为阿里云ECS安装Let's Encrypt免费SSL证书
# 支持 wwwcn.uk 和 api.wwwcn.uk

echo "🔒 Installing Free SSL Certificate with Let's Encrypt"
echo "=================================================="

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# 域名配置
DOMAIN="wwwcn.uk"
API_DOMAIN="api.wwwcn.uk"
EMAIL="admin@wwwcn.uk"  # 替换为您的邮箱

echo "📋 Configuration:"
echo "  Main domain: $DOMAIN"
echo "  API domain: $API_DOMAIN"
echo "  Email: $EMAIL"
echo ""

# 更新系统
echo "📦 Updating system packages..."
yum update -y

# 安装EPEL仓库
echo "📦 Installing EPEL repository..."
yum install -y epel-release

# 安装Certbot
echo "📦 Installing Certbot..."
yum install -y certbot python3-certbot-nginx

# 检查Nginx是否安装
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing Nginx..."
    yum install -y nginx
    systemctl enable nginx
fi

# 创建基本Nginx配置
echo "⚙️ Creating basic Nginx configuration..."

# 主域名配置
cat > /etc/nginx/conf.d/wwwcn.conf << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Let's Encrypt验证路径
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # 临时主页
    location / {
        root /var/www/html;
        index index.html;
        try_files \$uri \$uri/ =404;
    }
}

server {
    listen 80;
    server_name $API_DOMAIN;
    
    # Let's Encrypt验证路径
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # API反向代理（临时关闭HTTPS要求）
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# 创建Web根目录
mkdir -p /var/www/html

# 创建临时主页
cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Trade Platform</title>
    <meta charset="utf-8">
</head>
<body>
    <h1>🚀 Trade Platform</h1>
    <p>网站正在配置SSL证书，请稍候...</p>
    <p>Website is configuring SSL certificate, please wait...</p>
</body>
</html>
EOF

# 测试Nginx配置
echo "🔧 Testing Nginx configuration..."
nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Nginx configuration error"
    exit 1
fi

# 启动Nginx
echo "🔧 Starting Nginx..."
systemctl start nginx
systemctl enable nginx

# 检查防火墙
echo "🔧 Configuring firewall..."
if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
fi

# 等待DNS传播
echo "⏳ Waiting for DNS propagation..."
echo "Please ensure your domains point to this server:"
echo "  $DOMAIN -> $(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')"
echo "  $API_DOMAIN -> $(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')"
echo ""

read -p "Press Enter when DNS is ready (you can test with: nslookup $DOMAIN)..."

# 申请SSL证书
echo "🔒 Requesting SSL certificate from Let's Encrypt..."

# 使用webroot方式申请证书
certbot certonly \
    --webroot \
    --webroot-path=/var/www/html \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN \
    -d $API_DOMAIN \
    --non-interactive

if [ $? -eq 0 ]; then
    echo "✅ SSL certificate obtained successfully!"
else
    echo "❌ Failed to obtain SSL certificate"
    echo "Please check:"
    echo "1. DNS records are correctly pointing to this server"
    echo "2. Ports 80 and 443 are open"
    echo "3. Domain is accessible from internet"
    exit 1
fi

# 更新Nginx配置支持HTTPS
echo "⚙️ Updating Nginx configuration for HTTPS..."

cat > /etc/nginx/conf.d/wwwcn.conf << EOF
# HTTP重定向到HTTPS
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN $API_DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

# 主域名HTTPS
server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL证书配置
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    
    # 网站内容
    location / {
        root /var/www/html;
        index index.html;
        try_files \$uri \$uri/ =404;
    }
}

# API域名HTTPS
server {
    listen 443 ssl http2;
    server_name $API_DOMAIN;
    
    # SSL证书配置
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # API反向代理
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Host \$host;
    }
}
EOF

# 测试新配置
echo "🔧 Testing new Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    # 重载Nginx
    systemctl reload nginx
    echo "✅ Nginx reloaded with SSL configuration"
else
    echo "❌ Nginx configuration error"
    exit 1
fi

# 设置自动续期
echo "⚙️ Setting up automatic certificate renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

echo ""
echo "🎉 SSL Certificate Installation Complete!"
echo "========================================"
echo ""
echo "✅ Your websites are now secured:"
echo "  🌐 https://$DOMAIN"
echo "  🌐 https://www.$DOMAIN"  
echo "  🌐 https://$API_DOMAIN"
echo ""
echo "📋 SSL Certificate Details:"
echo "  📍 Certificate Path: /etc/letsencrypt/live/$DOMAIN/"
echo "  🔄 Auto-renewal: Enabled (runs daily at 12:00)"
echo "  📅 Valid for: 90 days (auto-renews at 30 days)"
echo ""
echo "🔧 Next Steps:"
echo "1. Set Cloudflare SSL mode to 'Full (strict)'"
echo "2. Deploy your application"
echo "3. Test HTTPS access"
echo ""
echo "🛡️ SSL Grade: A+ (with HSTS enabled)"