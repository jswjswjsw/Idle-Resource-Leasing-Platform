@echo off
chcp 65001 > nul
echo Testing new Cloudflare API token...

set TOKEN=3gpKcUO4DiRVStTZlIGdQe8_RRVRy364eNjGhyPw

echo Token length check:
echo %TOKEN% | find /c /v "" > nul
echo Token: %TOKEN:~0,10%...%TOKEN:~-5%

echo.
echo Sending verification request...

powershell -Command "try { $headers = @{'Authorization'='Bearer %TOKEN%'}; $response = Invoke-RestMethod -Uri 'https://api.cloudflare.com/client/v4/user/tokens/verify' -Headers $headers; if ($response.success) { Write-Host 'SUCCESS: Token is valid' -ForegroundColor Green; Write-Host 'Token ID:' $response.result.id; Write-Host 'Status:' $response.result.status; if ($response.result.policies) { Write-Host 'Permissions:'; foreach ($policy in $response.result.policies) { Write-Host '  -' $policy.permission_groups -join ', '; } } } else { Write-Host 'FAILED: Token validation failed' -ForegroundColor Red; $response.errors | ForEach-Object { Write-Host 'Error' $_.code ':' $_.message } } } catch { Write-Host 'ERROR: Request failed' -ForegroundColor Red; Write-Host $_.Exception.Message }"

echo.
echo Test completed.
pause