@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo 🌐 Cloudflare DNS 配置脚本
echo ================================

if "%~1"=="" (
    echo 错误: 请提供参数
    echo 使用方法: setup-cloudflare-dns.bat "API_TOKEN" "SERVER_IP"
    echo 示例: setup-cloudflare-dns.bat "3gpKcUO4DiRVStTZlIGdQe8_RRVRy364eNjGhyPw" "1.2.3.4"
    pause
    exit /b 1
)

if "%~2"=="" (
    echo 错误: 请提供服务器IP地址
    echo 使用方法: setup-cloudflare-dns.bat "API_TOKEN" "SERVER_IP"
    echo 示例: setup-cloudflare-dns.bat "3gpKcUO4DiRVStTZlIGdQe8_RRVRy364eNjGhyPw" "1.2.3.4"
    pause
    exit /b 1
)

set "TOKEN=%~1"
set "SERVER_IP=%~2"
set "ZONE_ID=8ad887047518bc2772572ade96309c55"
set "DOMAIN=wwwcn.uk"

echo 域名: %DOMAIN%
echo 服务器IP: %SERVER_IP%
echo Zone ID: %ZONE_ID%
echo.

echo 📝 调用 PowerShell 脚本进行配置...
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0setup-cloudflare-dns.ps1" -Token "%TOKEN%" -ServerIP "%SERVER_IP%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ DNS配置脚本执行完成
) else (
    echo.
    echo ❌ DNS配置过程中发生错误
)

echo.
echo 按任意键继续...
pause > nul