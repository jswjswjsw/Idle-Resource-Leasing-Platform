$token = "7oau74rVYmV5VWw073z1FmhpZ2ZVPy3js3JFh0ke"
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