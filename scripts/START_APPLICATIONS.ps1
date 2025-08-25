# 应用启动命令 - ECS上执行
# 在构建完成后运行这些命令启动应用

Write-Host "🚀 启动Trade Platform应用" -ForegroundColor Cyan
Write-Host "=" * 40

Write-Host "📋 启动步骤：" -ForegroundColor Yellow

Write-Host ""
Write-Host "步骤1：启动后端服务" -ForegroundColor Yellow
Write-Host "打开新的PowerShell窗口并运行：" -ForegroundColor White
Write-Host 'Set-Location "C:\www\trade-platform\backend"' -ForegroundColor Green
Write-Host '$env:SSL_ENABLED="true"' -ForegroundColor Green
Write-Host '$env:NODE_ENV="production"' -ForegroundColor Green
Write-Host 'npm start' -ForegroundColor Green

Write-Host ""
Write-Host "步骤2：启动前端服务" -ForegroundColor Yellow
Write-Host "打开另一个新的PowerShell窗口并运行：" -ForegroundColor White
Write-Host 'Set-Location "C:\www\trade-platform\frontend"' -ForegroundColor Green
Write-Host 'npm start' -ForegroundColor Green

Write-Host ""
Write-Host "🌐 访问地址：" -ForegroundColor Cyan
Write-Host "前端应用: https://116.62.44.24:3000" -ForegroundColor White
Write-Host "后端API: https://116.62.44.24:5000" -ForegroundColor White
Write-Host "域名访问: https://wwwcn.uk:3000" -ForegroundColor White
Write-Host "API域名: https://api.wwwcn.uk:5000" -ForegroundColor White

Write-Host ""
Write-Host "🔍 测试命令：" -ForegroundColor Yellow
Write-Host "测试后端API：" -ForegroundColor White
Write-Host 'Invoke-WebRequest -Uri "https://116.62.44.24:5000/api/health" -Method GET' -ForegroundColor Green
Write-Host ""
Write-Host "测试前端应用：" -ForegroundColor White  
Write-Host 'Invoke-WebRequest -Uri "https://116.62.44.24:3000" -Method GET' -ForegroundColor Green

Write-Host ""
Write-Host "⚠️ 注意事项：" -ForegroundColor Red
Write-Host "1. 确保SSL证书申请已完成" -ForegroundColor White
Write-Host "2. 确保环境变量文件已创建" -ForegroundColor White
Write-Host "3. 确保防火墙规则已配置" -ForegroundColor White
Write-Host "4. 确保前后端已成功构建" -ForegroundColor White

Write-Host ""
Write-Host "🔄 如果SSL证书未完成，使用HTTP模式：" -ForegroundColor Cyan
Write-Host "后端启动（HTTP模式）：" -ForegroundColor White
Write-Host 'Set-Location "C:\www\trade-platform\backend"' -ForegroundColor Green
Write-Host '$env:SSL_ENABLED="false"' -ForegroundColor Green
Write-Host 'npm start' -ForegroundColor Green
Write-Host ""
Write-Host "访问地址（HTTP模式）：" -ForegroundColor White
Write-Host "前端: http://116.62.44.24:3000" -ForegroundColor Gray
Write-Host "后端: http://116.62.44.24:5000" -ForegroundColor Gray