# 安全配置指南

本文档指导您如何安全地配置项目所需的环境变量和敏感信息。

## 📋 目录

- [环境变量配置](#环境变量配置)
- [密钥管理最佳实践](#密钥管理最佳实践)
- [部署安全配置](#部署安全配置)
- [常见安全问题](#常见安全问题)
- [故障排除](#故障排除)

## 🔐 环境变量配置

### 1. 创建环境变量文件

```bash
# 复制模板文件
cp .env.example .env

# 编辑环境变量文件
notepad .env  # Windows
# 或
vim .env     # Linux/macOS
```

### 2. 必需的环境变量

#### Cloudflare 配置

```bash
# 获取 Cloudflare API Token
# 1. 登录 Cloudflare Dashboard
# 2. 转到 "My Profile" > "API Tokens"
# 3. 创建自定义令牌，权限：Zone:Edit
CLOUDFLARE_API_TOKEN=your_actual_token_here

# Zone ID 可在域名概览页面找到
CLOUDFLARE_ZONE_ID=8ad887047518bc2772572ade96309c55
```

#### 阿里云配置

```bash
# 阿里云访问控制台获取
# https://ram.console.aliyun.com/manage/ak
ALIYUN_ACCESS_KEY_ID=your_access_key_id
ALIYUN_ACCESS_KEY_SECRET=your_access_key_secret

# 短信服务专用密钥（可选，如果与主密钥不同）
ALIYUN_SMS_ACCESS_KEY_ID=your_sms_access_key_id
ALIYUN_SMS_ACCESS_KEY_SECRET=your_sms_access_key_secret
```

#### 数据库配置

```bash
# PostgreSQL 连接字符串
DATABASE_URL=postgresql://username:password@host:port/database

# Redis 连接字符串
REDIS_URL=redis://host:port
```

#### 应用安全配置

```bash
# JWT 密钥（请生成强随机字符串）
JWT_SECRET=$(openssl rand -base64 32)

# 会话密钥
SESSION_SECRET=$(openssl rand -base64 32)
```

### 3. Windows 环境变量设置

#### 方法一：PowerShell 设置（临时）

```powershell
# 设置环境变量（当前会话有效）
$env:CLOUDFLARE_API_TOKEN = "your_token_here"
$env:CLOUDFLARE_ZONE_ID = "your_zone_id_here"
$env:ALIYUN_ACCESS_KEY_ID = "your_access_key_id"
$env:ALIYUN_ACCESS_KEY_SECRET = "your_access_key_secret"

# 验证设置
echo $env:CLOUDFLARE_API_TOKEN
```

#### 方法二：系统环境变量（永久）

```powershell
# 使用 setx 命令设置用户环境变量
setx CLOUDFLARE_API_TOKEN "your_token_here"
setx CLOUDFLARE_ZONE_ID "your_zone_id_here"
setx ALIYUN_ACCESS_KEY_ID "your_access_key_id"
setx ALIYUN_ACCESS_KEY_SECRET "your_access_key_secret"

# 注意：需要重启终端才能生效
```

#### 方法三：通过系统设置

1. 右键 "此电脑" → "属性"
2. 点击 "高级系统设置"
3. 点击 "环境变量"
4. 在 "用户变量" 中添加新变量

## 🛡️ 密钥管理最佳实践

### 1. 密钥生成

```bash
# 生成强随机密钥
openssl rand -base64 32  # 生成 32 字节的 base64 编码密钥
openssl rand -hex 32     # 生成 32 字节的十六进制密钥

# PowerShell 生成随机密钥
[System.Web.Security.Membership]::GeneratePassword(32, 8)
```

### 2. 密钥轮换

- **定期轮换**：每 90 天轮换一次敏感密钥
- **事件驱动**：发生安全事件时立即轮换
- **自动化**：使用脚本自动化密钥轮换过程

### 3. 密钥存储

#### 开发环境
- 使用 `.env` 文件（已在 `.gitignore` 中忽略）
- 不要在代码中硬编码密钥
- 使用环境变量管理工具（如 direnv）

#### 生产环境
- 使用云服务密钥管理（AWS Secrets Manager、Azure Key Vault）
- 使用容器编排工具的密钥管理（Kubernetes Secrets）
- 使用专用密钥管理工具（HashiCorp Vault）

## 🚀 部署安全配置

### 1. 阿里云 ECS 部署

```bash
# 在 ECS 实例上设置环境变量
sudo nano /etc/environment

# 添加以下内容
CLOUDFLARE_API_TOKEN=your_token_here
CLOUDFLARE_ZONE_ID=your_zone_id_here
ALIYUN_ACCESS_KEY_ID=your_access_key_id
ALIYUN_ACCESS_KEY_SECRET=your_access_key_secret

# 重新加载环境变量
source /etc/environment
```

### 2. Docker 部署

```dockerfile
# 使用环境变量文件
docker run --env-file .env your_image

# 或直接传递环境变量
docker run -e CLOUDFLARE_API_TOKEN=your_token your_image
```

### 3. 使用 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    image: your_app_image
    env_file:
      - .env
    environment:
      - NODE_ENV=production
```

## ⚠️ 常见安全问题

### 1. 避免的做法

❌ **不要做**：
```javascript
// 硬编码密钥
const API_TOKEN = "7oau74rVYmV5VWw073z1FmhpZ2ZVPy3js3JFh0ke";

// 在日志中输出密钥
console.log("Token:", process.env.CLOUDFLARE_API_TOKEN);

// 在错误信息中暴露密钥
throw new Error(`Failed with token: ${token}`);
```

✅ **正确做法**：
```javascript
// 从环境变量读取
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

// 验证密钥存在
if (!API_TOKEN) {
    throw new Error('CLOUDFLARE_API_TOKEN environment variable is required');
}

// 安全的日志记录
console.log('Token configured:', !!API_TOKEN);
```

### 2. 密钥验证

```javascript
// 验证环境变量
function validateEnvironment() {
    const required = [
        'CLOUDFLARE_API_TOKEN',
        'CLOUDFLARE_ZONE_ID',
        'ALIYUN_ACCESS_KEY_ID',
        'ALIYUN_ACCESS_KEY_SECRET',
        'JWT_SECRET'
    ];
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}

// 在应用启动时调用
validateEnvironment();
```

## 🔧 故障排除

### 1. 环境变量未生效

```powershell
# 检查环境变量是否设置
echo $env:CLOUDFLARE_API_TOKEN

# 如果为空，尝试重新设置
$env:CLOUDFLARE_API_TOKEN = "your_token_here"

# 检查 .env 文件是否存在
Test-Path .env

# 查看 .env 文件内容
Get-Content .env
```

### 2. 权限问题

```bash
# 检查文件权限
ls -la .env

# 设置正确权限（仅所有者可读写）
chmod 600 .env
```

### 3. API 令牌验证

```powershell
# 测试 Cloudflare API 令牌
.\scripts\test-token-simple.ps1

# 手动验证令牌
$headers = @{"Authorization" = "Bearer $env:CLOUDFLARE_API_TOKEN"}
Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/user/tokens/verify" -Headers $headers
```

### 4. 脚本执行问题

```powershell
# 如果脚本报告缺少环境变量，检查设置
if (-not $env:CLOUDFLARE_API_TOKEN) {
    Write-Host "请设置 CLOUDFLARE_API_TOKEN 环境变量" -ForegroundColor Red
    Write-Host "示例: `$env:CLOUDFLARE_API_TOKEN = 'your_token_here'" -ForegroundColor Yellow
}
```

## 📚 相关文档

- [Cloudflare API 文档](https://developers.cloudflare.com/api/)
- [阿里云 API 文档](https://help.aliyun.com/document_detail/25490.html)
- [环境变量最佳实践](https://12factor.net/config)
- [密钥管理指南](https://owasp.org/www-project-cheat-sheets/cheatsheets/Key_Management_Cheat_Sheet.html)

## 🆘 获取帮助

如果您在配置过程中遇到问题：

1. 检查本文档的故障排除部分
2. 查看项目的 GitHub Issues
3. 联系项目维护者

---

**重要提醒**：请勿将包含真实密钥的文件提交到版本控制系统。始终使用环境变量或专用密钥管理服务来处理敏感信息。