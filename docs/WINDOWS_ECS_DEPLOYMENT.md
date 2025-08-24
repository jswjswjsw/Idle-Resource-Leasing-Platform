# Windows ECS部署指南

## 🚀 概述

本指南专门针对阿里云Windows ECS服务器，提供Trade Platform项目的完整部署方案。

## 📋 部署前准备

### 服务器要求
- **操作系统**: Windows Server 2019/2022
- **配置**: 最低1核2GB内存
- **网络**: 已配置公网IP (116.62.44.24)
- **域名**: wwwcn.uk (已配置Cloudflare DNS)

### 必需权限
- 管理员权限（Administrator）
- 防火墙配置权限
- 安装软件权限

## 🔧 步骤1：环境准备

### 1.1 连接服务器
```powershell
# 方法1：远程桌面连接（推荐）
mstsc /v:116.62.44.24

# 方法2：PowerShell远程连接
Enter-PSSession -ComputerName 116.62.44.24 -Credential (Get-Credential)
```

### 1.2 系统检查
在ECS服务器上打开PowerShell（以管理员身份），执行：
```powershell
# 检查系统信息
Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion
[Environment]::OSVersion

# 检查已安装软件
node --version  # 检查Node.js
npm --version   # 检查npm
git --version   # 检查Git
```

## 📦 步骤2：安装基础环境

### 2.1 自动安装脚本
使用我们提供的一键部署脚本：
```powershell
# 下载并运行部署脚本
powershell -ExecutionPolicy Bypass -File "scripts\deploy-windows-ecs.ps1"
```

### 2.2 手动安装（如果自动安装失败）

#### 安装Node.js 18
```powershell
# 下载Node.js 18 LTS
$nodeUrl = "https://nodejs.org/dist/v18.19.0/node-v18.19.0-x64.msi"
$downloadPath = "$env:TEMP\nodejs.msi"

Invoke-WebRequest -Uri $nodeUrl -OutFile $downloadPath
Start-Process -FilePath "msiexec.exe" -ArgumentList "/i", $downloadPath, "/quiet", "/norestart" -Wait

# 重新加载环境变量
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# 验证安装
node --version
npm --version
```

#### 安装Git
```powershell
# 下载Git for Windows
$gitUrl = "https://github.com/git-for-windows/git/releases/download/v2.42.0.windows.2/Git-2.42.0.2-64-bit.exe"
$gitPath = "$env:TEMP\git-installer.exe"

Invoke-WebRequest -Uri $gitUrl -OutFile $gitPath
Start-Process -FilePath $gitPath -ArgumentList "/SILENT" -Wait

# 重新加载环境变量
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# 验证安装
git --version
```

## 📁 步骤3：部署项目代码

### 3.1 克隆项目
```powershell
# 创建项目目录
New-Item -ItemType Directory -Path "C:\www" -Force
Set-Location "C:\www"

# 克隆项目
git clone https://github.com/jswjswjsw/Idle-Resource-Leasing-Platform.git trade-platform

# 进入项目目录
Set-Location "C:\www\trade-platform"
```

### 3.2 配置npm镜像源
```powershell
# 配置国内镜像源（提高下载速度）
npm config set registry https://registry.npmmirror.com
npm config get registry
```

### 3.3 安装项目依赖
```powershell
# 安装后端依赖
Set-Location "C:\www\trade-platform\backend"
npm install

# 安装前端依赖
Set-Location "C:\www\trade-platform\frontend"
npm install

# 返回项目根目录
Set-Location "C:\www\trade-platform"
```

## 🔒 步骤4：SSL证书配置

### 4.1 自动SSL配置
```powershell
# 运行修正后的SSL配置脚本
powershell -ExecutionPolicy Bypass -File "scripts\setup-ssl-windows-fixed.ps1" -Domain "wwwcn.uk" -Email "admin@wwwcn.uk"
```

### 4.2 手动申请证书
如果自动配置失败，手动操作：
```powershell
# 1. 运行证书申请脚本
C:\ssl\apply-ssl.bat

# 2. 如果HTTP验证失败，使用DNS验证
C:\ssl\win-acme\wacs.exe --target manual --host wwwcn.uk,api.wwwcn.uk,www.wwwcn.uk --validation dns --emailaddress admin@wwwcn.uk --accepttos
```

### 4.3 验证证书安装
```powershell
# 检查证书文件
Get-ChildItem -Path "$env:PROGRAMDATA\win-acme\httpsacme-v02.api.letsencrypt.org" -Recurse -Include "*.pem" -ErrorAction SilentlyContinue
```

