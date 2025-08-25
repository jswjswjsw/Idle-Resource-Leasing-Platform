# 分阶段SSL证书配置方案
# 根据当前域名和服务状态选择合适的SSL方案

param(
    [ValidateSet("phase1", "phase2", "phase3")]
    [string]$Phase = "phase1",
    [string]$ServerIP = "116.62.44.24",
    [string]$Domain = "wwwcn.uk"
)

Write-Host "🔒 分阶段SSL证书配置" -ForegroundColor Cyan
Write-Host "=" * 50
Write-Host "当前阶段: $Phase" -ForegroundColor Yellow
Write-Host "服务器IP: $ServerIP" -ForegroundColor White  
Write-Host "域名: $Domain" -ForegroundColor White

switch ($Phase) {
    "phase1" {
        Write-Host ""
        Write-Host "📋 阶段1: 应用启动 + IP访问 + 自签名证书" -ForegroundColor Yellow
        Write-Host "适用条件: 域名无法解析，需要快速启动服务进行测试" -ForegroundColor Gray
        
        Write-Host ""
        Write-Host "✅ 执行步骤:" -ForegroundColor Green
        Write-Host "1. 启动ECS上的应用服务 (HTTP模式)" -ForegroundColor White
        Write-Host "2. 生成自签名SSL证书" -ForegroundColor White
        Write-Host "3. 配置应用使用SSL" -ForegroundColor White
        Write-Host "4. 测试IP地址访问" -ForegroundColor White
        
        Write-Host ""
        Write-Host "🔧 具体操作:" -ForegroundColor Cyan
        
        # 生成自签名证书的配置
        $sslConfig = @"
# 1. 在ECS上生成自签名SSL证书
# 在ECS PowerShell中运行以下命令:

# 创建证书目录
New-Item -ItemType Directory -Path 'C:\ssl' -Force

# 生成自签名证书 (适用于IP访问)
`$cert = New-SelfSignedCertificate `
    -Subject "CN=$ServerIP" `
    -DnsName @("$ServerIP", "$Domain", "api.$Domain", "www.$Domain") `
    -CertStoreLocation "Cert:\LocalMachine\My" `
    -KeyLength 2048 `
    -NotAfter (Get-Date).AddYears(1)

# 导出证书到文件
`$certPath = "C:\ssl\trade-platform.pfx"
`$password = ConvertTo-SecureString -String "trade123456" -Force -AsPlainText
Export-PfxCertificate -Cert `$cert -FilePath `$certPath -Password `$password

# 导出PEM格式 (Node.js使用)
`$certPem = "C:\ssl\cert.pem"  
`$keyPem = "C:\ssl\key.pem"

# 生成PEM证书 (需要OpenSSL)
openssl pkcs12 -in `$certPath -out `$certPem -nodes -nokeys -passin pass:trade123456
openssl pkcs12 -in `$certPath -out `$keyPem -nodes -nocerts -passin pass:trade123456

Write-Host "✅ 自签名证书生成完成!"
Write-Host "证书路径: `$certPath"
Write-Host "PEM证书: `$certPem"  
Write-Host "PEM私钥: `$keyPem"
"@

        Write-Host $sslConfig -ForegroundColor Gray
        
        Write-Host ""
        Write-Host "🚀 应用启动配置:" -ForegroundColor Cyan
        Write-Host "修改后端启动配置使用SSL:" -ForegroundColor White
        
        $appConfig = @"
# 2. 修改后端应用使用SSL证书
# 在 backend/src/server.ts 或类似文件中添加:

const fs = require('fs');
const https = require('https');

// SSL配置
const sslOptions = {
    key: fs.readFileSync('C:/ssl/key.pem'),
    cert: fs.readFileSync('C:/ssl/cert.pem')
};

// 创建HTTPS服务器
const httpsServer = https.createServer(sslOptions, app);
httpsServer.listen(5000, '0.0.0.0', () => {
    console.log('✅ HTTPS服务器启动: https://$ServerIP:5000');
});

// 同时保持HTTP服务器用于健康检查
app.listen(5001, '0.0.0.0', () => {
    console.log('✅ HTTP服务器启动: http://$ServerIP:5001');
});
"@

        Write-Host $appConfig -ForegroundColor Gray
        
        Write-Host ""
        Write-Host "🌐 访问测试:" -ForegroundColor Cyan
        Write-Host "完成后可通过以下方式访问:" -ForegroundColor White
        Write-Host "• HTTPS: https://$ServerIP:5000 (会显示证书警告，点击继续)" -ForegroundColor Green
        Write-Host "• HTTP:  http://$ServerIP:5001 (健康检查端口)" -ForegroundColor Green
        
    }
    
    "phase2" {
        Write-Host ""
        Write-Host "📋 阶段2: 域名解析修复 + Hosts文件测试" -ForegroundColor Yellow
        Write-Host "适用条件: 应用已启动，开始修复域名解析问题" -ForegroundColor Gray
        
        Write-Host ""
        Write-Host "✅ 执行步骤:" -ForegroundColor Green
        Write-Host "1. 修复域名DNS解析问题" -ForegroundColor White
        Write-Host "2. 使用hosts文件进行本地测试" -ForegroundColor White
        Write-Host "3. 验证域名解析生效" -ForegroundColor White
        
        Write-Host ""
        Write-Host "🔧 具体操作:" -ForegroundColor Cyan
        
        Write-Host ""
        Write-Host "1. 运行DNS修复脚本:" -ForegroundColor White
        Write-Host "   .\dns-fix-guide.ps1" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "2. 临时修改hosts文件测试:" -ForegroundColor White
        Write-Host "   以管理员身份编辑: C:\Windows\System32\drivers\etc\hosts" -ForegroundColor Gray
        Write-Host "   添加以下内容:" -ForegroundColor Gray
        Write-Host "$ServerIP $Domain" -ForegroundColor Green
        Write-Host "$ServerIP api.$Domain" -ForegroundColor Green
        Write-Host "$ServerIP www.$Domain" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "3. 验证解析:" -ForegroundColor White
        Write-Host "nslookup $Domain" -ForegroundColor Green
        Write-Host "ping $Domain" -ForegroundColor Green
        
    }
    
    "phase3" {
        Write-Host ""
        Write-Host "📋 阶段3: Let's Encrypt正式证书" -ForegroundColor Yellow
        Write-Host "适用条件: 域名可以正常解析，应用已启动" -ForegroundColor Gray
        
        Write-Host ""
        Write-Host "✅ 执行步骤:" -ForegroundColor Green
        Write-Host "1. 使用Let's Encrypt申请免费SSL证书" -ForegroundColor White
        Write-Host "2. 配置自动续期" -ForegroundColor White
        Write-Host "3. 测试HTTPS访问" -ForegroundColor White
        Write-Host "4. 强制HTTP到HTTPS重定向" -ForegroundColor White
        
        Write-Host ""
        Write-Host "🔧 具体操作:" -ForegroundColor Cyan
        Write-Host "运行Let's Encrypt证书申请:" -ForegroundColor White
        Write-Host ".\setup-ssl-windows.ps1 -Domain $Domain" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "🎯 最终配置:" -ForegroundColor Cyan
        Write-Host "完成后的访问地址:" -ForegroundColor White
        Write-Host "• 前端: https://$Domain" -ForegroundColor Green
        Write-Host "• API:   https://api.$Domain" -ForegroundColor Green
        Write-Host "• 管理:  https://admin.$Domain (可选)" -ForegroundColor Green
        
    }
}

