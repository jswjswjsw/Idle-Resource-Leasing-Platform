# RDS数据库部署脚本 - 修复编码版本
# 设置控制台编码为UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# 配置参数
$Region = "cn-hangzhou"
$InstanceName = "trade-platform-db"
$DatabaseName = "trade_platform"
$Username = "trade_admin"
$Password = "Db_11010811."

Write-Host "=== 阿里云RDS数据库部署配置 ===" -ForegroundColor Cyan

Write-Host ""
Write-Host "部署配置信息:" -ForegroundColor Green
Write-Host "地域: $Region"
Write-Host "实例名: $InstanceName"
Write-Host "数据库名: $DatabaseName"
Write-Host "用户名: $Username"
Write-Host "密码: $Password"

Write-Host ""
Write-Host "请按照以下步骤在阿里云控制台创建RDS实例:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 登录阿里云控制台: https://rds.console.aliyun.com" -ForegroundColor White
Write-Host ""
Write-Host "2. 创建MySQL实例，配置如下:" -ForegroundColor White
Write-Host "   - 地域: $Region" -ForegroundColor Gray
Write-Host "   - 数据库类型: MySQL" -ForegroundColor Gray
Write-Host "   - 版本: 8.0" -ForegroundColor Gray
Write-Host "   - 规格: 2核4GB (db.mysql.s3.large)" -ForegroundColor Gray
Write-Host "   - 存储: 100GB" -ForegroundColor Gray
Write-Host "   - 网络: VPC" -ForegroundColor Gray
Write-Host ""
Write-Host "3. 创建数据库账号:" -ForegroundColor White
Write-Host "   - 账号名: $Username" -ForegroundColor Gray
Write-Host "   - 密码: $Password" -ForegroundColor Gray
Write-Host "   - 权限: 读写" -ForegroundColor Gray
Write-Host ""
Write-Host "4. 创建数据库:" -ForegroundColor White
Write-Host "   - 数据库名: $DatabaseName" -ForegroundColor Gray
Write-Host "   - 字符集: utf8mb4" -ForegroundColor Gray
Write-Host ""
Write-Host "5. 设置白名单:" -ForegroundColor White
Write-Host "   - 添加ECS IP: 116.62.44.24" -ForegroundColor Gray
Write-Host "   - 或添加: 0.0.0.0/0 (测试用)" -ForegroundColor Gray
Write-Host ""

# 等待用户输入连接地址
Write-Host "请完成以上步骤后，输入RDS实例的连接地址:" -ForegroundColor Yellow
$endpoint = Read-Host "连接地址"
$port = Read-Host "端口 (默认3306)"
if ([string]::IsNullOrEmpty($port)) { $port = "3306" }

# 生成数据库连接字符串
$databaseUrl = "mysql://${Username}:${Password}@${endpoint}:${port}/${DatabaseName}?schema=public&sslmode=require"

Write-Host ""
Write-Host "=== 数据库配置完成 ===" -ForegroundColor Green
Write-Host ""
Write-Host "数据库连接信息:" -ForegroundColor Cyan
Write-Host "连接地址: $endpoint"
Write-Host "端口: $port"
Write-Host "数据库名: $DatabaseName"
Write-Host "用户名: $Username"
Write-Host "密码: $Password"
Write-Host ""
Write-Host "完整连接字符串:" -ForegroundColor Yellow
Write-Host $databaseUrl
Write-Host ""

# 保存配置
$configContent = @"
# 阿里云RDS配置
DATABASE_URL="$databaseUrl"
RDS_ENDPOINT="$endpoint"
RDS_PORT="$port"
RDS_DATABASE="$DatabaseName"
RDS_USERNAME="$Username"
RDS_PASSWORD="$Password"
"@

$configPath = "rds-config.env"
$configContent | Out-File -FilePath $configPath -Encoding UTF8
Write-Host "配置已保存到: $configPath" -ForegroundColor Green

Write-Host ""
Write-Host "下一步操作:" -ForegroundColor Cyan
Write-Host "1. 更新backend/.env文件，添加DATABASE_URL" -ForegroundColor White
Write-Host "2. 运行数据库迁移: cd backend && npx prisma db push" -ForegroundColor White
Write-Host "3. 插入初始数据: npm run db:seed" -ForegroundColor White
Write-Host "4. 在ECS上更新环境变量并重启应用" -ForegroundColor White