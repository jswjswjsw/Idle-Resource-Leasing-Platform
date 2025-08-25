# Cloudflare API 令牌诊断工具
param([string]$Token)

if (-not $Token) {
    Write-Host "用法: .\diagnose-cloudflare-token.ps1 -Token 'your_token_here'" -ForegroundColor Yellow
    exit 1
}

Write-Host "🔍 Cloudflare API 令牌诊断报告" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray

# 1. 基础格式检查
Write-Host "`n📊 基础格式分析:" -ForegroundColor Yellow
Write-Host "令牌长度: $($Token.Length) 字符" -ForegroundColor White

# 检查长度
if ($Token.Length -eq 40) {
    Write-Host "✅ 令牌长度正确 (40字符)" -ForegroundColor Green
} elseif ($Token.Length -eq 39) {
    Write-Host "❌ 令牌长度不正确 (39字符) - 可能缺少最后一个字符" -ForegroundColor Red
} else {
    Write-Host "❌ 令牌长度异常 ($($Token.Length)字符) - 标准长度应为40字符" -ForegroundColor Red
}

# 检查字符组成
$validChars = $Token -match '^[A-Za-z0-9_-]+$'
if ($validChars) {
    Write-Host "✅ 令牌字符格式正确 (仅包含字母、数字、下划线、连字符)" -ForegroundColor Green
} else {
    Write-Host "❌ 令牌包含无效字符" -ForegroundColor Red
}

# 显示令牌内容（部分遮蔽）
$maskedToken = $Token.Substring(0, [Math]::Min(10, $Token.Length)) + "..." + 
               $Token.Substring([Math]::Max(0, $Token.Length - 5))
Write-Host "令牌内容: $maskedToken" -ForegroundColor White

# 2. 网络连接测试
Write-Host "`n🌐 网络连接测试:" -ForegroundColor Yellow
try {
    $testResponse = Invoke-WebRequest -Uri "https://api.cloudflare.com/client/v4/" -Method GET -TimeoutSec 10
    Write-Host "✅ Cloudflare API 基础连接正常" -ForegroundColor Green
} catch {
    Write-Host "❌ 无法连接到 Cloudflare API" -ForegroundColor Red
    Write-Host "错误: $($_.Exception.Message)" -ForegroundColor Red
    return
}

# 3. 令牌验证测试
Write-Host "`n🔐 令牌验证测试:" -ForegroundColor Yellow

try {
    # 构建请求
    $headers = @{
        "Authorization" = "Bearer $Token"
        "Content-Type" = "application/json"
        "User-Agent" = "PowerShell-Diagnostic/1.0"
    }
    
    # 捕获详细错误信息
    try {
        $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/user/tokens/verify" -Headers $headers -ErrorAction Stop
        
        if ($response.success) {
            Write-Host "✅ 令牌验证成功!" -ForegroundColor Green
            Write-Host "令牌ID: $($response.result.id)" -ForegroundColor Green
            Write-Host "状态: $($response.result.status)" -ForegroundColor Green
            
            # 显示权限信息
            if ($response.result.policies) {
                Write-Host "`n📋 权限配置:" -ForegroundColor Cyan
                foreach ($policy in $response.result.policies) {
                    Write-Host "  权限组: $($policy.permission_groups -join ', ')" -ForegroundColor White
                    Write-Host "  效果: $($policy.effect)" -ForegroundColor White
                    if ($policy.resources) {
                        Write-Host "  资源: $($policy.resources | ConvertTo-Json -Compress)" -ForegroundColor White
                    }
                }
            }
        } else {
            Write-Host "❌ 令牌验证失败" -ForegroundColor Red
            $response.errors | ForEach-Object {
                Write-Host "  错误 $($_.code): $($_.message)" -ForegroundColor Red
            }
        }
    } catch {
        $errorDetails = $_.Exception
        Write-Host "❌ 令牌验证失败" -ForegroundColor Red
        
        # 分析具体错误
        if ($errorDetails.Response) {
            $statusCode = $errorDetails.Response.StatusCode
            Write-Host "HTTP 状态码: $statusCode" -ForegroundColor Red
            
            # 根据状态码给出具体建议
            switch ($statusCode.value__) {
                400 { 
                    Write-Host "📝 400错误通常表示:" -ForegroundColor Yellow
                    Write-Host "  • 令牌格式不正确" -ForegroundColor White
                    Write-Host "  • 令牌长度不正确 (当前: $($Token.Length), 应为: 40)" -ForegroundColor White
                    Write-Host "  • 令牌包含无效字符" -ForegroundColor White
                }
                401 { 
                    Write-Host "📝 401错误通常表示:" -ForegroundColor Yellow
                    Write-Host "  • 令牌无效或已过期" -ForegroundColor White
                    Write-Host "  • 令牌已被撤销" -ForegroundColor White
                }
                403 { 
                    Write-Host "📝 403错误通常表示:" -ForegroundColor Yellow
                    Write-Host "  • 令牌权限不足" -ForegroundColor White
                    Write-Host "  • IP地址受限" -ForegroundColor White
                }
            }
        }
    }
} catch {
    Write-Host "❌ 网络请求失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. 解决建议
Write-Host "`n💡 解决建议:" -ForegroundColor Cyan

if ($Token.Length -ne 40) {
    Write-Host "🔧 令牌长度问题:" -ForegroundColor Yellow
    Write-Host "  1. 重新从 Cloudflare 控制台复制完整令牌" -ForegroundColor White
    Write-Host "  2. 确保复制时没有漏掉开头或结尾字符" -ForegroundColor White
    Write-Host "  3. 避免在复制过程中引入换行符或空格" -ForegroundColor White
}

Write-Host "`n🔧 通用解决步骤:" -ForegroundColor Yellow
Write-Host "1. 登录 Cloudflare 控制台 (dash.cloudflare.com)" -ForegroundColor White
Write-Host "2. 进入 'My Profile' -> 'API Tokens'" -ForegroundColor White
Write-Host "3. 找到您的令牌，检查状态是否为 'Active'" -ForegroundColor White
Write-Host "4. 如果需要，重新生成令牌，确保权限包含:" -ForegroundColor White
Write-Host "   • Zone:DNS:Edit" -ForegroundColor Gray
Write-Host "   • Zone:Zone:Read" -ForegroundColor Gray
Write-Host "   • Zone Resources: wwwcn.uk" -ForegroundColor Gray
Write-Host "5. 完整复制新令牌（应为40字符）" -ForegroundColor White

Write-Host "`n📞 如果问题持续存在:" -ForegroundColor Yellow
Write-Host "• 尝试生成一个全新的 API 令牌" -ForegroundColor White
Write-Host "• 检查您的网络是否有防火墙限制" -ForegroundColor White
Write-Host "• 确认您的 Cloudflare 账户状态正常" -ForegroundColor White

Write-Host "`n" + "=" * 50 -ForegroundColor Gray
Write-Host "诊断完成" -ForegroundColor Cyan