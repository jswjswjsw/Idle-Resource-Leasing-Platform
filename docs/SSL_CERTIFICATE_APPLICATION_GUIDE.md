# SSL证书申请操作指南

## 📋 当前状态
- ✅ **win-acme工具**: 已成功安装到 `C:\ssl\win-acme\`
- ✅ **申请脚本**: 已创建 `C:\ssl\apply-ssl.bat`
- ✅ **文件完整性**: 下载文件大小 35.58 MB，完整无损坏

## 🚀 下一步操作

### 步骤1: 运行证书申请脚本
在ECS服务器的PowerShell中执行：
```powershell
C:\ssl\apply-ssl.bat
```

### 步骤2: 选择验证方式

#### 方式A: HTTP验证 (推荐，但需端口80可用)
1. 选择 HTTP 验证方式
2. win-acme会自动在本地创建验证文件
3. Let's Encrypt会访问 `http://wwwcn.uk/.well-known/acme-challenge/` 进行验证

**前提条件**:
- 端口80必须开放且可访问
- 域名已正确解析到ECS IP (116.62.44.24)
- 暂停其他占用端口80的服务

#### 方式B: DNS验证 (推荐，更安全)
1. 选择 DNS 验证方式
2. win-acme会提供TXT记录信息
3. 需要在Cloudflare DNS中手动添加TXT记录

### 步骤3: 配置DNS验证 (如选择DNS验证)

#### 3.1 获取TXT记录信息
win-acme会显示类似信息：
```
Domain: _acme-challenge.wwwcn.uk
Type: TXT
Value: xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### 3.2 在Cloudflare中添加TXT记录
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 选择域名 `wwwcn.uk`
3. 进入 "DNS" → "Records"
4. 点击 "Add record"
5. 填写信息：
   - **Type**: TXT
   - **Name**: _acme-challenge
   - **Content**: (win-acme提供的验证值)
   - **TTL**: Auto

#### 3.3 验证DNS传播
等待1-5分钟后，可以使用以下命令验证：
```powershell
nslookup -type=TXT _acme-challenge.wwwcn.uk 8.8.8.8
```

### 步骤4: 完成证书申请
1. 确认验证记录已添加
2. 在win-acme中按回车继续
3. 等待Let's Encrypt验证完成
4. 证书将保存到: `%PROGRAMDATA%\win-acme\httpsacme-v02.api.letsencrypt.org`

## 📁 证书文件位置
申请成功后，证书文件将保存在：
```
C:\ProgramData\win-acme\httpsacme-v02.api.letsencrypt.org\
└── wwwcn.uk\
    ├── cert.pem         # 证书文件
    ├── key.pem          # 私钥文件
    ├── chain.pem        # 证书链
    └── fullchain.pem    # 完整证书链
```

## 🔧 故障排除

### 问题1: HTTP验证失败
**原因**: 端口80被占用或域名解析不正确
**解决**: 
1. 检查端口80状态: `netstat -an | findstr :80`
2. 停止占用服务或使用DNS验证
3. 验证域名解析: `nslookup wwwcn.uk`

### 问题2: DNS验证失败
**原因**: TXT记录未正确添加或DNS传播未完成
**解决**:
1. 验证TXT记录: `nslookup -type=TXT _acme-challenge.wwwcn.uk`
2. 等待DNS传播完成（最多24小时）
3. 确认记录名称和值完全正确

### 问题3: 证书申请超时
**原因**: 网络连接问题或Let's Encrypt服务繁忙
**解决**:
1. 重新运行申请脚本
2. 选择不同的验证方式
3. 检查防火墙设置

## 📞 Cloudflare配置信息
- **域名**: wwwcn.uk
- **Zone ID**: 8ad887047518bc2772572ade96309c55
- **DNS管理**: [Cloudflare Dashboard](https://dash.cloudflare.com/8ad887047518bc2772572ade96309c55)

## 🎯 成功标志
看到以下消息表示申请成功：
```
Certificate created successfully
Certificate saved to: C:\ProgramData\win-acme\...
```

## 📝 下一步准备
证书申请成功后，需要：
1. 将证书集成到Node.js应用中
2. 配置HTTPS服务器
3. 更新Cloudflare SSL模式为"完全(严格)"
4. 测试HTTPS访问功能