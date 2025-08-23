# 🌐 wwwcn.uk 域名配置检查清单

## 📋 概述

本清单帮助您逐步完成wwwcn.uk域名的完整部署配置，确保所有功能正常运行。

---

## 🎯 第一阶段：前期准备

### ✅ 基础环境检查
- [ ] **Node.js 已安装** (版本 16+ 推荐)
  ```bash
  node --version
  npm --version
  ```
- [ ] **Git 已配置** 
  ```bash
  git --version
  git config --global user.name "Your Name"
  git config --global user.email "your@email.com"
  ```
- [ ] **代码仓库已创建** (GitHub/Gitee)
- [ ] **项目依赖已安装**
  ```bash
  npm install
  cd backend && npm install
  cd ../frontend && npm install
  ```

### ✅ 域名准备
- [ ] **wwwcn.uk 域名已在Cloudflare注册**
- [ ] **Cloudflare账号可正常登录**
- [ ] **域名状态为 Active**

---

## 🎯 第二阶段：Cloudflare配置

### ✅ API凭据获取
- [ ] **Zone ID 已获取**
  - 位置：Cloudflare控制台 → 域名概览页面右侧
  - 格式：32位字符串
  
- [ ] **API Token 已创建**
  - 访问：https://dash.cloudflare.com/profile/api-tokens
  - 权限：Zone:Zone:Edit + Zone:DNS:Edit + Zone:Zone Settings:Edit
  - 资源：Include - Specific zone - wwwcn.uk
  
- [ ] **API Token 验证成功**
  ```bash
  curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
    -H "Authorization: Bearer YOUR_API_TOKEN"
  ```

### ✅ DNS记录配置
- [ ] **主域名 A 记录**
  - 名称：`@` (或 wwwcn.uk)
  - 类型：A
  - 内容：您的服务器IP
  - 代理状态：已启用 (橙色云朵)
  
- [ ] **API子域名 A 记录**
  - 名称：`api`
  - 类型：A  
  - 内容：您的服务器IP
  - 代理状态：已启用
  
- [ ] **WWW别名 CNAME 记录**
  - 名称：`www`
  - 类型：CNAME
  - 内容：`wwwcn.uk`
  - 代理状态：已启用

### ✅ SSL/TLS配置
- [ ] **SSL模式设置为 "Full (strict)"**
- [ ] **自动HTTPS重定向已启用**
- [ ] **HSTS已启用**
  - Max Age：1年 (31536000秒)
  - 包含子域名：是
- [ ] **最小TLS版本设置为 1.2**

### ✅ 性能优化配置
- [ ] **Brotli压缩已启用**
- [ ] **Auto Minify已启用**
  - CSS：启用
  - HTML：启用
  - JavaScript：启用
- [ ] **缓存级别设置为 "Standard"**

### ✅ 安全配置
- [ ] **安全级别设置为 "Medium"**
- [ ] **浏览器完整性检查已启用**
- [ ] **DDoS防护已启用**

---

## 🎯 第三阶段：第三方服务配置

### ✅ 高优先级服务（必须配置）

#### 🔐 GitHub OAuth
- [ ] **OAuth应用已创建**
  - 访问：https://github.com/settings/applications
  - Application name：交易平台
  - Homepage URL：`https://wwwcn.uk`
  - Authorization callback URL：`https://api.wwwcn.uk/api/auth/oauth/github/callback`
  
- [ ] **客户端凭据已获取**
  - [ ] Client ID
  - [ ] Client Secret
  
- [ ] **环境变量已配置**
  ```env
  GITHUB_CLIENT_ID=your_client_id
  GITHUB_CLIENT_SECRET=your_client_secret
  GITHUB_REDIRECT_URI=https://api.wwwcn.uk/api/auth/oauth/github/callback
  ```

#### 🗺️ 高德地图API
- [ ] **开发者账号已注册**
  - 网站：https://console.amap.com
  - 实名认证已完成
  
