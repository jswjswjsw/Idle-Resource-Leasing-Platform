# 从环境变量获取 Cloudflare Token
$token = $env:CLOUDFLARE_API_TOKEN
if (-not $token) {
    Write-Host "错误: 请设置环境变量 CLOUDFLARE_API_TOKEN" -ForegroundColor Red
    exit 1
}
Write-Host "Token Length: $($token.Length)"

$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/user/tokens/verify" -Headers $headers
    if ($response.success) {
        Write-Host "SUCCESS: Token is valid" -ForegroundColor Green
        Write-Host "Token ID: $($response.result.id)"
        Write-Host "Status: $($response.result.status)"
    } else {
        Write-Host "FAILED: Token validation failed" -ForegroundColor Red
        $response.errors | ForEach-Object {
            Write-Host "Error $($_.code): $($_.message)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "ERROR: Request failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}