Write-Host ""
Write-Host "📋 当前状态检查:" -ForegroundColor Cyan

# 检查ECS应用状态
Write-Host "🔍 检查应用服务状态..." -ForegroundColor Yellow
$port5000 = Test-NetConnection -ComputerName $ServerIP -Port 5000 -WarningAction SilentlyContinue
$port3000 = Test-NetConnection -ComputerName $ServerIP -Port 3000 -WarningAction SilentlyContinue

if ($port5000.TcpTestSucceeded) {
    Write-Host "✅ 后端服务 (端口5000): 运行中" -ForegroundColor Green
} else {
    Write-Host "❌ 后端服务 (端口5000): 未启动" -ForegroundColor Red
}

if ($port3000.TcpTestSucceeded) {
    Write-Host "✅ 前端服务 (端口3000): 运行中" -ForegroundColor Green
} else {
    Write-Host "❌ 前端服务 (端口3000): 未启动" -ForegroundColor Red
}

# 检查域名解析
Write-Host "🔍 检查域名解析状态..." -ForegroundColor Yellow
try {
    $dnsResult = Resolve-DnsName -Name $Domain -ErrorAction Stop
    Write-Host "✅ 域名解析: 正常 -> $($dnsResult[0].IPAddress)" -ForegroundColor Green
    $dnsWorking = $true
} catch {
    Write-Host "❌ 域名解析: 失败" -ForegroundColor Red
    $dnsWorking = $false
}

Write-Host ""
Write-Host "🎯 建议的下一步操作:" -ForegroundColor Cyan

if (-not $port5000.TcpTestSucceeded -and -not $port3000.TcpTestSucceeded) {
    Write-Host "👉 需要先启动应用服务 (阶段1)" -ForegroundColor Yellow
    Write-Host "   运行: .\remote-start-ecs.ps1" -ForegroundColor Green
} elseif (-not $dnsWorking) {
    Write-Host "👉 需要修复域名解析 (阶段2)" -ForegroundColor Yellow  
    Write-Host "   运行: .\ssl-phased-setup.ps1 -Phase phase2" -ForegroundColor Green
} else {
    Write-Host "👉 可以申请正式SSL证书 (阶段3)" -ForegroundColor Yellow
    Write-Host "   运行: .\ssl-phased-setup.ps1 -Phase phase3" -ForegroundColor Green
}

Write-Host ""
Write-Host "💡 提示: 可以随时运行此脚本查看当前状态和建议操作" -ForegroundColor Blue