- [ ] **应用已创建**
  - 应用名称：交易平台
  - 应用类型：Web服务
  
- [ ] **API Key已获取**
- [ ] **域名白名单已配置**
  - 添加：`wwwcn.uk`
  - 添加：`api.wwwcn.uk`
  - 添加：`*.wwwcn.uk`
  
- [ ] **环境变量已配置**
  ```env
  AMAP_API_KEY=your_api_key
  ```

#### 💰 支付宝沙箱
- [ ] **蚂蚁金服开放平台账号已注册**
  - 网站：https://open.alipay.com
  
- [ ] **沙箱环境已配置**
  - 访问：https://open.alipay.com/dev/workspace
  
- [ ] **密钥对已生成**
  - 工具：支付宝开放平台助手
  - RSA2密钥对
  
- [ ] **沙箱配置已完成**
  - [ ] App ID
  - [ ] 应用私钥
  - [ ] 支付宝公钥
  - [ ] 回调地址：`https://api.wwwcn.uk/api/payment/alipay/callback`
  
- [ ] **环境变量已配置**
  ```env
  ALIPAY_SANDBOX_APP_ID=your_app_id
  ALIPAY_SANDBOX_PRIVATE_KEY=your_private_key
  ALIPAY_SANDBOX_PUBLIC_KEY=alipay_public_key
  ```

### ✅ 中优先级服务（建议配置）

#### 📱 阿里云短信服务
- [ ] **阿里云账号已注册并实名认证**
- [ ] **短信服务已开通**
- [ ] **AccessKey已创建**
  - 推荐：使用RAM子用户，仅授权短信服务权限
- [ ] **短信签名已申请并通过**
  - 签名名称：交易平台
- [ ] **短信模板已申请并通过**
  - 验证码模板
- [ ] **环境变量已配置**
  ```env
  ALIYUN_SMS_ACCESS_KEY_ID=your_access_key_id
  ALIYUN_SMS_ACCESS_KEY_SECRET=your_access_key_secret
  ALIYUN_SMS_SIGN_NAME=交易平台
  ```

#### 🔐 Google OAuth
- [ ] **Google Cloud项目已创建**
- [ ] **Google+ API已启用**
- [ ] **OAuth客户端ID已创建**
- [ ] **OAuth同意屏幕已配置**
- [ ] **重定向URI已设置**
  - `https://api.wwwcn.uk/api/auth/oauth/google/callback`
- [ ] **环境变量已配置**
  ```env
  GOOGLE_CLIENT_ID=your_client_id
  GOOGLE_CLIENT_SECRET=your_client_secret
  GOOGLE_REDIRECT_URI=https://api.wwwcn.uk/api/auth/oauth/google/callback
  ```

### ✅ 低优先级服务（可选配置）

#### 🗺️ 百度地图API
- [ ] **百度开发者账号已注册**
- [ ] **应用已创建并获取AK**
- [ ] **IP白名单已配置**
- [ ] **环境变量已配置**
  ```env
  BAIDU_MAP_API_KEY=your_ak
  ```

#### 🔐 Gitee OAuth  
- [ ] **Gitee OAuth应用已创建**
- [ ] **回调地址已配置**
- [ ] **环境变量已配置**
  ```env
  GITEE_CLIENT_ID=your_client_id
  GITEE_CLIENT_SECRET=your_client_secret
  GITEE_REDIRECT_URI=https://api.wwwcn.uk/api/auth/oauth/gitee/callback
  ```

#### 💰 微信支付沙箱
- [ ] **微信商户号已申请**
- [ ] **沙箱环境已开通**
- [ ] **回调地址已配置**
- [ ] **环境变量已配置**
  ```env
  WECHAT_SANDBOX_APP_ID=your_app_id
  WECHAT_SANDBOX_MCH_ID=your_mch_id
  WECHAT_SANDBOX_API_KEY=your_api_key
  ```

---

## 🎯 第四阶段：应用部署

