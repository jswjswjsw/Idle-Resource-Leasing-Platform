# 简化的 Cloudflare API 测试脚本
param([string]$Token)

if (-not $Token) {
    Write-Host "用法: .\simple-cloudflare-test.ps1 -Token 'your_token_here'" -ForegroundColor Yellow
    exit 1
}

Write-Host "测试 Cloudflare API 连接..." -ForegroundColor Cyan

# 方法1: 测试基本连接性
Write-Host "`n1. 测试 Cloudflare API 基本连接..." -ForegroundColor Yellow
try {
    $basicResponse = Invoke-WebRequest -Uri "https://api.cloudflare.com/client/v4/" -Method GET
    Write-Host "✅ Cloudflare API 基本连接正常" -ForegroundColor Green
} catch {
    Write-Host "❌ 无法连接到 Cloudflare API" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# 方法2: 测试令牌格式
Write-Host "`n2. 检查令牌格式..." -ForegroundColor Yellow
Write-Host "令牌长度: $($Token.Length)" -ForegroundColor White
if ($Token.Length -lt 30) {
    Write-Host "⚠️  令牌长度异常，可能不完整" -ForegroundColor Red
} else {
    Write-Host "✅ 令牌长度正常" -ForegroundColor Green
}

# 方法3: 使用 WebRequest 获取详细错误信息
Write-Host "`n3. 验证令牌..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $Token"
        "User-Agent" = "PowerShell-Test/1.0"
    }
    
    $webRequest = [System.Net.WebRequest]::Create("https://api.cloudflare.com/client/v4/user/tokens/verify")
    $webRequest.Method = "GET"
    $webRequest.Headers.Add("Authorization", "Bearer $Token")
    $webRequest.Headers.Add("User-Agent", "PowerShell-Test/1.0")
    
    $response = $webRequest.GetResponse()
    $stream = $response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $content = $reader.ReadToEnd()
    $reader.Close()
    $stream.Close()
    $response.Close()
    
    $result = $content | ConvertFrom-Json
    if ($result.success) {
        Write-Host "✅ 令牌验证成功!" -ForegroundColor Green
        $result | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor Green
    } else {
        Write-Host "❌ 令牌验证失败" -ForegroundColor Red
        $result | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor Red
    }
} catch [System.Net.WebException] {
    Write-Host "❌ 网络请求失败" -ForegroundColor Red
    $exception = $_.Exception
    
    if ($exception.Response) {
        $statusCode = $exception.Response.StatusCode
        $statusDescription = $exception.Response.StatusDescription
        Write-Host "HTTP状态: $statusCode - $statusDescription" -ForegroundColor Red
        
        $errorStream = $exception.Response.GetResponseStream()
        $errorReader = New-Object System.IO.StreamReader($errorStream)
        $errorContent = $errorReader.ReadToEnd()
        $errorReader.Close()
        $errorStream.Close()
        
        if ($errorContent) {
            Write-Host "错误内容:" -ForegroundColor Yellow
            try {
                $errorJson = $errorContent | ConvertFrom-Json
                $errorJson | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor Red
            } catch {
                Write-Host $errorContent -ForegroundColor Red
            }
        }
    } else {
        Write-Host $exception.Message -ForegroundColor Red
    }
}

Write-Host "`n4. 令牌问题排查指南:" -ForegroundColor Cyan
Write-Host "如果令牌验证失败，请检查:" -ForegroundColor White
Write-Host "• 令牌是否从 Cloudflare 控制台正确复制" -ForegroundColor White
Write-Host "• 令牌权限是否包含 'Zone:Zone:Read'" -ForegroundColor White
Write-Host "• 令牌是否为 'Active' 状态" -ForegroundColor White
Write-Host "• 令牌是否已过期" -ForegroundColor White
Write-Host "• Zone Resources 是否正确配置为 'wwwcn.uk'" -ForegroundColor White