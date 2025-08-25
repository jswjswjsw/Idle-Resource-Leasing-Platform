# SSL配置问题排查指南

## 🚨 遇到的问题

### 问题描述
在Windows ECS服务器上配置SSL证书时，win-acme工具下载遇到以下问题：

1. **ZIP文件损坏错误**：
   ```
   win-acme下载失败: 使用"3"个参数调用".ctor"时发生异常:"找不到中央目录结尾记录。"
   ```

2. **网络连接错误**：
   ```
   WebClient下载也失败: 使用"2"个参数调用"DownloadFile"时发生异常:"基础连接已经关闭: 发送时发生错误。"
   ```

## 🔍 问题分析

### 可能原因
1. **网络连接问题**：GitHub在某些地区访问不稳定
2. **防火墙限制**：企业防火墙可能阻止GitHub下载
3. **TLS版本问题**：旧版本PowerShell的TLS设置
4. **文件传输中断**：网络不稳定导致文件下载不完整

## 🛠️ 解决方案

### 方案1：手动下载（推荐）

#### 步骤1：访问下载页面
```
https://github.com/win-acme/win-acme/releases/latest
```

#### 步骤2：下载正确版本
- 文件名：`win-acme.v2.x.x.x64.pluggable.zip`
- 保存到：`C:\ssl\win-acme.zip`

#### 步骤3：验证和解压
```powershell
# 验证下载
Test-Path "C:\ssl\win-acme.zip"

# 检查文件大小
$fileSize = (Get-Item "C:\ssl\win-acme.zip").Length
Write-Host "文件大小: $([math]::Round($fileSize/1MB, 2)) MB"

# 解压文件
Expand-Archive -Path "C:\ssl\win-acme.zip" -DestinationPath "C:\ssl\win-acme" -Force

# 验证可执行文件
Test-Path "C:\ssl\win-acme\wacs.exe"
```

### 方案2：使用bitsadmin下载

```powershell
# Windows内置的下载工具
$url = "https://github.com/win-acme/win-acme/releases/download/v2.2.9.1701/win-acme.v2.2.9.1701.x64.pluggable.zip"
$outputPath = "C:\ssl\win-acme.zip"

bitsadmin /transfer "win-acme-download" $url $outputPath
```

### 方案3：优化网络设置后重试

```powershell
# 设置TLS版本
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# 清理DNS缓存
ipconfig /flushdns

# 重新尝试下载
powershell -ExecutionPolicy Bypass -File "C:\deployment\setup-ssl-windows.ps1"
```

### 方案4：使用curl命令

```powershell
# 如果系统有curl命令
curl -L -o "C:\ssl\win-acme.zip" "https://github.com/win-acme/win-acme/releases/download/v2.2.9.1701/win-acme.v2.2.9.1701.x64.pluggable.zip"
```

## 📋 SSL证书申请流程

### 完成win-acme下载后的步骤

#### 1. 验证工具安装
```powershell
C:\ssl\win-acme\wacs.exe --version
```

#### 2. 申请证书（DNS验证）
```powershell
C:\ssl\win-acme\wacs.exe --target manual --host wwwcn.uk,api.wwwcn.uk,www.wwwcn.uk --validation dns --emailaddress admin@wwwcn.uk --accepttos
```

#### 3. 配置DNS TXT记录
- 记录类型：TXT
- 记录名称：`_acme-challenge.域名`
- 记录值：由win-acme提供
- 在Cloudflare中添加记录

#### 4. 验证证书安装
```powershell
# 检查证书文件
Get-ChildItem -Path "$env:PROGRAMDATA\win-acme\httpsacme-v02.api.letsencrypt.org" -Recurse -Include "*.pem" -ErrorAction SilentlyContinue
```

## 🔧 备用SSL配置方案

### 如果win-acme无法使用

#### 方案A：使用OpenSSL
1. 下载Windows版OpenSSL
2. 手动生成CSR文件
3. 通过在线Let's Encrypt客户端申请

#### 方案B：使用Cloudflare Origin Certificate
1. 在Cloudflare生成Origin证书
2. 下载证书文件
3. 配置到Node.js应用

#### 方案C：暂时使用HTTP
1. 先启动HTTP版本的应用
2. 通过Cloudflare提供HTTPS（灵活SSL模式）
3. 后续升级为完全严格模式

## ⚠️ 注意事项

### 安全配置要求
1. SSL模式必须选择"完全(严格)"
2. 启用HSTS（Max-Age: 31536000）
3. 最小TLS版本设置为1.2
4. 包含所有子域名

### DNS配置
- Zone ID: 8ad887047518bc2772572ade96309c55
- API Token需要DNS编辑权限
- 支持的域名：wwwcn.uk, api.wwwcn.uk, www.wwwcn.uk

## 📞 故障排除检查清单

- [ ] 网络连接是否正常
- [ ] 防火墙是否阻止GitHub访问
- [ ] PowerShell版本和TLS设置
- [ ] 磁盘空间是否充足
- [ ] 管理员权限是否正确
- [ ] DNS设置是否正确配置

## 🔄 当前状态

- ✅ 项目代码已成功部署到 C:\www\trade-platform
- ✅ Node.js和依赖已安装完成
- 🔄 SSL证书配置遇到下载问题，正在解决
- ⏳ 等待SSL问题解决后进行应用启动测试