### ✅ 环境变量配置
- [ ] **生产环境变量文件已创建**
  - 文件：`.env.production`
  - 基于：`.env.wwwcn.uk` 模板
  
- [ ] **基础配置已设置**
  ```env
  NODE_ENV=production
  FRONTEND_URL=https://wwwcn.uk
  BACKEND_URL=https://api.wwwcn.uk
  CORS_ORIGIN=https://wwwcn.uk
  ```
  
- [ ] **JWT密钥已配置**
  ```env
  JWT_SECRET=32位随机字符串
  JWT_REFRESH_SECRET=32位随机字符串
  SESSION_SECRET=32位随机字符串
  ```

### ✅ 数据库配置
- [ ] **数据库服务已选择**
  - [ ] Railway PostgreSQL
  - [ ] PlanetScale MySQL
  - [ ] Render PostgreSQL
  - [ ] 阿里云RDS
  
- [ ] **数据库连接字符串已配置**
  ```env
  DATABASE_URL=postgresql://user:password@host:port/database
  ```
  
- [ ] **数据库迁移已执行**
  ```bash
  npx prisma migrate deploy
  ```

### ✅ 应用构建
- [ ] **后端构建成功**
  ```bash
  cd backend
  npm run build
  ```
  
- [ ] **前端构建成功**
  ```bash
  cd frontend  
  npm run build
  ```
  
- [ ] **构建产物已生成**
  - 后端：`backend/dist/`
  - 前端：`frontend/build/`

### ✅ 部署平台配置

#### Railway部署
- [ ] **Railway项目已创建**
- [ ] **GitHub仓库已连接**
- [ ] **PostgreSQL服务已添加**
- [ ] **环境变量已配置**
- [ ] **自定义域名已设置**
  - `api.wwwcn.uk`
- [ ] **部署成功**

#### Vercel + PlanetScale部署
- [ ] **PlanetScale数据库已创建**
- [ ] **前端已部署到Vercel**
- [ ] **后端已部署到Vercel**
- [ ] **自定义域名已配置**
  - 前端：`wwwcn.uk`
  - 后端：`api.wwwcn.uk`

#### Render部署
- [ ] **PostgreSQL数据库已创建**
- [ ] **Web Service已创建**
- [ ] **环境变量已配置**
- [ ] **自定义域名已设置**

#### 阿里云ECS部署
- [ ] **ECS实例已购买并配置**
- [ ] **安全组已设置**
  - 开放端口：22, 80, 443, 5000
- [ ] **运行环境已安装**
  - Node.js, Docker, Nginx
- [ ] **应用已部署**
- [ ] **SSL证书已配置**
- [ ] **Nginx反向代理已配置**

---

## 🎯 第五阶段：功能验证

### ✅ 基础功能测试
- [ ] **域名解析正常**
  ```bash
  nslookup wwwcn.uk
  nslookup api.wwwcn.uk
  ```
  
- [ ] **SSL证书有效**
  ```bash
  curl -I https://wwwcn.uk
  curl -I https://api.wwwcn.uk
  ```
  
- [ ] **API健康检查通过**
  ```bash
  curl https://api.wwwcn.uk/api/health
  ```

### ✅ 前端功能测试
- [ ] **页面正常访问**
  - https://wwwcn.uk
  - https://www.wwwcn.uk (重定向到主域名)
  
- [ ] **静态资源加载正常**
  - CSS、JS、图片文件
  
- [ ] **API调用正常**
  - 在浏览器开发者工具中检查网络请求

### ✅ 认证功能测试
- [ ] **GitHub OAuth登录正常**
  - 点击登录按钮
  - 跳转到GitHub授权页面
  - 授权后正确回调
  - 用户信息正确获取
  
- [ ] **Google OAuth登录正常**（如已配置）
  
- [ ] **Gitee OAuth登录正常**（如已配置）

### ✅ 地图功能测试
- [ ] **地理位置API正常**
  ```bash
  curl "https://api.wwwcn.uk/api/location/status"
  ```
  
