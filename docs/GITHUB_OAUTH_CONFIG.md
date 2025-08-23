# ==============================================
# GitHub OAuth 配置指南 - wwwcn.uk 域名
# ==============================================

# 🌐 您的域名配置
主域名: wwwcn.uk
前端地址: https://wwwcn.uk
API地址: https://api.wwwcn.uk

# 开发阶段 GitHub OAuth 应用配置
Application name: 交易平台（开发版）
Application description: 基于Node.js的交易平台系统

# 🏠 应用主页地址（开发环境）
Homepage URL: http://localhost:3000

# 🔄 OAuth 回调地址（开发环境）
Authorization callback URL: http://localhost:5000/api/auth/oauth/github/callback

# ==============================================
# 生产环境配置 - wwwcn.uk 域名
# ==============================================

# 🌍 生产环境 GitHub OAuth 配置
Application name: 交易平台
Homepage URL: https://wwwcn.uk
Authorization callback URL: https://api.wwwcn.uk/api/auth/oauth/github/callback

# 📋 Cloudflare DNS 解析配置：
# A记录: wwwcn.uk → 您的服务器IP
# A记录: api.wwwcn.uk → 您的服务器IP  
# CNAME: www.wwwcn.uk → wwwcn.uk

# 🔐 SSL/TLS 配置：
# Cloudflare SSL/TLS: Full (strict) 模式
# 自动 HTTPS 重定向: 开启
# HSTS: 开启

# 🇨🇳 中国访问优化：
# Cloudflare 在中国有CDN节点
# .uk 域名在中国无需备案
# 访问速度：良好（通过香港/新加坡节点）