# Cloudflare API Token 验证脚本
# 用于测试 API 令牌是否有效以及权限配置

param(
    [string]$Token = $null
)

# 如果没有提供令牌，尝试从环境变量读取
if (-not $Token) {
    $Token = $env:CLOUDFLARE_API_TOKEN
    if (-not $Token) {
        Write-Host "错误: 请提供 API 令牌" -ForegroundColor Red
        Write-Host "使用方法: .\test-cloudflare-token.ps1 -Token 'your_token_here'" -ForegroundColor Yellow
        Write-Host "或者设置环境变量: `$env:CLOUDFLARE_API_TOKEN = 'your_token_here'" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "正在验证 Cloudflare API 令牌..." -ForegroundColor Cyan

try {
    # 首先检查令牌格式
    Write-Host "🔍 检查令牌格式..." -ForegroundColor Cyan
    Write-Host "令牌长度: $($Token.Length)" -ForegroundColor White
    Write-Host "令牌前10位: $($Token.Substring(0, [Math]::Min(10, $Token.Length)))..." -ForegroundColor White
    
    # 验证令牌
    Write-Host "🌐 发送验证请求..." -ForegroundColor Cyan
    $headers = @{
        "Authorization" = "Bearer $Token"
        "Content-Type" = "application/json"
    }
    
    # 使用更详细的错误处理
    try {
        $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/user/tokens/verify" -Method GET -Headers $headers -ErrorAction Stop
    } catch [System.Net.WebException] {
        $errorResponse = $_.Exception.Response
        $statusCode = $errorResponse.StatusCode
        $statusDescription = $errorResponse.StatusDescription
        
        Write-Host "❌ HTTP错误: $statusCode - $statusDescription" -ForegroundColor Red
        
        # 尝试读取错误响应内容
        $stream = $errorResponse.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errorContent = $reader.ReadToEnd()
        $reader.Close()
        $stream.Close()
        
        if ($errorContent) {
            Write-Host "📄 错误响应内容:" -ForegroundColor Yellow
            try {
                $errorJson = $errorContent | ConvertFrom-Json
                $errorJson | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor Red
                
                # 分析具体错误
                if ($errorJson.errors) {
                    Write-Host "`n🔍 错误分析:" -ForegroundColor Cyan
                    foreach ($error in $errorJson.errors) {
                        switch ($error.code) {
                            1000 { Write-Host "  - 无效的令牌格式" -ForegroundColor Red }
                            1001 { Write-Host "  - 缺少Authorization头" -ForegroundColor Red }
                            1002 { Write-Host "  - 令牌已过期" -ForegroundColor Red }
                            1003 { Write-Host "  - 令牌无效或已撤销" -ForegroundColor Red }
                            default { Write-Host "  - 错误代码 $($error.code): $($error.message)" -ForegroundColor Red }
                        }
                    }
                }
            } catch {
                Write-Host $errorContent -ForegroundColor Red
            }
        }
        
        # 提供解决建议
        Write-Host "`n💡 解决建议:" -ForegroundColor Yellow
        Write-Host "1. 检查令牌是否完整复制（注意不要包含多余空格）" -ForegroundColor White
        Write-Host "2. 确认令牌在 Cloudflare 控制台中状态为 'Active'" -ForegroundColor White
        Write-Host "3. 验证令牌权限包含 'Zone:Zone:Read' 和 'Zone:DNS:Edit'" -ForegroundColor White
        Write-Host "4. 检查令牌是否已过期" -ForegroundColor White
        
        return
    }
    
    if ($response.success) {
        Write-Host "✅ API 令牌验证成功!" -ForegroundColor Green
        Write-Host "令牌ID: $($response.result.id)" -ForegroundColor Green
        Write-Host "状态: $($response.result.status)" -ForegroundColor Green
        
        # 获取令牌权限信息
        Write-Host "`n🔍 检查令牌权限..." -ForegroundColor Cyan
        
        if ($response.result.policies) {
            Write-Host "权限配置:" -ForegroundColor Yellow
            foreach ($policy in $response.result.policies) {
                Write-Host "  - 效果: $($policy.effect)" -ForegroundColor White
                Write-Host "  - 权限: $($policy.permission_groups -join ', ')" -ForegroundColor White
                Write-Host "  - 资源: $($policy.resources | ConvertTo-Json -Compress)" -ForegroundColor White
            }
        }
    } else {
        Write-Host "❌ API 令牌验证失败!" -ForegroundColor Red
        Write-Host "错误信息:" -ForegroundColor Red
        foreach ($error in $response.errors) {
            Write-Host "  - 代码: $($error.code), 消息: $($error.message)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "❌ 请求失败!" -ForegroundColor Red
    Write-Host "错误详情: $($_.Exception.Message)" -ForegroundColor Red
    
    # 尝试解析响应内容
    if ($_.Exception.Response) {
        try {
            $errorResponse = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorResponse)
            $errorContent = $reader.ReadToEnd()
            $errorJson = $errorContent | ConvertFrom-Json
            
            Write-Host "`n详细错误信息:" -ForegroundColor Yellow
            Write-Host $errorContent -ForegroundColor Red
        } catch {
            Write-Host "无法解析错误响应" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n📝 根据项目配置要求，API 令牌应该具有以下权限:" -ForegroundColor Cyan
Write-Host "  - Zone:DNS:Edit (编辑 DNS 记录)" -ForegroundColor White
Write-Host "  - Zone:Zone:Read (读取区域信息)" -ForegroundColor White
Write-Host "  - Zone Resources: wwwcn.uk (限定到特定域名)" -ForegroundColor White
Write-Host "`n如果令牌验证失败，请检查:" -ForegroundColor Yellow
Write-Host "  1. 令牌是否正确复制（注意空格和特殊字符）" -ForegroundColor White
Write-Host "  2. 令牌权限是否按要求配置" -ForegroundColor White
Write-Host "  3. 令牌是否已过期" -ForegroundColor White