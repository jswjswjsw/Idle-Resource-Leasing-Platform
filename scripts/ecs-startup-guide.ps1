# ECS应用启动操作指南
# 请按照以下步骤在ECS服务器上操作

Write-Host "🚀 ECS应用启动操作指南" -ForegroundColor Cyan
Write-Host "=" * 50

Write-Host ""
Write-Host "📋 需要在ECS服务器上执行的操作步骤：" -ForegroundColor Yellow
Write-Host ""

Write-Host "第一步：登录ECS服务器" -ForegroundColor Green
Write-Host "方法1：通过阿里云控制台" -ForegroundColor White
Write-Host "  • 登录 https://ecs.console.aliyun.com" -ForegroundColor Gray
Write-Host "  • 找到ECS实例：116.62.44.24" -ForegroundColor Gray
Write-Host "  • 点击'远程连接' -> 'VNC远程连接'" -ForegroundColor Gray
Write-Host ""
Write-Host "方法2：通过RDP远程桌面" -ForegroundColor White
Write-Host "  • 开始 -> 运行 -> mstsc" -ForegroundColor Gray
Write-Host "  • 计算机：116.62.44.24" -ForegroundColor Gray
Write-Host "  • 用户名：Administrator" -ForegroundColor Gray
Write-Host ""

Write-Host "第二步：检查项目文件" -ForegroundColor Green
Write-Host "在ECS上打开PowerShell并运行：" -ForegroundColor White
Write-Host 'cd C:\www\trade-platform' -ForegroundColor Cyan
Write-Host 'dir' -ForegroundColor Cyan
Write-Host ""
Write-Host "应该看到backend和frontend文件夹" -ForegroundColor Gray
Write-Host ""

Write-Host "第三步：启动后端服务" -ForegroundColor Green
Write-Host "在PowerShell中运行：" -ForegroundColor White
Write-Host 'cd C:\www\trade-platform\backend' -ForegroundColor Cyan
Write-Host ""
Write-Host "检查依赖：" -ForegroundColor White
Write-Host 'npm install' -ForegroundColor Cyan
Write-Host ""
Write-Host "创建环境变量文件：" -ForegroundColor White
$envContent = @'
$env:NODE_ENV="production"
$env:PORT="5000" 
$env:SSL_ENABLED="false"
$env:DATABASE_URL="postgresql://trade_user:trade_password@localhost:5432/trade_platform"
$env:JWT_SECRET="your-super-secret-jwt-key-change-in-production"
$env:REDIS_URL="redis://localhost:6379"
'@
Write-Host $envContent -ForegroundColor Cyan
Write-Host ""
Write-Host "启动后端：" -ForegroundColor White
Write-Host 'npm start' -ForegroundColor Cyan
Write-Host ""

Write-Host "第四步：启动前端服务（新开一个PowerShell窗口）" -ForegroundColor Green
Write-Host "在新的PowerShell中运行：" -ForegroundColor White
Write-Host 'cd C:\www\trade-platform\frontend' -ForegroundColor Cyan
Write-Host 'npm install' -ForegroundColor Cyan
Write-Host 'npm start' -ForegroundColor Cyan
Write-Host ""

Write-Host "第五步：验证服务启动" -ForegroundColor Green
Write-Host "在ECS上测试：" -ForegroundColor White
Write-Host 'curl http://localhost:5000' -ForegroundColor Cyan
Write-Host 'curl http://localhost:3000' -ForegroundColor Cyan
Write-Host ""

Write-Host "🌐 成功后的访问地址：" -ForegroundColor Yellow
Write-Host "后端API：http://116.62.44.24:5000" -ForegroundColor Green
Write-Host "前端应用：http://116.62.44.24:3000" -ForegroundColor Green
Write-Host ""

Write-Host "🔍 验证命令（在您的本地电脑运行）：" -ForegroundColor Yellow

Write-Host ""
Write-Host "测试后端：" -ForegroundColor White
Write-Host 'Test-NetConnection -ComputerName 116.62.44.24 -Port 5000' -ForegroundColor Cyan

Write-Host ""
Write-Host "测试前端：" -ForegroundColor White  
Write-Host 'Test-NetConnection -ComputerName 116.62.44.24 -Port 3000' -ForegroundColor Cyan

Write-Host ""
Write-Host "测试HTTP访问：" -ForegroundColor White
Write-Host 'Invoke-WebRequest -Uri "http://116.62.44.24:5000" -Method GET' -ForegroundColor Cyan
Write-Host 'Invoke-WebRequest -Uri "http://116.62.44.24:3000" -Method GET' -ForegroundColor Cyan

Write-Host ""
Write-Host "⚠️ 如果遇到问题：" -ForegroundColor Red
Write-Host "1. 检查Windows防火墙是否阻止端口" -ForegroundColor White
Write-Host "2. 检查阿里云安全组是否开放端口3000和5000" -ForegroundColor White
Write-Host "3. 确认Node.js已安装" -ForegroundColor White
Write-Host "4. 检查项目依赖是否完整" -ForegroundColor White

Write-Host ""
Write-Host "💡 提示：完成应用启动后，请运行以下命令检查状态：" -ForegroundColor Blue
Write-Host '.\ssl-phased-setup.ps1 -Phase phase1' -ForegroundColor Cyan

Write-Host ""
Write-Host "📞 需要帮助？" -ForegroundColor Cyan
Write-Host "请告诉我ECS上执行的结果，我会继续指导下一步操作！" -ForegroundColor White