- [ ] **地址解析功能正常**
  ```bash
  curl -X POST "https://api.wwwcn.uk/api/location/geocode" \
    -H "Content-Type: application/json" \
    -d '{"address":"北京市朝阳区"}'
  ```
  
- [ ] **逆地址解析功能正常**
- [ ] **POI搜索功能正常**

### ✅ 支付功能测试
- [ ] **支付宝沙箱创建订单正常**
- [ ] **支付回调处理正常**
- [ ] **订单状态查询正常**

### ✅ 通知功能测试
- [ ] **短信发送功能正常**（如已配置阿里云短信）
- [ ] **邮件发送功能正常**
- [ ] **应用内通知正常**

### ✅ 中国访问测试
- [ ] **域名在中国可访问**
  - 使用：https://ping.chinaz.com/wwwcn.uk
  
- [ ] **访问速度可接受**
  - 延迟通常在 100-200ms
  
- [ ] **功能在中国环境正常**
  - 请中国朋友帮助测试

---

## 🎯 第六阶段：性能与安全

### ✅ 性能优化
- [ ] **CDN缓存正常工作**
- [ ] **静态资源压缩已启用**
- [ ] **页面加载时间可接受**
  - 首页加载 < 3秒
  - API响应 < 1秒
  
- [ ] **数据库查询优化**
  - 索引已创建
  - 慢查询已优化

### ✅ 安全配置
- [ ] **HTTPS强制重定向已启用**
- [ ] **安全头已配置**
  - HSTS
  - X-Frame-Options
  - X-Content-Type-Options
  
- [ ] **API限流已配置**
- [ ] **SQL注入防护已启用**
- [ ] **XSS防护已启用**

### ✅ 监控配置
- [ ] **错误日志监控**
- [ ] **性能监控**
- [ ] **用量监控**
- [ ] **安全事件监控**

---

## 🎯 第七阶段：备份与维护

### ✅ 备份策略
- [ ] **数据库自动备份已配置**
- [ ] **代码仓库已备份**
- [ ] **环境变量已安全存储**
- [ ] **SSL证书自动续期已配置**

### ✅ 文档完善
- [ ] **API文档已更新**
- [ ] **部署文档已完善**
- [ ] **故障排除指南已准备**
- [ ] **用户手册已编写**

---

## 📞 联系支持

如果在配置过程中遇到问题，请参考以下资源：

### 📖 文档资源
- **Cloudflare API配置**: `docs/CLOUDFLARE_API_SETUP.md`
- **第三方服务申请**: `docs/THIRD_PARTY_SERVICES_GUIDE.md`
- **应用部署指南**: `docs/APPLICATION_DEPLOYMENT_GUIDE.md`
- **域名部署指南**: `docs/WWWCN_UK_DEPLOYMENT_GUIDE.md`

### 🛠️ 自动化工具
- **配置向导**: `node scripts/setup-services.js`
- **Cloudflare配置**: `deploy-cloudflare.bat`
- **快速开始**: `quick-start.bat`

### 🌐 官方支持
- **Cloudflare**: https://support.cloudflare.com
- **GitHub**: https://support.github.com  
- **高德地图**: https://lbs.amap.com/dev/ticket
- **支付宝**: https://open.alipay.com/dev/workspace
- **阿里云**: https://workorder.console.aliyun.com

---

## 🎉 配置完成

恭喜！如果您已完成上述所有检查项，您的wwwcn.uk域名交易平台已经可以为全球用户（包括中国用户）提供稳定的服务了！

### 🚀 下一步建议
1. **监控和优化**：定期检查性能和错误日志
2. **功能扩展**：根据用户反馈添加新功能
3. **安全更新**：定期更新依赖和安全配置
4. **用户支持**：建立用户反馈和支持渠道

---

**📝 最后更新**: 2024年8月23日  
**🔄 版本**: v1.0  
**👥 适用于**: wwwcn.uk域名交易平台部署