# 阿里云ECS自动部署脚本
param([string]$ECSPassword)

if (-not $ECSPassword) {
    Write-Host "请提供ECS登录密码（8-30位，包含大小写字母和数字）" -ForegroundColor Yellow
    Write-Host "使用方法: .\deploy-aliyun-auto.ps1 -ECSPassword 'YourPassword123!'" -ForegroundColor Cyan
    exit 1
}

# 阿里云配置
$ACCESS_KEY_ID = $env:ALIYUN_ACCESS_KEY_ID # 请设置环境变量
$ACCESS_KEY_SECRET = $env:ALIYUN_ACCESS_KEY_SECRET # 请设置环境变量
$REGION = "cn-hangzhou"
$ZONE_ID = "cn-hangzhou-b"

Write-Host "🚀 开始阿里云ECS自动部署" -ForegroundColor Cyan
Write-Host "=" * 50

# 验证密码格式
if ($ECSPassword.Length -lt 8 -or $ECSPassword.Length -gt 30) {
    Write-Host "❌ 密码长度必须在8-30位之间" -ForegroundColor Red
    exit 1
}

if (-not ($ECSPassword -cmatch "[A-Z]" -and $ECSPassword -cmatch "[a-z]" -and $ECSPassword -cmatch "[0-9]")) {
    Write-Host "❌ 密码必须包含大写字母、小写字母和数字" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 密码格式验证通过" -ForegroundColor Green

# 检查阿里云CLI
Write-Host "📦 检查阿里云CLI..." -ForegroundColor Yellow
if (-not (Get-Command "aliyun" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 阿里云CLI未安装" -ForegroundColor Red
    Write-Host "正在下载安装阿里云CLI..." -ForegroundColor Yellow
    
    # 下载Windows版本的阿里云CLI
    $downloadUrl = "https://aliyuncli.alicdn.com/aliyun-cli-windows-latest-amd64.zip"
    $downloadPath = "$env:TEMP\aliyun-cli.zip"
    $extractPath = "$env:TEMP\aliyun-cli"
    
    try {
        Invoke-WebRequest -Uri $downloadUrl -OutFile $downloadPath
        Expand-Archive -Path $downloadPath -DestinationPath $extractPath -Force
        
        # 将aliyun.exe复制到系统路径
        $targetPath = "C:\Program Files\Aliyun CLI"
        if (-not (Test-Path $targetPath)) {
            New-Item -ItemType Directory -Path $targetPath -Force
        }
        Copy-Item "$extractPath\aliyun.exe" "$targetPath\aliyun.exe" -Force
        
        # 添加到PATH环境变量
        $env:PATH += ";$targetPath"
        
        Write-Host "✅ 阿里云CLI安装完成" -ForegroundColor Green
    } catch {
        Write-Host "❌ 阿里云CLI安装失败: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "请手动下载安装: https://help.aliyun.com/document_detail/121541.html" -ForegroundColor Yellow
        exit 1
    }
}

# 配置阿里云认证
Write-Host "🔑 配置阿里云认证..." -ForegroundColor Yellow
try {
    & aliyun configure set --profile default --mode AK --region $REGION --access-key-id $ACCESS_KEY_ID --access-key-secret $ACCESS_KEY_SECRET
    Write-Host "✅ 阿里云认证配置成功" -ForegroundColor Green
} catch {
    Write-Host "❌ 阿里云认证配置失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 创建安全组
Write-Host "🛡️ 创建安全组..." -ForegroundColor Yellow
$securityGroupName = "trade-platform-sg-$(Get-Date -Format 'yyyyMMddHHmmss')"

try {
    $sgResult = & aliyun ecs CreateSecurityGroup --RegionId $REGION --GroupName $securityGroupName --Description "交易平台安全组" 2>$null
    $securityGroupId = ($sgResult | ConvertFrom-Json).SecurityGroupId
    Write-Host "✅ 安全组创建成功: $securityGroupId" -ForegroundColor Green
} catch {
    Write-Host "❌ 安全组创建失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 添加安全组规则
Write-Host "📋 配置安全组规则..." -ForegroundColor Yellow
$ports = @(
    @{Port="22"; Description="SSH访问"},
    @{Port="80"; Description="HTTP访问"},  
    @{Port="443"; Description="HTTPS访问"},
    @{Port="3000"; Description="前端应用"},
    @{Port="5000"; Description="后端API"}
)

foreach ($portConfig in $ports) {
    try {
        & aliyun ecs AuthorizeSecurityGroup --RegionId $REGION --SecurityGroupId $securityGroupId --IpProtocol tcp --PortRange "$($portConfig.Port)/$($portConfig.Port)" --SourceCidrIp "0.0.0.0/0" --Description $portConfig.Description 2>$null
        Write-Host "  ✅ 开放端口 $($portConfig.Port) ($($portConfig.Description))" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️ 端口 $($portConfig.Port) 配置警告: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# 创建ECS实例
Write-Host "🖥️ 创建ECS实例..." -ForegroundColor Yellow
$instanceName = "trade-platform-$(Get-Date -Format 'yyyyMMdd')"

try {
    $instanceResult = & aliyun ecs CreateInstance --RegionId $REGION --ZoneId $ZONE_ID --ImageId "centos_7_9_x64_20G_alibase_20210628.vhd" --InstanceType "ecs.t5-lc1m1.small" --SecurityGroupId $securityGroupId --InstanceName $instanceName --Description "交易平台服务器" --InternetMaxBandwidthOut 1 --Password $ECSPassword 2>$null
    
    $instanceId = ($instanceResult | ConvertFrom-Json).InstanceId
    Write-Host "✅ ECS实例创建成功: $instanceId" -ForegroundColor Green
} catch {
    Write-Host "❌ ECS实例创建失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 启动实例
Write-Host "🚀 启动ECS实例..." -ForegroundColor Yellow
try {
    & aliyun ecs StartInstance --InstanceId $instanceId 2>$null
    Write-Host "✅ ECS实例启动成功" -ForegroundColor Green
} catch {
    Write-Host "❌ ECS实例启动失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 分配公网IP
Write-Host "🌐 分配公网IP..." -ForegroundColor Yellow
try {
    $ipResult = & aliyun ecs AllocatePublicIpAddress --InstanceId $instanceId 2>$null
    $publicIP = ($ipResult | ConvertFrom-Json).IpAddress
    Write-Host "✅ 公网IP分配成功: $publicIP" -ForegroundColor Green
} catch {
    Write-Host "❌ 公网IP分配失败: $($_.Exception.Message)" -ForegroundColor Red
    
    # 尝试获取已有IP
    Start-Sleep 10
    try {
        $instanceInfo = & aliyun ecs DescribeInstances --InstanceIds "[$instanceId]" 2>$null | ConvertFrom-Json
        $publicIP = $instanceInfo.Instances.Instance[0].PublicIpAddress.IpAddress[0]
        if ($publicIP) {
            Write-Host "✅ 获取到公网IP: $publicIP" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ 无法获取公网IP" -ForegroundColor Red
        exit 1
    }
}

# 保存部署信息
$deploymentInfo = @{
    InstanceId = $instanceId
    PublicIP = $publicIP
    SecurityGroupId = $securityGroupId
    Region = $REGION
    InstanceName = $instanceName
    DeployTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
}

$deploymentInfo | ConvertTo-Json | Out-File "d:\project\trade\.aliyun-deployment.json" -Encoding UTF8

Write-Host ""
Write-Host "🎉 阿里云ECS部署完成！" -ForegroundColor Green
Write-Host "=" * 50
Write-Host "📋 部署信息:" -ForegroundColor Cyan
Write-Host "  实例ID: $instanceId" -ForegroundColor White
Write-Host "  公网IP: $publicIP" -ForegroundColor White
Write-Host "  SSH连接: ssh root@$publicIP" -ForegroundColor White
Write-Host "  安全组: $securityGroupId" -ForegroundColor White
Write-Host ""
Write-Host "🔄 下一步操作:" -ForegroundColor Cyan
Write-Host "1. 更新DNS记录指向新IP: $publicIP" -ForegroundColor White
Write-Host "2. 等待实例完全启动 (约2-3分钟)" -ForegroundColor White
Write-Host "3. 部署应用到服务器" -ForegroundColor White
Write-Host ""
Write-Host "📝 部署信息已保存到: .aliyun-deployment.json" -ForegroundColor Yellow

# 自动更新DNS记录
Write-Host "🌐 更新DNS记录..." -ForegroundColor Yellow
try {
    powershell -ExecutionPolicy Bypass -File "d:\project\trade\scripts\setup-dns-simple.ps1" -Token "7oau74rVYmV5VWw073z1FmhpZ2ZVPy3js3JFh0ke" -ServerIP $publicIP
    Write-Host "✅ DNS记录更新完成" -ForegroundColor Green
} catch {
    Write-Host "⚠️ DNS记录更新失败，请手动更新" -ForegroundColor Yellow
    Write-Host "新服务器IP: $publicIP" -ForegroundColor White
}