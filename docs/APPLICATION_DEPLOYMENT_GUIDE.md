# 应用部署配置详细指南

## 🚀 部署方案概览

基于wwwcn.uk域名，提供多种免费部署方案：

### 推荐方案排序
1. **Railway + PostgreSQL** - 最简单，$5/月免费额度
2. **Vercel + PlanetScale** - 前后端分离，适合高并发
3. **Render + PostgreSQL** - 完全免费，构建时间较长
4. **阿里云ECS** - 适合国内用户，新用户3个月免费

---

## 🎯 方案一：Railway 部署（推荐）

### 优势
- ✅ 一键部署，支持自动HTTPS
- ✅ 集成PostgreSQL数据库
- ✅ $5/月免费额度，足够小型项目
- ✅ 支持自定义域名
- ✅ 自动从Git部署

### 部署步骤

#### 1. 准备代码仓库
```bash
# 确保代码已推送到GitHub
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

#### 2. 配置Railway项目
1. **注册Railway**
   - 访问：https://railway.app
   - 使用GitHub账号登录

2. **创建新项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择您的trade项目仓库

3. **配置服务**
   - Railway会自动检测到Node.js项目
   - 确认根目录有package.json

#### 3. 添加PostgreSQL数据库
1. 在项目中点击 "Add a Service"
2. 选择 "Database" → "PostgreSQL"
3. Railway会自动创建数据库并提供连接字符串

#### 4. 配置环境变量
在Railway项目设置中添加环境变量：

```env
# 基础配置
NODE_ENV=production
PORT=5000

# 域名配置
FRONTEND_URL=https://wwwcn.uk
BACKEND_URL=https://api.wwwcn.uk

# 数据库连接（Railway自动提供）
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT配置（生成32位随机字符串）
JWT_SECRET=your-super-secure-jwt-secret-32chars
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-32chars

# 第三方服务配置（使用您申请的密钥）
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=https://api.wwwcn.uk/api/auth/oauth/github/callback

AMAP_API_KEY=your_amap_api_key

ALIPAY_SANDBOX_APP_ID=your_alipay_app_id
ALIPAY_SANDBOX_PRIVATE_KEY=your_alipay_private_key
ALIPAY_SANDBOX_PUBLIC_KEY=your_alipay_public_key

# 可选服务（根据申请情况添加）
ALIYUN_SMS_ACCESS_KEY_ID=your_aliyun_access_key_id
ALIYUN_SMS_ACCESS_KEY_SECRET=your_aliyun_access_key_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

#### 5. 配置自定义域名
1. 在Railway项目设置中找到 "Domains"
2. 点击 "Custom Domain"
3. 添加 `api.wwwcn.uk`
4. Railway会提供CNAME记录，需要在Cloudflare中配置

#### 6. 部署验证
```bash
# 检查部署状态
curl https://your-railway-app.railway.app/api/health

# 检查自定义域名
curl https://api.wwwcn.uk/api/health
```

---

## 🎯 方案二：Vercel + PlanetScale 部署

### 优势
- ✅ 完全免费
- ✅ 全球CDN加速
- ✅ 自动HTTPS和域名配置
- ✅ 前后端分离，性能优异

### 部署步骤

#### 1. 分离前后端代码
```bash
# 创建独立的前端仓库
mkdir trade-frontend
cp -r frontend/* trade-frontend/
cd trade-frontend
git init
git add .
git commit -m "Initial frontend commit"
git remote add origin https://github.com/yourusername/trade-frontend.git
git push -u origin main

# 后端保持在原仓库
cd ../
# 确保backend目录在根目录
```

#### 2. 配置PlanetScale数据库
1. **注册PlanetScale**
   - 访问：https://planetscale.com
   - 使用GitHub账号注册

2. **创建数据库**
   - 点击 "Create database"
   - 数据库名称：`trade-platform`
   - 区域选择：`us-east`

3. **获取连接字符串**
   - 在数据库dashboard中点击 "Connect"
   - 选择 "Prisma" 
   - 复制连接字符串

#### 3. 部署后端到Vercel
1. **安装Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **配置vercel.json**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "backend/src/server.ts",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "backend/src/server.ts"
       }
     ],
     "env": {
       "NODE_ENV": "production"
     }
   }
   ```

3. **部署命令**
   ```bash
   vercel --prod
   ```

#### 4. 部署前端到Vercel
```bash
cd trade-frontend
vercel --prod
```

#### 5. 配置自定义域名
1. 在Vercel项目设置中添加域名：
   - 后端：`api.wwwcn.uk`
   - 前端：`wwwcn.uk`
2. 在Cloudflare中添加CNAME记录指向Vercel

---

## 🎯 方案三：Render 部署

### 优势
- ✅ 完全免费
- ✅ 支持PostgreSQL
- ✅ 自动从Git部署
- ✅ 内置SSL证书

### 部署步骤

#### 1. 注册Render
- 访问：https://render.com
- 使用GitHub账号注册

#### 2. 创建PostgreSQL数据库
1. 点击 "New" → "PostgreSQL"
2. 配置信息：
   ```
   Name: trade-platform-db
   Database: trade_platform
   User: trade_user
   Region: Oregon (US West)
   ```

#### 3. 创建Web Service
1. 点击 "New" → "Web Service"
2. 连接GitHub仓库
3. 配置信息：
   ```
   Name: trade-platform-api
   Environment: Node
   Build Command: cd backend && npm install && npm run build
   Start Command: cd backend && npm start
   ```

#### 4. 配置环境变量
在Render服务设置中添加所有必需的环境变量

#### 5. 配置自定义域名
在Render服务设置中添加 `api.wwwcn.uk`

---

## 🎯 方案四：阿里云ECS部署

### 优势
- ✅ 国内访问速度快
- ✅ 新用户3个月免费
- ✅ 完全控制服务器环境
- ✅ 支持Docker部署

### 部署步骤

#### 1. 购买ECS实例
1. 访问阿里云ECS控制台
2. 选择实例规格：
   ```
   实例类型: t5.small (1核2GB)
   操作系统: CentOS 7.9
   网络: 按量付费
   安全组: 开放22, 80, 443, 5000端口
   ```

#### 2. 配置服务器环境
```bash
# 连接服务器
ssh root@your_server_ip

