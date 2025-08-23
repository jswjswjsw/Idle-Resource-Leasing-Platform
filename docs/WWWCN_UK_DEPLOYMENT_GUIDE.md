# 🌐 wwwcn.uk 域名部署指南

## 📋 概述

恭喜您选择了 `wwwcn.uk` 域名！这是一个完美的选择，因为：

✅ **.uk 域名无需备案** - 中国用户可以直接访问  
✅ **Cloudflare CDN 支持** - 全球加速，包括中国周边节点  
✅ **访问稳定** - 通过香港/新加坡节点，延迟100-200ms  
✅ **完全合规** - 符合中国网络访问规定  

## 🇨🇳 中国访问情况

### ✅ 访问优势
- **无需备案**: .uk 域名在中国无需ICP备案
- **CDN加速**: Cloudflare 在中国周边有服务节点
- **访问路径**: 中国用户 → Cloudflare香港节点 → 您的服务器
- **延迟表现**: 通常 100-200ms，完全可用于生产环境
- **稳定性好**: .uk 域名访问非常稳定

### 🌍 访问测试
您可以通过以下方式测试中国访问：
1. **在线工具**: 使用 ping.chinaz.com 等工具测试
2. **本地测试**: 请中国朋友帮忙测试访问速度
3. **CDN监控**: Cloudflare 控制台查看访问统计

## 🚀 部署步骤

### 第一步：获取 Cloudflare API 凭据

1. **访问 Cloudflare 控制台**
   - 登录：https://dash.cloudflare.com
   - 选择您的 `wwwcn.uk` 域名

2. **获取 Zone ID**
   - 在域名概览页面右侧找到 "Zone ID"
   - 复制保存这个ID

3. **创建 API Token**
   - 访问：https://dash.cloudflare.com/profile/api-tokens
   - 点击 "Create Token"
   - 选择 "Custom token"
   - 设置权限：
     - `Zone:Zone:Edit`
     - `Zone:DNS:Edit`
     - `Zone:Zone Settings:Edit`
   - Zone Resources: `Include - Specific zone - wwwcn.uk`
   - 创建并复制Token

### 第二步：运行自动配置脚本

```batch
# Windows 用户
cd "d:\project\trade"
.\deploy-cloudflare.bat

# Linux/Mac 用户  
cd /path/to/your/project
chmod +x deploy-cloudflare.sh
./deploy-cloudflare.sh
```

脚本会自动配置：
- ✅ DNS 解析记录
- ✅ SSL/TLS 设置
- ✅ 性能优化
- ✅ 安全配置

### 第三步：部署应用到服务器

#### 选项1：使用免费云服务
```bash
# Railway 部署
git push railway main

# Vercel 部署 (前端)
vercel deploy --prod

# Render 部署
git push render main
```

#### 选项2：VPS/云服务器部署
```bash
# 克隆代码
git clone https://github.com/your-username/trade-platform.git
cd trade-platform

# 安装依赖
npm install

# 配置环境变量
cp .env.wwwcn.uk .env.production

# 构建项目
npm run build

# 启动生产服务
npm run start:production
```

### 第四步：更新第三方服务回调地址

#### GitHub OAuth
1. 访问：https://github.com/settings/applications
2. 编辑您的 OAuth App
3. 更新回调URL：
   - Homepage URL: `https://wwwcn.uk`
   - Authorization callback URL: `https://api.wwwcn.uk/api/auth/oauth/github/callback`

#### 高德地图
1. 访问：https://console.amap.com/dev/key/app
2. 编辑应用
3. 添加域名白名单：`wwwcn.uk`, `api.wwwcn.uk`

#### 支付宝沙箱
1. 访问：https://open.alipay.com/dev/workspace
2. 更新回调地址：`https://api.wwwcn.uk/api/payment/alipay/callback`

## 📋 配置检查清单

### DNS 解析配置
- [ ] `wwwcn.uk` → 服务器IP (A记录)
- [ ] `api.wwwcn.uk` → 服务器IP (A记录)  
- [ ] `www.wwwcn.uk` → `wwwcn.uk` (CNAME记录)

### SSL/TLS 配置
- [ ] SSL模式：Full (strict)
- [ ] 自动HTTPS重定向：启用
- [ ] HSTS：启用
- [ ] 最小TLS版本：1.2

