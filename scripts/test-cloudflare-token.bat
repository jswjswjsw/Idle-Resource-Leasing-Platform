@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

if "%~1"=="" (
    echo 用法: test-cloudflare-token.bat "your_token_here"
    echo 示例: test-cloudflare-token.bat "YIz7iNVEgny2mksJmU-nJXt5wfTKCR_dI0DDicK"
    exit /b 1
)

set "TOKEN=%~1"
echo 🔍 测试 Cloudflare API 令牌...
echo.

echo 📊 令牌信息:
echo 长度: 
echo %TOKEN% | find /c /v "" > nul && echo %TOKEN% 的长度检查...
echo 前10位: %TOKEN:~0,10%...
echo.

echo 🌐 发送验证请求...
echo.

REM 使用 PowerShell 在批处理中执行请求
powershell -Command "try { $headers = @{'Authorization'='Bearer %TOKEN%'; 'Content-Type'='application/json'}; $response = Invoke-RestMethod -Uri 'https://api.cloudflare.com/client/v4/user/tokens/verify' -Headers $headers; if ($response.success) { Write-Host '✅ 令牌验证成功!' -ForegroundColor Green; $response | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor Green } else { Write-Host '❌ 令牌验证失败' -ForegroundColor Red; $response | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor Red } } catch { Write-Host '❌ 请求失败' -ForegroundColor Red; Write-Host $_.Exception.Message -ForegroundColor Red }"

echo.
echo 📋 如果验证失败，请检查:
echo 1. 令牌是否完整复制（无多余空格）
echo 2. 令牌在 Cloudflare 控制台状态为 Active
echo 3. 令牌权限包含 Zone:Zone:Read 和 Zone:DNS:Edit
echo 4. Zone Resources 限定为 wwwcn.uk 域名
echo 5. 令牌是否已过期
echo.

pause