## ⚙️ 步骤5：环境变量配置

### 5.1 创建环境变量文件
```powershell
# 后端环境变量
Set-Location "C:\www\trade-platform\backend"
Copy-Item ".env.example" ".env"

# 前端环境变量
Set-Location "C:\www\trade-platform\frontend"
Copy-Item ".env.example" ".env"
```

### 5.2 编辑环境变量
根据实际情况修改 `.env` 文件中的配置项：
```env
# 数据库配置
DATABASE_URL="sqlite:./dev.db"

# JWT密钥
JWT_SECRET="your-jwt-secret-key"

# 域名配置
FRONTEND_URL="https://wwwcn.uk"
BACKEND_URL="https://api.wwwcn.uk"

# SSL证书路径（Windows）
SSL_CERT_PATH="C:\ssl\certificates"
```

## 🏗️ 步骤6：构建项目

### 6.1 构建后端
```powershell
Set-Location "C:\www\trade-platform\backend"
npm run build
```

### 6.2 构建前端
```powershell
Set-Location "C:\www\trade-platform\frontend"
npm run build
```

## 🚀 步骤7：启动服务

### 7.1 后端服务
```powershell
Set-Location "C:\www\trade-platform\backend"

# 开发模式
npm run dev

# 生产模式
npm start
```

### 7.2 前端服务
```powershell
Set-Location "C:\www\trade-platform\frontend"

# 开发模式
npm start

# 生产模式（静态文件服务）
# 需要配置IIS或nginx来提供静态文件服务
```

## 🔧 步骤8：配置反向代理（可选）

如果需要使用IIS作为反向代理：

### 8.1 安装IIS
```powershell
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole, IIS-WebServer, IIS-CommonHttpFeatures, IIS-HttpErrors, IIS-HttpLogging, IIS-HttpStaticContent -All
```

### 8.2 安装URL重写模块
从Microsoft官网下载并安装URL Rewrite Module。

### 8.3 配置反向代理
在IIS中配置反向代理规则，将请求转发到Node.js应用。

## 🔥 步骤9：防火墙配置

```powershell
# 开放必要端口
New-NetFirewallRule -DisplayName "HTTP-In" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "HTTPS-In" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
New-NetFirewallRule -DisplayName "Node-Frontend" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
New-NetFirewallRule -DisplayName "Node-Backend" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
```

## ✅ 步骤10：验证部署

### 10.1 本地测试
```powershell
# 测试后端API
Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Method GET

# 测试前端
Invoke-WebRequest -Uri "http://localhost:3000" -Method GET
```

### 10.2 外网访问测试
```powershell
# 测试域名解析
nslookup wwwcn.uk
nslookup api.wwwcn.uk

# 测试HTTPS访问
Invoke-WebRequest -Uri "https://wwwcn.uk" -Method GET
Invoke-WebRequest -Uri "https://api.wwwcn.uk/api/health" -Method GET
```

## 🔄 步骤11：配置自动启动

### 11.1 创建Windows服务
使用PM2 for Windows或创建Windows服务来确保应用自动启动：

```powershell
# 安装PM2
npm install -g pm2
npm install -g pm2-windows-service

# 配置PM2服务
pm2-service-install
pm2 start ecosystem.config.js
pm2 save
```

## 📊 监控和维护

### 日志查看
```powershell
# 查看应用日志
Get-Content "C:\www\trade-platform\backend\logs\app.log" -Tail 50

# 查看PM2日志
pm2 logs
```

### 证书续期
证书会自动续期，也可以手动检查：
```powershell
# 手动续期检查
C:\ssl\update-ssl.bat
```

## ❗ 常见问题

### 问题1：端口被占用
```powershell
# 查看端口占用
Get-NetTCPConnection -LocalPort 80
Get-NetTCPConnection -LocalPort 443

# 杀死占用进程
Stop-Process -Id <PID> -Force
```

### 问题2：SSL证书验证失败
1. 确保域名已正确解析到服务器IP
2. 检查防火墙是否开放80端口
3. 尝试使用DNS验证方式

### 问题3：npm安装失败
```powershell
# 清理缓存
npm cache clean --force

# 使用国内镜像
npm config set registry https://registry.npmmirror.com
```

## 📞 技术支持

如遇到问题，请检查：
1. 系统事件日志
2. 应用程序日志
3. 网络连接状态
4. 防火墙设置

---

**部署完成后，您的应用将可通过以下地址访问：**
- 主站：https://wwwcn.uk
- API：https://api.wwwcn.uk
- 管理后台：https://admin.wwwcn.uk（如果配置）