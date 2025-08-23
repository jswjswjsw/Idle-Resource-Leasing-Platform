# Cloudflare 自动配置使用指南

## 方法1：使用批处理脚本（Windows推荐）

### 步骤1：打开PowerShell或命令提示符
```cmd
# 切换到项目目录
cd "d:\project\trade"
```

### 步骤2：设置环境变量（临时）
```cmd
# 设置API Token（替换为您的实际Token）
set CLOUDFLARE_API_TOKEN=your_actual_api_token_here

# 设置Zone ID（替换为您的实际Zone ID）
set CLOUDFLARE_ZONE_ID=your_actual_zone_id_here

# 设置服务器IP（如果已有服务器）
set SERVER_IP=your_server_ip_address
```

### 步骤3：运行配置脚本
```cmd
.\deploy-cloudflare.bat
```

## 方法2：手动配置DNS记录

如果自动脚本遇到问题，可以手动在Cloudflare控制台配置：

### DNS记录配置
1. 登录Cloudflare控制台
2. 选择 `wwwcn.uk` 域名
3. 进入 "DNS" 页面
4. 添加以下记录：

| 类型 | 名称 | 内容 | 代理状态 | TTL |
|------|------|------|----------|-----|
| A | @ | 您的服务器IP | 已代理 | 自动 |
| A | api | 您的服务器IP | 已代理 | 自动 |
| CNAME | www | wwwcn.uk | 已代理 | 自动 |

### SSL/TLS配置
1. 进入 "SSL/TLS" → "概述"
2. 设置加密模式为 "Full (strict)"
3. 启用 "始终使用HTTPS"

### 性能优化配置
1. 进入 "速度" → "优化"
2. 启用以下选项：
   - Auto Minify (CSS, HTML, JS)
   - Brotli压缩
   - 早期提示

### 安全配置
1. 进入 "安全性" → "设置"
2. 设置安全级别为 "中等"
3. 启用 "浏览器完整性检查"

## 验证配置

### 检查DNS解析
```cmd
# 检查主域名
nslookup wwwcn.uk

# 检查API子域名
nslookup api.wwwcn.uk

# 检查WWW别名
nslookup www.wwwcn.uk
```

### 检查SSL证书
```cmd
# 使用curl检查HTTPS
curl -I https://wwwcn.uk
curl -I https://api.wwwcn.uk
```

## 常见问题解决

### 问题1：API Token验证失败
- 检查Token权限是否正确设置
- 确认Zone ID是否匹配
- 检查Token是否已过期

### 问题2：DNS记录无法创建
- 检查是否已存在同名记录
- 确认服务器IP地址格式正确
- 尝试先删除现有记录再重新创建

### 问题3：SSL证书错误
- 等待5-10分钟让DNS传播生效
- 检查服务器是否正确配置SSL
- 考虑使用Cloudflare的"Flexible"模式作为临时方案