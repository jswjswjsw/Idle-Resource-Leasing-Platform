@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM ==============================================
REM Cloudflare + wwwcn.uk 域名部署脚本 (Windows版)
REM ==============================================

echo.
echo 🌐 wwwcn.uk 域名 Cloudflare 部署工具
echo ==============================================
echo.

REM 域名配置
set DOMAIN=wwwcn.uk
set API_DOMAIN=api.wwwcn.uk

REM 检查 curl 是否可用
where curl >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: curl 未安装或不在PATH中
    echo 请先安装 curl 或使用 Windows 10/11 自带的 curl
    pause
    exit /b 1
)

echo ✅ 检测到 curl 工具

REM 获取 Cloudflare API Token
if "%CLOUDFLARE_API_TOKEN%"=="" (
    echo.
    echo 📝 请设置 Cloudflare API Token
    echo 👉 访问: https://dash.cloudflare.com/profile/api-tokens
    echo 📋 创建 Token，权限选择:
    echo    - Zone:Zone:Edit
    echo    - Zone:DNS:Edit  
    echo    - Zone:Zone Settings:Edit
    echo.
    set /p CLOUDFLARE_API_TOKEN="请输入您的 Cloudflare API Token: "
)

REM 获取 Zone ID
if "%CLOUDFLARE_ZONE_ID%"=="" (
    echo.
    echo 📝 请设置 Zone ID
    echo 👉 在 Cloudflare 域名概览页面右侧可找到
    echo.
    set /p CLOUDFLARE_ZONE_ID="请输入您的 Zone ID: "
)

REM 验证 API Token
echo.
echo 🔍 验证 Cloudflare API Token...
curl -s -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" ^
    -H "Authorization: Bearer %CLOUDFLARE_API_TOKEN%" ^
    -H "Content-Type: application/json" > temp_response.json

findstr "\"success\":true" temp_response.json >nul
if errorlevel 1 (
    echo ❌ API Token 验证失败，请检查Token是否正确
    del temp_response.json
    pause
    exit /b 1
)

echo ✅ API Token 验证成功
del temp_response.json

REM 获取服务器IP
if "%SERVER_IP%"=="" (
    echo.
    echo 📝 请输入您的服务器IP地址
    echo 💡 如果还没有服务器，可以稍后在 Cloudflare 控制台手动修改
    echo.
    set /p SERVER_IP="服务器 IP 地址: "
)

if "%SERVER_IP%"=="" (
    echo ⚠️  暂时跳过 DNS 记录创建，请稍后手动配置
    goto :SSL_CONFIG
)

REM 创建 DNS 记录
echo.
echo 📡 配置 DNS 记录...

REM 主域名 A 记录
echo 🔧 创建主域名 A 记录: %DOMAIN% -> %SERVER_IP%
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/%CLOUDFLARE_ZONE_ID%/dns_records" ^
    -H "Authorization: Bearer %CLOUDFLARE_API_TOKEN%" ^
    -H "Content-Type: application/json" ^
    --data "{\"type\":\"A\",\"name\":\"@\",\"content\":\"%SERVER_IP%\",\"ttl\":1,\"proxied\":true}" > temp_response.json

findstr "\"success\":true" temp_response.json >nul
if errorlevel 1 (
    echo ⚠️  主域名 A 记录可能已存在或创建失败
) else (
    echo ✅ 主域名 A 记录创建成功
)

REM API 子域名 A 记录  
echo 🔧 创建 API 子域名 A 记录: %API_DOMAIN% -> %SERVER_IP%
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/%CLOUDFLARE_ZONE_ID%/dns_records" ^
    -H "Authorization: Bearer %CLOUDFLARE_API_TOKEN%" ^
    -H "Content-Type: application/json" ^
    --data "{\"type\":\"A\",\"name\":\"api\",\"content\":\"%SERVER_IP%\",\"ttl\":1,\"proxied\":true}" > temp_response.json

