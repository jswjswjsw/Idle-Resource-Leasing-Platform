# Cloudflare API Token Diagnostic Tool
param([string]$Token)

if (-not $Token) {
    Write-Host "Usage: .\diagnose-token-en.ps1 -Token 'your_token_here'" -ForegroundColor Yellow
    exit 1
}

Write-Host "Cloudflare API Token Diagnostic Report" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray

# 1. Basic format check
Write-Host "`nBasic Format Analysis:" -ForegroundColor Yellow
Write-Host "Token Length: $($Token.Length) characters" -ForegroundColor White

# Check length
if ($Token.Length -eq 40) {
    Write-Host "✅ Token length is correct (40 characters)" -ForegroundColor Green
} elseif ($Token.Length -eq 39) {
    Write-Host "❌ Token length is incorrect (39 characters) - Missing last character" -ForegroundColor Red
    Write-Host "⚠️  Standard Cloudflare API tokens are 40 characters long" -ForegroundColor Yellow
} else {
    Write-Host "❌ Token length is abnormal ($($Token.Length) characters) - Should be 40" -ForegroundColor Red
}

# Check character composition
$validChars = $Token -match '^[A-Za-z0-9_-]+$'
if ($validChars) {
    Write-Host "✅ Token character format is correct" -ForegroundColor Green
} else {
    Write-Host "❌ Token contains invalid characters" -ForegroundColor Red
}

# Show masked token
$maskedToken = $Token.Substring(0, [Math]::Min(10, $Token.Length)) + "..." + 
               $Token.Substring([Math]::Max(0, $Token.Length - 5))
Write-Host "Token Content: $maskedToken" -ForegroundColor White

# 2. Network connectivity test
Write-Host "`nNetwork Connectivity Test:" -ForegroundColor Yellow
try {
    $testResponse = Invoke-WebRequest -Uri "https://api.cloudflare.com/client/v4/" -Method GET -TimeoutSec 10
    Write-Host "✅ Cloudflare API basic connection is normal" -ForegroundColor Green
} catch {
    Write-Host "❌ Cannot connect to Cloudflare API" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    return
}

# 3. Token verification test
Write-Host "`nToken Verification Test:" -ForegroundColor Yellow

try {
    $headers = @{
        "Authorization" = "Bearer $Token"
        "Content-Type" = "application/json"
        "User-Agent" = "PowerShell-Diagnostic/1.0"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/user/tokens/verify" -Headers $headers -ErrorAction Stop
        
        if ($response.success) {
            Write-Host "✅ Token verification successful!" -ForegroundColor Green
            Write-Host "Token ID: $($response.result.id)" -ForegroundColor Green
            Write-Host "Status: $($response.result.status)" -ForegroundColor Green
        } else {
            Write-Host "❌ Token verification failed" -ForegroundColor Red
            $response.errors | ForEach-Object {
                Write-Host "  Error $($_.code): $($_.message)" -ForegroundColor Red
            }
        }
    } catch {
        $errorDetails = $_.Exception
        Write-Host "❌ Token verification failed" -ForegroundColor Red
        
        if ($errorDetails.Response) {
            $statusCode = $errorDetails.Response.StatusCode
            Write-Host "HTTP Status Code: $statusCode" -ForegroundColor Red
            
            switch ($statusCode.value__) {
                400 { 
                    Write-Host "`n400 Error usually indicates:" -ForegroundColor Yellow
                    Write-Host "  • Invalid token format" -ForegroundColor White
                    Write-Host "  • Incorrect token length (Current: $($Token.Length), Should be: 40)" -ForegroundColor White
                    Write-Host "  • Token contains invalid characters" -ForegroundColor White
                }
                401 { 
                    Write-Host "`n401 Error usually indicates:" -ForegroundColor Yellow
                    Write-Host "  • Token is invalid or expired" -ForegroundColor White
                    Write-Host "  • Token has been revoked" -ForegroundColor White
                }
                403 { 
                    Write-Host "`n403 Error usually indicates:" -ForegroundColor Yellow
                    Write-Host "  • Insufficient token permissions" -ForegroundColor White
                    Write-Host "  • IP address restriction" -ForegroundColor White
                }
            }
        }
    }
} catch {
    Write-Host "❌ Network request failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Solution recommendations
Write-Host "`nSolution Recommendations:" -ForegroundColor Cyan

if ($Token.Length -ne 40) {
    Write-Host "`nToken Length Issue:" -ForegroundColor Yellow
    Write-Host "  1. Re-copy the complete token from Cloudflare dashboard" -ForegroundColor White
    Write-Host "  2. Ensure no characters are missing from beginning or end" -ForegroundColor White
    Write-Host "  3. Avoid introducing line breaks or spaces during copy" -ForegroundColor White
}

Write-Host "`nGeneral Solution Steps:" -ForegroundColor Yellow
Write-Host "1. Login to Cloudflare dashboard (dash.cloudflare.com)" -ForegroundColor White
Write-Host "2. Go to 'My Profile' -> 'API Tokens'" -ForegroundColor White
Write-Host "3. Find your token and check status is 'Active'" -ForegroundColor White
Write-Host "4. If needed, regenerate token with permissions:" -ForegroundColor White
Write-Host "   • Zone:DNS:Edit" -ForegroundColor Gray
Write-Host "   • Zone:Zone:Read" -ForegroundColor Gray
Write-Host "   • Zone Resources: wwwcn.uk" -ForegroundColor Gray
Write-Host "5. Copy the complete new token (should be 40 characters)" -ForegroundColor White

Write-Host "`nIf problem persists:" -ForegroundColor Yellow
Write-Host "• Try generating a brand new API token" -ForegroundColor White
Write-Host "• Check if your network has firewall restrictions" -ForegroundColor White
Write-Host "• Confirm your Cloudflare account status is normal" -ForegroundColor White

Write-Host "`n" + "=" * 50 -ForegroundColor Gray
Write-Host "Diagnosis Complete" -ForegroundColor Cyan