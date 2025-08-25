# Cloudflare DNS 记录配置脚本
# 根据 cloudflare-config.yml 自动创建 DNS 记录

param(
    [string]$Token = $null,
    [string]$ServerIP = $null,
    [string]$ZoneId = $env:CLOUDFLARE_ZONE_ID
)

# 检查参数
if (-not $Token) {
    $Token = $env:CLOUDFLARE_API_TOKEN
    if (-not $Token) {
        Write-Host "错误: 请提供 API 令牌" -ForegroundColor Red
        Write-Host "使用方法: .\setup-cloudflare-dns.ps1 -Token 'your_token' -ServerIP 'your_server_ip'" -ForegroundColor Yellow
        exit 1
    }
}

if (-not $ServerIP) {
    Write-Host "错误: 请提供服务器IP地址" -ForegroundColor Red
    Write-Host "使用方法: .\setup-cloudflare-dns.ps1 -Token 'your_token' -ServerIP 'your_server_ip'" -ForegroundColor Yellow
    exit 1
}

# 项目配置
if (-not $ZoneId) {
    $ZoneId = "8ad887047518bc2772572ade96309c55"  # 默认值，建议设置环境变量
    Write-Host "警告: 使用默认 Zone ID，建议设置环境变量 CLOUDFLARE_ZONE_ID" -ForegroundColor Yellow
}

$ZONE_ID = $ZoneId
$DOMAIN = "wwwcn.uk"

Write-Host "🌐 开始配置 Cloudflare DNS 记录" -ForegroundColor Cyan
Write-Host "域名: $DOMAIN" -ForegroundColor White
Write-Host "服务器IP: $ServerIP" -ForegroundColor White
Write-Host "Zone ID: $ZONE_ID" -ForegroundColor White
Write-Host ""

# API 基础配置
$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type" = "application/json"
}

# 定义需要创建的 DNS 记录
$dnsRecords = @(
    @{
        name = "@"
        description = "主域名 (wwwcn.uk)"
        type = "A"
        content = $ServerIP
        proxied = $true
    },
    @{
        name = "api"
        description = "API 子域名 (api.wwwcn.uk)"
        type = "A"
        content = $ServerIP
        proxied = $true
    },
    @{
        name = "www"
        description = "WWW 别名 (www.wwwcn.uk)"
        type = "CNAME"
        content = $DOMAIN
        proxied = $true
    }
)

# 函数：获取现有DNS记录
function Get-ExistingDNSRecords {
    try {
        $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" -Headers $headers
        if ($response.success) {
            return $response.result
        } else {
            Write-Host "❌ 获取DNS记录失败" -ForegroundColor Red
            $response.errors | ForEach-Object { Write-Host "  错误: $($_.message)" -ForegroundColor Red }
            return $null
        }
    } catch {
        Write-Host "❌ 获取DNS记录时发生错误: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# 函数：创建DNS记录
function Create-DNSRecord {
    param($record)
    
    $body = @{
        type = $record.type
        name = $record.name
        content = $record.content
        proxied = $record.proxied
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" -Method POST -Headers $headers -Body $body
        if ($response.success) {
            Write-Host "✅ 成功创建: $($record.description)" -ForegroundColor Green
            return $response.result
        } else {
            Write-Host "❌ 创建失败: $($record.description)" -ForegroundColor Red
            $response.errors | ForEach-Object { Write-Host "  错误: $($_.message)" -ForegroundColor Red }
            return $null
        }
    } catch {
        Write-Host "❌ 创建 $($record.description) 时发生错误: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# 函数：更新DNS记录
function Update-DNSRecord {
    param($recordId, $record)
    
    $body = @{
        type = $record.type
        name = $record.name
        content = $record.content
        proxied = $record.proxied
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$recordId" -Method PUT -Headers $headers -Body $body
        if ($response.success) {
            Write-Host "✅ 成功更新: $($record.description)" -ForegroundColor Green
            return $response.result
        } else {
            Write-Host "❌ 更新失败: $($record.description)" -ForegroundColor Red
            $response.errors | ForEach-Object { Write-Host "  错误: $($_.message)" -ForegroundColor Red }
            return $null
        }
    } catch {
        Write-Host "❌ 更新 $($record.description) 时发生错误: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# 主要流程
Write-Host "📋 获取现有DNS记录..." -ForegroundColor Yellow
$existingRecords = Get-ExistingDNSRecords

if ($null -eq $existingRecords) {
    Write-Host "❌ 无法获取现有DNS记录，程序退出" -ForegroundColor Red
    exit 1
}

Write-Host "📝 开始配置DNS记录..." -ForegroundColor Yellow
Write-Host ""

foreach ($record in $dnsRecords) {
    Write-Host "处理: $($record.description)" -ForegroundColor Cyan
    
    # 检查是否已存在相同记录
    $existing = $existingRecords | Where-Object { 
        $_.name -eq $record.name -and $_.type -eq $record.type 
    }
    
    if ($existing) {
        # 检查是否需要更新
        $needsUpdate = $false
        
        if ($existing.content -ne $record.content) {
            Write-Host "  内容不匹配: $($existing.content) -> $($record.content)" -ForegroundColor Yellow
            $needsUpdate = $true
        }
        
        if ($existing.proxied -ne $record.proxied) {
            Write-Host "  代理设置不匹配: $($existing.proxied) -> $($record.proxied)" -ForegroundColor Yellow
            $needsUpdate = $true
        }
        
        if ($needsUpdate) {
            Write-Host "  更新现有记录..." -ForegroundColor Yellow
            Update-DNSRecord -recordId $existing.id -record $record | Out-Null
        } else {
            Write-Host "✅ 记录已存在且配置正确" -ForegroundColor Green
        }
    } else {
        Write-Host "  创建新记录..." -ForegroundColor Yellow
        Create-DNSRecord -record $record | Out-Null
    }
    
    Write-Host ""
}

# 验证配置
Write-Host "🔍 验证DNS配置..." -ForegroundColor Cyan
Write-Host ""

$testDomains = @(
    "wwwcn.uk",
    "api.wwwcn.uk", 
    "www.wwwcn.uk"
)

foreach ($domain in $testDomains) {
    try {
        $result = Resolve-DnsName -Name $domain -Type A -ErrorAction SilentlyContinue
        if ($result) {
            Write-Host "✅ $domain -> $($result.IPAddress -join ', ')" -ForegroundColor Green
        } else {
            Write-Host "⏳ $domain -> DNS传播中..." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⏳ $domain -> DNS传播中..." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎉 DNS配置完成!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 下一步操作:" -ForegroundColor Cyan
Write-Host "1. 等待DNS传播 (通常需要几分钟到几小时)" -ForegroundColor White
Write-Host "2. 在服务器上配置SSL证书" -ForegroundColor White
Write-Host "3. 配置Nginx反向代理" -ForegroundColor White
Write-Host "4. 测试网站访问" -ForegroundColor White
Write-Host ""
Write-Host "🌐 访问地址:" -ForegroundColor Cyan
Write-Host "  主站: https://wwwcn.uk" -ForegroundColor White
Write-Host "  API:  https://api.wwwcn.uk" -ForegroundColor White
Write-Host "  WWW:  https://www.wwwcn.uk (重定向到主站)" -ForegroundColor White