# 更新系统
yum update -y

# 安装Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# 安装Docker
yum install -y docker
systemctl start docker
systemctl enable docker

# 安装docker-compose
curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

#### 3. 部署应用
```bash
# 克隆代码
git clone https://github.com/yourusername/trade-platform.git
cd trade-platform

# 配置环境变量
cp .env.wwwcn.uk .env.production

# 使用Docker部署
docker-compose up -d
```

#### 4. 配置Nginx反向代理
```bash
# 安装Nginx
yum install -y nginx

# 配置Nginx
cat > /etc/nginx/conf.d/trade-platform.conf << EOF
server {
    listen 80;
    server_name api.wwwcn.uk;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# 启动Nginx
systemctl start nginx
systemctl enable nginx
```

#### 5. 配置SSL证书
```bash
# 安装Certbot
yum install -y certbot python3-certbot-nginx

# 申请SSL证书
certbot --nginx -d api.wwwcn.uk

# 设置自动续期
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

---

## 📋 部署后验证清单

### 基础功能验证
```bash
# 1. 健康检查
curl https://api.wwwcn.uk/api/health

# 2. 数据库连接
curl https://api.wwwcn.uk/api/users/profile (需要认证)

# 3. 第三方服务
curl https://api.wwwcn.uk/api/location/status
```

### 前端功能验证
```bash
# 1. 页面访问
curl -I https://wwwcn.uk

# 2. API调用
# 在浏览器开发者工具中检查网络请求

# 3. OAuth登录
# 实际测试GitHub登录流程
```

### 性能和安全验证
```bash
# 1. SSL证书检查
openssl s_client -connect api.wwwcn.uk:443 -servername api.wwwcn.uk

# 2. 响应时间测试
curl -w "@curl-format.txt" -o /dev/null -s https://api.wwwcn.uk/api/health

# 3. 安全头检查
curl -I https://api.wwwcn.uk/api/health
```

---

## 🔧 故障排除

### 常见问题

#### 1. 域名解析问题
```bash
# 检查DNS解析
dig api.wwwcn.uk
nslookup api.wwwcn.uk

# 清除DNS缓存
ipconfig /flushdns  # Windows
sudo dscacheutil -flushcache  # macOS
```

#### 2. SSL证书问题
- 等待DNS传播（通常5-10分钟）
- 检查Cloudflare SSL模式设置
- 验证服务器端SSL配置

#### 3. 数据库连接问题
```bash
# 检查数据库连接字符串
node -e "console.log(process.env.DATABASE_URL)"

# 测试数据库连接
npx prisma db push
```

#### 4. 环境变量问题
```bash
# 检查环境变量是否正确设置
node -e "console.log(process.env.GITHUB_CLIENT_ID)"

# 重新部署应用
# 各平台都有重新部署按钮
```

---

## 📊 监控和维护

### 1. 日志监控
```bash
# 查看应用日志
tail -f /var/log/trade-platform.log

# 查看访问日志
tail -f /var/log/nginx/access.log
```

### 2. 性能监控
```javascript
// 添加到前端应用
if ('performance' in window) {
  window.addEventListener('load', () => {
    const timing = performance.timing;
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    console.log('页面加载时间:', loadTime + 'ms');
  });
}
```

### 3. 错误监控
```javascript
// 全局错误捕获
window.addEventListener('error', (event) => {
  fetch('/api/log/error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      url: window.location.href,
      timestamp: new Date().toISOString()
    })
  });
});
```

### 4. 备份策略
```bash
# 数据库备份
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# 文件备份
tar -czf backup_files_$(date +%Y%m%d).tar.gz /path/to/uploads

# 自动备份脚本
echo "0 2 * * * /path/to/backup.sh" | crontab -
```

---

## 🎯 下一步优化

### 1. 性能优化
- [ ] 启用CDN缓存
- [ ] 图片压缩和WebP格式
- [ ] 代码分割和懒加载
- [ ] Redis缓存集成

### 2. 安全加固
- [ ] WAF防火墙规则
- [ ] API限流配置
- [ ] 安全头设置
- [ ] 定期安全扫描

### 3. 功能扩展
- [ ] PWA支持
- [ ] 多语言国际化
- [ ] 移动端适配
- [ ] 微信小程序版本

### 4. 运维自动化
- [ ] CI/CD流水线
- [ ] 自动化测试
- [ ] 监控告警
- [ ] 灰度发布

---

**🎉 恭喜！您的wwwcn.uk交易平台现在已经可以为全球用户提供稳定的服务了！**