### 性能优化
- [ ] Brotli压缩：启用
- [ ] Auto Minify：启用
- [ ] 缓存设置：标准

### 安全配置
- [ ] 防火墙规则：配置
- [ ] DDoS防护：启用
- [ ] Web应用防火墙：启用

## 🔧 环境变量配置

使用提供的 `.env.wwwcn.uk` 文件：

```env
# 基础配置
FRONTEND_URL=https://wwwcn.uk
BACKEND_URL=https://api.wwwcn.uk

# GitHub OAuth
GITHUB_REDIRECT_URI=https://api.wwwcn.uk/api/auth/oauth/github/callback

# Google OAuth  
GOOGLE_REDIRECT_URI=https://api.wwwcn.uk/api/auth/oauth/google/callback

# Gitee OAuth
GITEE_REDIRECT_URI=https://api.wwwcn.uk/api/auth/oauth/gitee/callback
```

## 🧪 测试验证

### 1. 域名解析测试
```bash
# 测试主域名
nslookup wwwcn.uk

# 测试API子域名
nslookup api.wwwcn.uk
```

### 2. SSL证书测试
```bash
# 检查SSL证书
openssl s_client -connect wwwcn.uk:443 -servername wwwcn.uk
```

### 3. 功能测试
```bash
# 测试API健康检查
curl https://api.wwwcn.uk/api/health

# 测试前端页面
curl -I https://wwwcn.uk
```

### 4. 中国访问测试
- 使用 https://ping.chinaz.com/wwwcn.uk 测试全国访问
- 使用 https://www.ipip.net/ping.php 测试延迟
- 请中国朋友实际访问测试

## 📊 监控和维护

### Cloudflare 分析
- 访问：https://dash.cloudflare.com
- 查看流量统计
- 监控安全事件
- 检查缓存命中率

### 性能监控
```javascript
// 在前端添加性能监控
if ('performance' in window) {
  window.addEventListener('load', () => {
    const timing = performance.timing;
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    console.log('页面加载时间:', loadTime + 'ms');
  });
}
```

### 错误监控
```javascript
// 全局错误捕获
window.addEventListener('error', (event) => {
  // 发送错误到监控服务
  fetch('/api/log/error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      url: window.location.href
    })
  });
});
```

## 🔍 故障排除

### 常见问题

#### 1. 域名无法访问
```bash
# 检查DNS解析
nslookup wwwcn.uk
# 确保返回您的服务器IP
```

#### 2. SSL证书错误
- 检查Cloudflare SSL模式是否为 "Full (strict)"
- 确保服务器安装了有效的SSL证书
- 或使用Cloudflare的"Flexible"模式（不推荐生产环境）

#### 3. 中国访问慢
- 检查Cloudflare CDN是否启用
- 确保静态资源正确缓存
- 考虑使用Cloudflare的"Argo Smart Routing"（付费功能）

#### 4. API跨域问题
```javascript
// 确保后端CORS配置正确
app.use(cors({
  origin: ['https://wwwcn.uk', 'https://www.wwwcn.uk'],
  credentials: true
}));
```

## 📞 技术支持

### 联系方式
- **Cloudflare支持**: https://support.cloudflare.com
- **域名续费**: 通过Cloudflare管理界面
- **技术问题**: 查看项目文档或提交Issue

### 有用链接
- **Cloudflare 状态页**: https://www.cloudflarestatus.com
- **DNS 传播检查**: https://dnschecker.org
- **SSL 测试工具**: https://www.ssllabs.com/ssltest/

## 🎯 下一步规划

### 1. 性能优化
- [ ] 启用 CDN 缓存策略
- [ ] 图片压缩和 WebP 格式
- [ ] 代码分割和懒加载
- [ ] Service Worker 离线缓存

### 2. SEO 优化
- [ ] 添加 sitemap.xml
- [ ] 配置 robots.txt
- [ ] Meta 标签优化
- [ ] 结构化数据标记

### 3. 用户体验
- [ ] PWA 支持
- [ ] 多语言支持
- [ ] 响应式设计优化
- [ ] 加载动画和骨架屏

### 4. 安全加固
- [ ] CSP 内容安全策略
- [ ] XSS 防护
- [ ] CSRF 保护
- [ ] 输入验证和过滤

---

🎉 **恭喜！您的 wwwcn.uk 域名现在可以为全球用户（包括中国用户）提供稳定的服务了！**