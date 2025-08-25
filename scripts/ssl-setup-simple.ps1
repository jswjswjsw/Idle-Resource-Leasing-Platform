# 简化版SSL配置脚本 - Windows ECS服务器
# 适用于阿里云Windows ECS + Cloudflare DNS

param(
    [string]$Domain = "wwwcn.uk",
    [string]$Email = "admin@wwwcn.uk"
)

Write-Host "开始SSL证书配置..." -ForegroundColor Cyan
Write-Host "域名: $Domain" -ForegroundColor White
Write-Host "邮箱: $Email" -ForegroundColor White

# 检查管理员权限
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "需要管理员权限运行此脚本" -ForegroundColor Red
    exit 1
}

# 检查域名解析
Write-Host "检查域名解析..." -ForegroundColor Yellow
try {
    $dnsResult = Resolve-DnsName -Name $Domain -Type A -ErrorAction Stop
    Write-Host "域名解析成功: $($dnsResult.IPAddress)" -ForegroundColor Green
} catch {
    Write-Host "域名解析失败，请检查DNS配置" -ForegroundColor Red
    Write-Host "请确保在Cloudflare中配置了A记录指向您的ECS IP" -ForegroundColor Yellow
    exit 1
}

# 检查端口80是否开放
Write-Host "检查端口80..." -ForegroundColor Yellow
$port80 = netstat -an | findstr :80
if ($port80) {
    Write-Host "端口80已被占用，请确保Web服务器正在运行" -ForegroundColor Green
} else {
    Write-Host "警告: 端口80未开放，请先启动Web服务器" -ForegroundColor Yellow
}

# 安装win-acme (Let's Encrypt客户端)
Write-Host "安装win-acme..." -ForegroundColor Yellow
$winAcmeUrl = "https://github.com/win-acme/win-acme/releases/download/v2.1.20/win-acme.v2.1.20.1465.x64.pluggable.zip"
$downloadPath = "$env:TEMP\win-acme.zip"
$extractPath = "C:\win-acme"

try {
    # 下载win-acme
    Invoke-WebRequest -Uri $winAcmeUrl -OutFile $downloadPath -UseBasicParsing
    
    # 解压
    if (Test-Path $extractPath) {
        Remove-Item $extractPath -Recurse -Force
    }
    Expand-Archive -Path $downloadPath -DestinationPath $extractPath
    
    Write-Host "win-acme安装完成" -ForegroundColor Green
} catch {
    Write-Host "win-acme安装失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 申请SSL证书
Write-Host "申请SSL证书..." -ForegroundColor Yellow
$certPath = "C:\certificates"
if (-not (Test-Path $certPath)) {
    New-Item -ItemType Directory -Path $certPath -Force
}

try {
    # 使用HTTP验证申请证书
    $arguments = @(
        "--target", $Domain,
        "--installation", "iis",
        "--accept-terms",
        "--email", $Email,
        "--validation", "http-01",
        "--validation-port", "80"
    )
    
    $process = Start-Process -FilePath "$extractPath\wacs.exe" -ArgumentList $arguments -Wait -PassThru -NoNewWindow
    
    if ($process.ExitCode -eq 0) {
        Write-Host "SSL证书申请成功!" -ForegroundColor Green
    } else {
        Write-Host "SSL证书申请失败，退出代码: $($process.ExitCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "SSL证书申请过程中出错: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 配置自动续期
Write-Host "配置自动续期..." -ForegroundColor Yellow
$taskName = "SSL-Renewal-$Domain"
$taskCommand = "$extractPath\wacs.exe"
$taskArguments = "--renew --accept-terms"

try {
    # 创建计划任务
    $action = New-ScheduledTaskAction -Execute $taskCommand -Argument $taskArguments
    $trigger = New-ScheduledTaskTrigger -Daily -At 3AM
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
    
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Description "SSL证书自动续期"
    
    Write-Host "自动续期任务创建成功" -ForegroundColor Green
} catch {
    Write-Host "自动续期任务创建失败: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 验证证书
Write-Host "验证SSL证书..." -ForegroundColor Yellow
try {
    $cert = Get-ChildItem -Path "Cert:\LocalMachine\My" | Where-Object { $_.Subject -like "*$Domain*" }
    if ($cert) {
        Write-Host "证书安装成功!" -ForegroundColor Green
        Write-Host "证书主题: $($cert.Subject)" -ForegroundColor White
        Write-Host "有效期至: $($cert.NotAfter)" -ForegroundColor White
    } else {
        Write-Host "未找到证书，请检查安装过程" -ForegroundColor Red
    }
} catch {
    Write-Host "证书验证失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "SSL配置完成!" -ForegroundColor Green
Write-Host "请访问 https://$Domain 验证SSL证书" -ForegroundColor Cyan