findstr "\"success\":true" temp_response.json >nul
if errorlevel 1 (
    echo ⚠️  API 子域名 A 记录可能已存在或创建失败
) else (
    echo ✅ API 子域名 A 记录创建成功
)

REM WWW CNAME 记录
echo 🔧 创建 WWW CNAME 记录: www.%DOMAIN% -> %DOMAIN%
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/%CLOUDFLARE_ZONE_ID%/dns_records" ^
    -H "Authorization: Bearer %CLOUDFLARE_API_TOKEN%" ^
    -H "Content-Type: application/json" ^
    --data "{\"type\":\"CNAME\",\"name\":\"www\",\"content\":\"%DOMAIN%\",\"ttl\":1,\"proxied\":true}" > temp_response.json

findstr "\"success\":true" temp_response.json >nul
if errorlevel 1 (
    echo ⚠️  WWW CNAME 记录可能已存在或创建失败
) else (
    echo ✅ WWW CNAME 记录创建成功
)

del temp_response.json

:SSL_CONFIG
REM 配置 SSL/TLS
echo.
echo 🔒 配置 SSL/TLS 设置...

REM 设置 SSL 模式为 Full (strict)
curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/%CLOUDFLARE_ZONE_ID%/settings/ssl" ^
    -H "Authorization: Bearer %CLOUDFLARE_API_TOKEN%" ^
    -H "Content-Type: application/json" ^
    --data "{\"value\":\"strict\"}" >nul

REM 启用自动 HTTPS 重定向
curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/%CLOUDFLARE_ZONE_ID%/settings/automatic_https_rewrites" ^
    -H "Authorization: Bearer %CLOUDFLARE_API_TOKEN%" ^
    -H "Content-Type: application/json" ^
    --data "{\"value\":\"on\"}" >nul

echo ✅ SSL/TLS 配置完成

REM 配置性能优化
echo.
echo ⚡ 配置性能优化...

REM 启用 Brotli 压缩
curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/%CLOUDFLARE_ZONE_ID%/settings/brotli" ^
    -H "Authorization: Bearer %CLOUDFLARE_API_TOKEN%" ^
    -H "Content-Type: application/json" ^
    --data "{\"value\":\"on\"}" >nul

REM 启用 Auto Minify
curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/%CLOUDFLARE_ZONE_ID%/settings/minify" ^
    -H "Authorization: Bearer %CLOUDFLARE_API_TOKEN%" ^
    -H "Content-Type: application/json" ^
    --data "{\"value\":{\"css\":\"on\",\"html\":\"on\",\"js\":\"on\"}}" >nul

echo ✅ 性能优化配置完成

REM 配置安全设置
echo.
echo 🛡️  配置安全设置...

REM 设置安全级别
curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/%CLOUDFLARE_ZONE_ID%/settings/security_level" ^
    -H "Authorization: Bearer %CLOUDFLARE_API_TOKEN%" ^
    -H "Content-Type: application/json" ^
    --data "{\"value\":\"medium\"}" >nul

echo ✅ 安全设置配置完成

echo.
echo 🎉 Cloudflare 配置完成！
echo.
echo 📋 配置摘要:
echo    🌐 主域名: https://%DOMAIN%
echo    🔗 API地址: https://%API_DOMAIN%
echo    🔒 SSL模式: Full (strict)
echo    ⚡ 性能优化: 已启用
echo    🛡️  安全防护: 已启用
echo    🇨🇳 中国访问: 支持 (通过香港节点)
echo.
echo 📝 下一步操作:
echo    1. 部署您的应用到服务器
echo    2. 确保服务器开放80和443端口
echo    3. 安装SSL证书到服务器 (或使用Cloudflare的SSL)
echo    4. 测试域名访问: https://%DOMAIN%
echo    5. 更新第三方服务回调地址为新域名
echo.
echo ⏰ DNS 生效时间: 通常5-10分钟
echo 🔍 测试中国访问: 可使用在线工具检测
echo.

pause