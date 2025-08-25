# Windows ECS SSL证书配置脚本
param(
    [string]$Domain = "wwwcn.uk",
    [string]$Email = "admin@wwwcn.uk"
)

Write-Host "Windows ECS SSL证书配置开始" -ForegroundColor Cyan
Write-Host "=" * 50
Write-Host "域名: $Domain" -ForegroundColor White
Write-Host "邮箱: $Email" -ForegroundColor White

# 检查管理员权限
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "需要管理员权限运行此脚本" -ForegroundColor Red
    exit 1
}

Write-Host "管理员权限验证通过" -ForegroundColor Green

# 创建SSL工作目录
$sslDir = "C:\ssl"
if (-not (Test-Path $sslDir)) {
    New-Item -ItemType Directory -Path $sslDir -Force | Out-Null
    Write-Host "创建SSL工作目录: $sslDir" -ForegroundColor Green
}

# 下载win-acme工具
Write-Host "下载win-acme工具..." -ForegroundColor Yellow
$wacsUrl = "https://github.com/win-acme/win-acme/releases/download/v2.2.9.1701/win-acme.v2.2.9.1701.x64.pluggable.zip"
$wacsPath = "$sslDir\win-acme.zip"
$wacsDir = "$sslDir\win-acme"

try {
    Invoke-WebRequest -Uri $wacsUrl -OutFile $wacsPath -UseBasicParsing
    Write-Host "win-acme下载完成" -ForegroundColor Green
    
    if (Test-Path $wacsDir) {
        Remove-Item $wacsDir -Recurse -Force
    }
    Expand-Archive -Path $wacsPath -DestinationPath $wacsDir -Force
    Write-Host "win-acme解压完成" -ForegroundColor Green
    
} catch {
    Write-Host "win-acme下载失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 检查端口80状态
Write-Host "检查端口80状态..." -ForegroundColor Yellow
$port80 = Get-NetTCPConnection -LocalPort 80 -ErrorAction SilentlyContinue
if ($port80) {
    Write-Host "端口80已被占用，建议使用DNS验证方式" -ForegroundColor Yellow
} else {
    Write-Host "端口80可用" -ForegroundColor Green
}

# 创建证书申请脚本
Write-Host "创建证书申请脚本..." -ForegroundColor Yellow
$domains = @($Domain, "api.$Domain", "www.$Domain")
$domainList = $domains -join ","

$applyScriptContent = @"
@echo off
echo 申请Let's Encrypt SSL证书...
cd /d "$wacsDir"

echo 使用DNS验证方式申请证书
wacs.exe --target manual --host $domainList --validation dns --emailaddress $Email --accepttos

echo 证书申请完成
pause
"@

$applyScriptContent | Out-File -FilePath "$sslDir\apply-ssl.bat" -Encoding ASCII
Write-Host "证书申请脚本创建完成: $sslDir\apply-ssl.bat" -ForegroundColor Green

# 防火墙配置
Write-Host "配置Windows防火墙..." -ForegroundColor Yellow
try {
    New-NetFirewallRule -DisplayName "HTTP-In" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName "HTTPS-In" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow -ErrorAction SilentlyContinue
    Write-Host "防火墙规则配置完成" -ForegroundColor Green
} catch {
    Write-Host "防火墙配置可能需要手动完成" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "SSL配置准备完成！" -ForegroundColor Green
Write-Host "=" * 50
Write-Host "下一步操作:" -ForegroundColor Cyan
Write-Host "1. 运行证书申请脚本: $sslDir\apply-ssl.bat" -ForegroundColor White
Write-Host "2. 等待DNS传播完成" -ForegroundColor White
Write-Host "3. 将证书集成到Node.js应用中" -ForegroundColor White
Write-Host ""
Write-Host "重要文件位置:" -ForegroundColor Cyan
Write-Host "  证书申请脚本: $sslDir\apply-ssl.bat" -ForegroundColor White
Write-Host "  win-acme工具: $wacsDir\wacs.exe" -ForegroundColor White