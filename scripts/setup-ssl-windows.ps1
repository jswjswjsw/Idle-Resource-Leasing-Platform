# Windows ECS SSL证书配置脚本
# 使用win-acme (WACS) 申请Let's Encrypt免费SSL证书

param(
    [string]$Domain = "wwwcn.uk",
    [string]$Email = "admin@wwwcn.uk",
    [switch]$InstallIIS = $false
)

Write-Host "🔒 Windows ECS SSL证书配置开始" -ForegroundColor Cyan
Write-Host "=" * 50
Write-Host "域名: $Domain" -ForegroundColor White
Write-Host "邮箱: $Email" -ForegroundColor White

# 检查管理员权限
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ 需要管理员权限运行此脚本" -ForegroundColor Red
    exit 1
}

# 创建SSL工作目录
$sslDir = "C:\ssl"
if (-not (Test-Path $sslDir)) {
    New-Item -ItemType Directory -Path $sslDir -Force | Out-Null
    Write-Host "✅ 创建SSL工作目录: $sslDir" -ForegroundColor Green
}

# 方案1: 使用win-acme (推荐)
Write-Host "📦 下载win-acme (Let's Encrypt客户端)..." -ForegroundColor Yellow
$wacsUrl = "https://github.com/win-acme/win-acme/releases/download/v2.2.9.1701/win-acme.v2.2.9.1701.x64.pluggable.zip"
$wacsPath = "$sslDir\win-acme.zip"
$wacsDir = "$sslDir\win-acme"

try {
    # 下载win-acme
    Invoke-WebRequest -Uri $wacsUrl -OutFile $wacsPath -UseBasicParsing
    Write-Host "✅ win-acme下载完成" -ForegroundColor Green
    
    # 解压
    if (Test-Path $wacsDir) {
        Remove-Item $wacsDir -Recurse -Force
    }
    Expand-Archive -Path $wacsPath -DestinationPath $wacsDir -Force
    Write-Host "✅ win-acme解压完成" -ForegroundColor Green
    
} catch {
    Write-Host "❌ win-acme下载失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 检查端口80是否被占用
Write-Host "🔍 检查端口80状态..." -ForegroundColor Yellow
$port80 = Get-NetTCPConnection -LocalPort 80 -ErrorAction SilentlyContinue
if ($port80) {
    Write-Host "⚠️ 端口80已被占用，需要临时停止占用服务" -ForegroundColor Yellow
    $port80 | ForEach-Object {
        $process = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "  占用进程: $($process.ProcessName) (PID: $($process.Id))" -ForegroundColor White
        }
    }
    Write-Host "建议手动停止占用端口80的服务，或使用DNS验证方式" -ForegroundColor Yellow
}

