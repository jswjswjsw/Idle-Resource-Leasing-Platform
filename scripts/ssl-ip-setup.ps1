# 临时IP SSL配置脚本 - 当域名无法解析时使用
# 使用自签名证书进行开发和测试

param(
    [string]$ServerIP = "116.62.44.24",
    [string]$CertName = "wwwcn-temp"
)

Write-Host "🔒 临时IP SSL证书配置" -ForegroundColor Cyan
Write-Host "=" * 40
Write-Host "服务器IP: $ServerIP" -ForegroundColor White
Write-Host "证书名称: $CertName" -ForegroundColor White

# 检查OpenSSL是否可用
$opensslPath = Get-Command openssl -ErrorAction SilentlyContinue
if (-not $opensslPath) {
    Write-Host "❌ 未找到OpenSSL，正在尝试安装..." -ForegroundColor Red
    
    # 尝试通过Chocolatey安装OpenSSL
    $chocoPath = Get-Command choco -ErrorAction SilentlyContinue
    if ($chocoPath) {
        Write-Host "📦 通过Chocolatey安装OpenSSL..." -ForegroundColor Yellow
        choco install openssl -y
    } else {
        Write-Host "⚠️ 请手动安装OpenSSL或等待域名解析修复后使用Let's Encrypt" -ForegroundColor Yellow
        Write-Host "下载地址: https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor White
        return
    }
}

# 创建证书目录
$certDir = "C:\ssl\temp-certs"
if (-not (Test-Path $certDir)) {
    New-Item -ItemType Directory -Path $certDir -Force | Out-Null
}

# 生成自签名证书配置文件
$configContent = @"
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
C = CN
ST = Beijing
L = Beijing
O = Trade Platform
CN = $ServerIP

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
IP.1 = $ServerIP
DNS.1 = wwwcn.uk
DNS.2 = api.wwwcn.uk
DNS.3 = www.wwwcn.uk
"@

$configPath = "$certDir\cert.conf"
$configContent | Out-File -FilePath $configPath -Encoding UTF8

# 生成私钥和证书
Write-Host "🔑 生成SSL私钥和证书..." -ForegroundColor Yellow

$keyPath = "$certDir\$CertName.key"
$certPath = "$certDir\$CertName.crt"

try {
    # 生成私钥
    & openssl genrsa -out $keyPath 2048
    
    # 生成证书
    & openssl req -new -x509 -key $keyPath -out $certPath -days 365 -config $configPath
    
    Write-Host "✅ SSL证书生成完成" -ForegroundColor Green
    Write-Host "私钥: $keyPath" -ForegroundColor White
    Write-Host "证书: $certPath" -ForegroundColor White
    
} catch {
    Write-Host "❌ 证书生成失败: $($_.Exception.Message)" -ForegroundColor Red
    return
}

# 创建Node.js HTTPS配置
$httpsConfigContent = @"
const fs = require('fs');
const https = require('https');
const path = require('path');

// 临时SSL证书配置
const SSL_CONFIG = {
    key: fs.readFileSync('$keyPath'),
    cert: fs.readFileSync('$certPath')
};

// 创建HTTPS服务器
function createHTTPSServer(app, port = 443) {
    try {
        const httpsServer = https.createServer(SSL_CONFIG, app);
        
        httpsServer.listen(port, '0.0.0.0', () => {
            console.log(`✅ HTTPS服务器启动成功`);
            console.log(`🌐 本地访问: https://localhost:\${port}`);
            console.log(`🌐 外网访问: https://$ServerIP:\${port}`);
            console.log(`⚠️  使用自签名证书，浏览器会显示安全警告`);
        });
        
        return httpsServer;
    } catch (error) {
        console.error('❌ HTTPS服务器启动失败:', error.message);
        return null;
    }
}

module.exports = { createHTTPSServer, SSL_CONFIG };
"@

$httpsConfigPath = "$certDir\temp-https-config.js"
$httpsConfigContent | Out-File -FilePath $httpsConfigPath -Encoding UTF8

Write-Host "✅ Node.js临时HTTPS配置创建完成: $httpsConfigPath" -ForegroundColor Green

# 提供使用说明
Write-Host ""
Write-Host "📝 使用说明:" -ForegroundColor Cyan
Write-Host "1. 将 temp-https-config.js 复制到您的项目中" -ForegroundColor White
Write-Host "2. 在服务器代码中引入: const { createHTTPSServer } = require('./temp-https-config');" -ForegroundColor White
Write-Host "3. 使用 createHTTPSServer(app, 5000) 启动HTTPS服务" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  注意事项:" -ForegroundColor Yellow
Write-Host "• 这是临时解决方案，仅用于开发和测试" -ForegroundColor White
Write-Host "• 浏览器会显示'不安全'警告，这是正常的" -ForegroundColor White
Write-Host "• 生产环境必须使用正式的SSL证书" -ForegroundColor White
Write-Host "• 修复域名解析后，请使用Let's Encrypt免费证书" -ForegroundColor White

Write-Host ""
Write-Host "🔧 下一步操作建议:" -ForegroundColor Cyan
Write-Host "1. 首先修复域名DNS解析问题" -ForegroundColor White
Write-Host "2. 确保ECS服务器可以正常访问" -ForegroundColor White
Write-Host "3. 使用正式的Let's Encrypt证书替换临时证书" -ForegroundColor White