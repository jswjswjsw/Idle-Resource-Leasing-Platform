# 阿里云RDS MySQL数据库部署脚本
# 为闲置资源租赁平台创建生产环境数据库

param(
    [string]$Region = "cn-hangzhou",
    [string]$InstanceName = "trade-platform-db",
    [string]$DatabaseName = "trade_platform",
    [string]$Username = "trade_admin",
    [string]$Password = "",
    [switch]$CreateOnly = $false
)

Write-Host "🗄️ 阿里云RDS MySQL数据库部署" -ForegroundColor Cyan
Write-Host "=" * 50

# 检查阿里云CLI
if (-not (Get-Command aliyun -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 未安装阿里云CLI，正在安装..." -ForegroundColor Red
    
    # 下载并安装阿里云CLI
    $cliUrl = "https://aliyuncli.alicdn.com/aliyun-cli-windows-latest-amd64.zip"
    $tempPath = "$env:TEMP\aliyun-cli.zip"
    $installPath = "C:\aliyun-cli"
    
    try {
        Invoke-WebRequest -Uri $cliUrl -OutFile $tempPath
        Expand-Archive -Path $tempPath -DestinationPath $installPath -Force
        
        # 添加到环境变量
        $env:PATH += ";$installPath"
        [Environment]::SetEnvironmentVariable('PATH', $env:PATH, [EnvironmentVariableTarget]::User)
        
        Write-Host "✅ 阿里云CLI安装完成" -ForegroundColor Green
    } catch {
        Write-Host "❌ 阿里云CLI安装失败: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# 生成随机密码（如果未提供）
if (-not $Password) {
    $Password = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_})
    Write-Host "🔑 生成随机密码: $Password" -ForegroundColor Yellow
}

Write-Host "📋 部署配置:" -ForegroundColor Yellow
Write-Host "  地域: $Region" -ForegroundColor White
Write-Host "  实例名: $InstanceName" -ForegroundColor White
Write-Host "  数据库名: $DatabaseName" -ForegroundColor White
Write-Host "  用户名: $Username" -ForegroundColor White
Write-Host "  密码: $Password" -ForegroundColor White

# 1. 创建RDS实例
Write-Host ""
Write-Host "🚀 第1步：创建RDS MySQL实例..." -ForegroundColor Yellow

$createInstanceCmd = "aliyun rds CreateDBInstance --RegionId $Region --Engine MySQL --EngineVersion 8.0 --DBInstanceClass db.mysql.s3.large --DBInstanceStorage 100 --PayType Postpaid --DBInstanceDescription '$InstanceName' --SecurityIPList '0.0.0.0/0' --InstanceNetworkType VPC --DBInstanceStorageType cloud_essd"

try {
    $result = Invoke-Expression $createInstanceCmd | ConvertFrom-Json
    $instanceId = $result.DBInstanceId
    Write-Host "✅ RDS实例创建成功: $instanceId" -ForegroundColor Green
} catch {
    Write-Host "❌ RDS实例创建失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. 等待实例创建完成
Write-Host ""
Write-Host "⏳ 第2步：等待实例创建完成..." -ForegroundColor Yellow

do {
    Start-Sleep -Seconds 30
    $statusCmd = "aliyun rds DescribeDBInstances --DBInstanceId $instanceId"
    $statusResult = Invoke-Expression $statusCmd | ConvertFrom-Json
    $status = $statusResult.Items.DBInstance[0].DBInstanceStatus
    Write-Host "实例状态: $status" -ForegroundColor Gray
} while ($status -eq "Creating")

if ($status -ne "Running") {
    Write-Host "❌ 实例创建失败，状态: $status" -ForegroundColor Red
    exit 1
}

Write-Host "✅ RDS实例运行正常" -ForegroundColor Green

# 3. 获取连接信息
Write-Host ""
Write-Host "📡 第3步：获取连接信息..." -ForegroundColor Yellow

$connectionCmd = "aliyun rds DescribeDBInstanceNetInfo --DBInstanceId $instanceId"
$connectionResult = Invoke-Expression $connectionCmd | ConvertFrom-Json
$endpoint = $connectionResult.DBInstanceNetInfos.DBInstanceNetInfo[0].ConnectionString
$port = $connectionResult.DBInstanceNetInfos.DBInstanceNetInfo[0].Port

Write-Host "✅ 连接地址: $endpoint" -ForegroundColor Green
Write-Host "✅ 端口: $port" -ForegroundColor Green

# 4. 创建数据库账号
Write-Host ""
Write-Host "👤 第4步：创建数据库账号..." -ForegroundColor Yellow

$createAccountCmd = "aliyun rds CreateAccount --DBInstanceId $instanceId --AccountName $Username --AccountPassword $Password --AccountDescription 'Trade Platform Admin Account'"

try {
    Invoke-Expression $createAccountCmd | Out-Null
    Write-Host "✅ 数据库账号创建成功" -ForegroundColor Green
} catch {
    Write-Host "❌ 数据库账号创建失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. 创建数据库
Write-Host ""
Write-Host "🗃️ 第5步：创建数据库..." -ForegroundColor Yellow

$createDbCmd = "aliyun rds CreateDatabase --DBInstanceId $instanceId --DBName $DatabaseName --CharacterSetName utf8mb4 --DBDescription 'Trade Platform Database'"

try {
    Invoke-Expression $createDbCmd | Out-Null
    Write-Host "✅ 数据库创建成功" -ForegroundColor Green
} catch {
    Write-Host "❌ 数据库创建失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. 授权账号访问数据库
Write-Host ""
Write-Host "🔐 第6步：授权账号访问数据库..." -ForegroundColor Yellow

$grantCmd = "aliyun rds GrantAccountPrivilege --DBInstanceId $instanceId --AccountName $Username --DBName $DatabaseName --AccountPrivilege ReadWrite"

try {
    Invoke-Expression $grantCmd | Out-Null
    Write-Host "✅ 数据库授权成功" -ForegroundColor Green
} catch {
    Write-Host "❌ 数据库授权失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 7. 生成数据库连接字符串
$databaseUrl = "mysql://${Username}:${Password}@${endpoint}:${port}/${DatabaseName}?schema=public&sslmode=require"

Write-Host ""
Write-Host "🎉 数据库部署完成！" -ForegroundColor Green
Write-Host "=" * 50
Write-Host "📋 数据库信息:" -ForegroundColor Cyan
Write-Host "  实例ID: $instanceId" -ForegroundColor White
Write-Host "  连接地址: $endpoint" -ForegroundColor White
Write-Host "  端口: $port" -ForegroundColor White
Write-Host "  数据库名: $DatabaseName" -ForegroundColor White
Write-Host "  用户名: $Username" -ForegroundColor White
Write-Host "  密码: $Password" -ForegroundColor White
Write-Host ""
Write-Host "🔗 数据库连接字符串:" -ForegroundColor Cyan
Write-Host $databaseUrl -ForegroundColor Yellow

# 8. 保存配置到文件
$configContent = @"
# 阿里云RDS配置信息
ALIYUN_RDS_INSTANCE_ID=$instanceId
ALIYUN_RDS_ENDPOINT=$endpoint
ALIYUN_RDS_PORT=$port
ALIYUN_RDS_DATABASE=$DatabaseName
ALIYUN_RDS_USERNAME=$Username
ALIYUN_RDS_PASSWORD=$Password

# 完整数据库连接字符串
DATABASE_URL="$databaseUrl"
"@

$configPath = ".\rds-config.env"
$configContent | Out-File -FilePath $configPath -Encoding UTF8
Write-Host ""
Write-Host "💾 配置已保存到: $configPath" -ForegroundColor Green

if (-not $CreateOnly) {
    Write-Host ""
    Write-Host "🔄 第7步：部署数据库表结构..." -ForegroundColor Yellow
    
    # 更新环境变量
    $env:DATABASE_URL = $databaseUrl
    
    try {
        # 应用数据库迁移
        Set-Location "backend"
        npx prisma db push
        
        # 生成Prisma客户端
        npx prisma generate
        
        Write-Host "✅ 数据库表结构部署成功" -ForegroundColor Green
        
        # 可选：插入初始数据
        Write-Host ""
        Write-Host "📊 插入初始数据..." -ForegroundColor Yellow
        # npx prisma db seed
        
    } catch {
        Write-Host "❌ 数据库表结构部署失败: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "请手动执行以下命令:" -ForegroundColor Yellow
        Write-Host "cd backend" -ForegroundColor Green
        Write-Host "`$env:DATABASE_URL=`"$databaseUrl`"" -ForegroundColor Green
        Write-Host "npx prisma db push" -ForegroundColor Green
        Write-Host "npx prisma generate" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "📝 下一步操作:" -ForegroundColor Cyan
Write-Host "1. 在ECS上配置环境变量:" -ForegroundColor White
Write-Host "   DATABASE_URL=`"$databaseUrl`"" -ForegroundColor Green
Write-Host "2. 重新启动应用服务" -ForegroundColor White
Write-Host "3. 测试数据库连接" -ForegroundColor White

Write-Host ""
Write-Host "🎯 完成！数据库已准备就绪。" -ForegroundColor Green