# 方案2: 使用IIS进行HTTP验证
if ($InstallIIS) {
    Write-Host "🔧 安装IIS..." -ForegroundColor Yellow
    try {
        Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole, IIS-WebServer, IIS-CommonHttpFeatures, IIS-HttpErrors, IIS-HttpLogging, IIS-HttpStaticContent -All
        Write-Host "✅ IIS安装完成" -ForegroundColor Green
    } catch {
        Write-Host "❌ IIS安装失败: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 创建证书申请配置
Write-Host "📝 创建证书申请配置..." -ForegroundColor Yellow

$domains = @($Domain, "api.$Domain", "www.$Domain")
$domainList = $domains -join ","

# 创建自动化申请脚本
$applyScript = @"
@echo off
echo 申请Let's Encrypt SSL证书...
cd /d "$wacsDir"

REM 使用HTTP验证方式申请证书
wacs.exe --target manual --host $domainList --webroot C:\inetpub\wwwroot --emailaddress $Email --accepttos --unattended

REM 如果HTTP验证失败，使用DNS验证
if errorlevel 1 (
    echo HTTP验证失败，请手动配置DNS验证...
    echo 运行以下命令进行DNS验证:
    echo wacs.exe --target manual --host $domainList --validation dns --emailaddress $Email --accepttos
    pause
)

echo 证书申请完成，证书保存在: %PROGRAMDATA%\win-acme\httpsacme-v02.api.letsencrypt.org
pause
"@

$applyScript | Out-File -FilePath "$sslDir\apply-ssl.bat" -Encoding ASCII
Write-Host "✅ 证书申请脚本创建完成: $sslDir\apply-ssl.bat" -ForegroundColor Green

# 创建Node.js HTTPS服务器配置
$httpsConfig = @"
const fs = require('fs');
const https = require('https');
const path = require('path');

// SSL证书路径 (win-acme默认保存位置)
const certPath = process.env.PROGRAMDATA + '\\win-acme\\httpsacme-v02.api.letsencrypt.org';

// 查找最新的证书文件
function findLatestCert() {
    try {
        const certDir = fs.readdirSync(certPath);
        const domainDir = certDir.find(dir => dir.includes('$Domain'));
        
        if (domainDir) {
            const fullPath = path.join(certPath, domainDir);
            return {
                key: path.join(fullPath, 'key.pem'),
                cert: path.join(fullPath, 'cert.pem'),
                ca: path.join(fullPath, 'chain.pem')
            };
        }
    } catch (error) {
        console.error('查找证书失败:', error.message);
    }
    return null;
}

// HTTPS服务器配置
function createHTTPSServer(app) {
    const certFiles = findLatestCert();
    
    if (!certFiles) {
        console.log('⚠️  未找到SSL证书，使用HTTP模式启动');
        return null;
    }
    
    try {
        const options = {
            key: fs.readFileSync(certFiles.key),
            cert: fs.readFileSync(certFiles.cert)
        };
        
        // 添加证书链（如果存在）
        if (fs.existsSync(certFiles.ca)) {
            options.ca = fs.readFileSync(certFiles.ca);
        }
        
        const httpsServer = https.createServer(options, app);
        console.log('✅ HTTPS服务器配置完成');
        console.log('证书路径:', certFiles.cert);
        
        return httpsServer;
    } catch (error) {
        console.error('❌ HTTPS配置失败:', error.message);
        return null;
    }
}

module.exports = { createHTTPSServer, findLatestCert };
"@

$httpsConfig | Out-File -FilePath "$sslDir\https-config.js" -Encoding UTF8
Write-Host "✅ Node.js HTTPS配置文件创建完成: $sslDir\https-config.js" -ForegroundColor Green

# 创建证书更新任务
Write-Host "📅 创建证书自动更新任务..." -ForegroundColor Yellow

$updateScript = @"
@echo off
echo 检查并更新SSL证书...
cd /d "$wacsDir"
wacs.exe --renew --unattended
echo 证书更新检查完成
"@

$updateScript | Out-File -FilePath "$sslDir\update-ssl.bat" -Encoding ASCII

# 创建Windows计划任务（每月1日凌晨2点执行）
$taskName = "SSL证书自动更新"
$taskAction = New-ScheduledTaskAction -Execute "$sslDir\update-ssl.bat"
$taskTrigger = New-ScheduledTaskTrigger -Monthly -DaysOfMonth 1 -At "2:00AM"
$taskPrincipal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

try {
    Register-ScheduledTask -TaskName $taskName -Action $taskAction -Trigger $taskTrigger -Principal $taskPrincipal -Force
    Write-Host "✅ 证书自动更新任务创建完成" -ForegroundColor Green
} catch {
    Write-Host "⚠️ 证书自动更新任务创建失败: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 防火墙配置
Write-Host "🔥 配置Windows防火墙..." -ForegroundColor Yellow
try {
    # 开放HTTP和HTTPS端口
    New-NetFirewallRule -DisplayName "HTTP-In" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName "HTTPS-In" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow -ErrorAction SilentlyContinue
    Write-Host "✅ 防火墙规则配置完成" -ForegroundColor Green
} catch {
    Write-Host "⚠️ 防火墙配置可能需要手动完成" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 SSL配置准备完成！" -ForegroundColor Green
Write-Host "=" * 50
Write-Host "📋 下一步操作:" -ForegroundColor Cyan
Write-Host "1. 运行证书申请脚本: $sslDir\apply-ssl.bat" -ForegroundColor White
Write-Host "2. 等待DNS传播完成（通常需要几分钟）" -ForegroundColor White
Write-Host "3. 如果HTTP验证失败，使用DNS验证方式" -ForegroundColor White
Write-Host "4. 将生成的证书集成到Node.js应用中" -ForegroundColor White
Write-Host ""
Write-Host "📝 重要文件位置:" -ForegroundColor Cyan
Write-Host "  证书申请脚本: $sslDir\apply-ssl.bat" -ForegroundColor White
Write-Host "  证书更新脚本: $sslDir\update-ssl.bat" -ForegroundColor White
Write-Host "  HTTPS配置文件: $sslDir\https-config.js" -ForegroundColor White
Write-Host "  win-acme工具: $wacsDir\wacs.exe" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  注意事项:" -ForegroundColor Yellow
Write-Host "- 确保域名已正确解析到此服务器IP" -ForegroundColor White
Write-Host "- HTTP验证需要端口80可访问" -ForegroundColor White
Write-Host "- 证书有效期90天，已配置自动更新任务" -ForegroundColor White