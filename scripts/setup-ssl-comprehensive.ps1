# Windows ECS SSL证书配置脚本 - 综合版
# 包含多种下载方案，解决网络问题

param(
    [string]$Domain = "wwwcn.uk",
    [string]$Email = "admin@wwwcn.uk"
)

Write-Host "Windows ECS SSL证书配置开始 - 综合版" -ForegroundColor Cyan
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

# 清理之前的文件
Remove-Item "$sslDir\win-acme.zip" -Force -ErrorAction SilentlyContinue
Remove-Item "$sslDir\win-acme" -Recurse -Force -ErrorAction SilentlyContinue

# 多种下载方案
$wacsUrl = "https://github.com/win-acme/win-acme/releases/download/v2.2.9.1701/win-acme.v2.2.9.1701.x64.pluggable.zip"
$wacsPath = "$sslDir\win-acme.zip"
$wacsDir = "$sslDir\win-acme"
$downloadSuccess = $false

Write-Host "尝试多种方式下载win-acme工具..." -ForegroundColor Yellow

# 方案1：原始Invoke-WebRequest
Write-Host "方案1：使用Invoke-WebRequest..." -ForegroundColor Cyan
try {
    Invoke-WebRequest -Uri $wacsUrl -OutFile $wacsPath -UseBasicParsing -TimeoutSec 30
    if (Test-Path $wacsPath) {
        $fileSize = (Get-Item $wacsPath).Length
        if ($fileSize -gt 500000) {
            Write-Host "方案1下载成功，文件大小: $([math]::Round($fileSize/1MB, 2)) MB" -ForegroundColor Green
            $downloadSuccess = $true
        } else {
            Remove-Item $wacsPath -Force
            Write-Host "方案1下载的文件太小" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "方案1失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 方案2：使用WebClient
if (-not $downloadSuccess) {
    Write-Host "方案2：使用WebClient..." -ForegroundColor Cyan
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        $webClient = New-Object System.Net.WebClient
        $webClient.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        $webClient.DownloadFile($wacsUrl, $wacsPath)
        $webClient.Dispose()
        
        if (Test-Path $wacsPath) {
            $fileSize = (Get-Item $wacsPath).Length
            if ($fileSize -gt 500000) {
                Write-Host "方案2下载成功，文件大小: $([math]::Round($fileSize/1MB, 2)) MB" -ForegroundColor Green
                $downloadSuccess = $true
            } else {
                Remove-Item $wacsPath -Force
                Write-Host "方案2下载的文件太小" -ForegroundColor Red
            }
        }
    } catch {
        Write-Host "方案2失败: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 方案3：使用bitsadmin
if (-not $downloadSuccess) {
    Write-Host "方案3：使用bitsadmin..." -ForegroundColor Cyan
    try {
        $result = bitsadmin /transfer "win-acme-download" /download /priority normal $wacsUrl $wacsPath
        Start-Sleep 5  # 等待下载完成
        
        if (Test-Path $wacsPath) {
            $fileSize = (Get-Item $wacsPath).Length
            if ($fileSize -gt 500000) {
                Write-Host "方案3下载成功，文件大小: $([math]::Round($fileSize/1MB, 2)) MB" -ForegroundColor Green
                $downloadSuccess = $true
            } else {
                Remove-Item $wacsPath -Force
                Write-Host "方案3下载的文件太小" -ForegroundColor Red
            }
        }
    } catch {
        Write-Host "方案3失败: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 方案4：使用curl（如果可用）
if (-not $downloadSuccess -and (Get-Command curl -ErrorAction SilentlyContinue)) {
    Write-Host "方案4：使用curl..." -ForegroundColor Cyan
    try {
        curl -L -o $wacsPath $wacsUrl
        
        if (Test-Path $wacsPath) {
            $fileSize = (Get-Item $wacsPath).Length
            if ($fileSize -gt 500000) {
                Write-Host "方案4下载成功，文件大小: $([math]::Round($fileSize/1MB, 2)) MB" -ForegroundColor Green
                $downloadSuccess = $true
            } else {
                Remove-Item $wacsPath -Force
                Write-Host "方案4下载的文件太小" -ForegroundColor Red
            }
        }
    } catch {
        Write-Host "方案4失败: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 处理下载结果
if ($downloadSuccess) {
    Write-Host "win-acme下载成功，开始解压..." -ForegroundColor Green
    
    try {
        Expand-Archive -Path $wacsPath -DestinationPath $wacsDir -Force
        
        if (Test-Path "$wacsDir\wacs.exe") {
            Write-Host "win-acme工具准备完成" -ForegroundColor Green
            
            # 创建证书申请脚本
            $domains = @($Domain, "api.$Domain", "www.$Domain")
            $domainList = $domains -join ","
            
            $applyScriptContent = @"
@echo off
echo 申请Let's Encrypt SSL证书...
cd /d "$wacsDir"

echo 使用DNS验证方式申请证书
echo 域名: $domainList
echo 邮箱: $Email
echo.

wacs.exe --target manual --host $domainList --validation dns --emailaddress $Email --accepttos

echo.
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
            Write-Host "2. 按照提示在Cloudflare中添加DNS TXT记录" -ForegroundColor White
            Write-Host "3. 等待DNS传播完成" -ForegroundColor White
            Write-Host "4. 证书申请成功后集成到Node.js应用" -ForegroundColor White
            
        } else {
            Write-Host "解压失败，找不到wacs.exe文件" -ForegroundColor Red
        }
        
    } catch {
        Write-Host "解压失败: $($_.Exception.Message)" -ForegroundColor Red
    }
    
} else {
    Write-Host ""
    Write-Host "所有自动下载方案都失败了" -ForegroundColor Red
    Write-Host "=" * 50
    Write-Host "请手动下载win-acme工具:" -ForegroundColor Yellow
    Write-Host "1. 访问: https://github.com/win-acme/win-acme/releases/latest" -ForegroundColor White
    Write-Host "2. 下载: win-acme.v2.x.x.x64.pluggable.zip" -ForegroundColor White
    Write-Host "3. 保存到: $wacsPath" -ForegroundColor White
    Write-Host "4. 解压到: $wacsDir\" -ForegroundColor White
    Write-Host ""
    Write-Host "完成后运行验证:" -ForegroundColor Cyan
    Write-Host "Test-Path '$wacsDir\wacs.exe'" -ForegroundColor Green
}