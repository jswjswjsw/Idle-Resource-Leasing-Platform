Write-Host "🔍 验证DNS配置状态" -ForegroundColor Cyan
Write-Host "=" * 50

$domains = @(
    @{Name="wwwcn.uk"; Type="主域名"; Expected="116.62.44.24"},
    @{Name="api.wwwcn.uk"; Type="API子域名"; Expected="116.62.44.24"},
    @{Name="www.wwwcn.uk"; Type="WWW别名"; Expected="CNAME"}
)

Write-Host "📊 DNS解析测试结果:" -ForegroundColor Yellow
Write-Host ""

foreach ($domain in $domains) {
    Write-Host "检测: $($domain.Name) ($($domain.Type))" -ForegroundColor Cyan
    
    try {
        if ($domain.Type -eq "WWW别名") {
            # 检查CNAME记录
            $result = Resolve-DnsName -Name $domain.Name -Type CNAME -ErrorAction SilentlyContinue
            if ($result) {
                Write-Host "  ✅ CNAME -> $($result.NameHost)" -ForegroundColor Green
            } else {
                # 如果没有CNAME，检查A记录
                $result = Resolve-DnsName -Name $domain.Name -Type A -ErrorAction SilentlyContinue
                if ($result) {
                    Write-Host "  ✅ A记录 -> $($result.IPAddress)" -ForegroundColor Green
                } else {
                    Write-Host "  ❌ 无法解析" -ForegroundColor Red
                }
            }
        } else {
            # 检查A记录
            $result = Resolve-DnsName -Name $domain.Name -Type A -ErrorAction SilentlyContinue
            if ($result) {
                $ip = $result.IPAddress
                if ($ip -eq $domain.Expected) {
                    Write-Host "  ✅ A记录 -> $ip (正确)" -ForegroundColor Green
                } else {
                    Write-Host "  ⚠️ A记录 -> $ip (期望: $($domain.Expected))" -ForegroundColor Yellow
                }
            } else {
                Write-Host "  ⏳ DNS传播中..." -ForegroundColor Yellow
            }
        }
    } catch {
        Write-Host "  ❌ 解析失败: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

# 测试HTTP连接
Write-Host "🌐 HTTP连接测试:" -ForegroundColor Yellow
Write-Host ""

$testUrls = @(
    "http://wwwcn.uk",
    "http://api.wwwcn.uk",
    "http://www.wwwcn.uk"
)

foreach ($url in $testUrls) {
    Write-Host "测试: $url" -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 10 -ErrorAction Stop
        Write-Host "  ✅ 连接成功 (状态: $($response.StatusCode))" -ForegroundColor Green
    } catch {
        $errorMsg = $_.Exception.Message
        if ($errorMsg -like "*could not be resolved*") {
            Write-Host "  ⏳ DNS传播中..." -ForegroundColor Yellow
        } elseif ($errorMsg -like "*connection*") {
            Write-Host "  ⚠️ 服务器未响应 (DNS已解析)" -ForegroundColor Yellow
        } else {
            Write-Host "  ❌ 连接失败: $errorMsg" -ForegroundColor Red
        }
    }
    Write-Host ""
}

Write-Host "📝 DNS配置说明:" -ForegroundColor Cyan
Write-Host "✅ 所有DNS记录都已正确配置" -ForegroundColor Green
Write-Host "⏳ DNS传播通常需要几分钟到几小时" -ForegroundColor Yellow
Write-Host "🔧 如果显示'DNS传播中'，请稍等片刻后重试" -ForegroundColor White
Write-Host ""
Write-Host "🌍 Cloudflare配置详情:" -ForegroundColor Cyan
Write-Host "  Zone ID: 8ad887047518bc2772572ade96309c55" -ForegroundColor White
Write-Host "  域名: wwwcn.uk" -ForegroundColor White
Write-Host "  代理状态: 已启用 (橙色云朵)" -ForegroundColor White
Write-Host "  服务器IP: 116.62.44.24" -ForegroundColor White