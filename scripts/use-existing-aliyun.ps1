# 使用现有阿里云ECS资源部署脚本

# 阿里云配置
$ACCESS_KEY_ID = $env:ALIYUN_ACCESS_KEY_ID # 请设置环境变量
$ACCESS_KEY_SECRET = $env:ALIYUN_ACCESS_KEY_SECRET # 请设置环境变量
$REGION = "cn-hangzhou"

Write-Host "🔍 检查现有阿里云ECS资源" -ForegroundColor Cyan
Write-Host "=" * 50

# 检查阿里云CLI
Write-Host "📦 检查阿里云CLI..." -ForegroundColor Yellow
if (-not (Get-Command "aliyun" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 阿里云CLI未安装，请先安装" -ForegroundColor Red
    Write-Host "下载地址: https://help.aliyun.com/document_detail/121541.html" -ForegroundColor Yellow
    exit 1
}

# 配置阿里云认证
Write-Host "🔑 配置阿里云认证..." -ForegroundColor Yellow
try {
    & aliyun configure set --profile default --mode AK --region $REGION --access-key-id $ACCESS_KEY_ID --access-key-secret $ACCESS_KEY_SECRET 2>$null
    Write-Host "✅ 阿里云认证配置成功" -ForegroundColor Green
} catch {
    Write-Host "❌ 阿里云认证配置失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 获取现有ECS实例
Write-Host "🖥️ 查找现有ECS实例..." -ForegroundColor Yellow
try {
    $instancesResult = & aliyun ecs DescribeInstances --RegionId $REGION --PageSize 50 2>$null
    $instances = ($instancesResult | ConvertFrom-Json).Instances.Instance
    
    if ($instances.Count -eq 0) {
        Write-Host "❌ 未找到ECS实例" -ForegroundColor Red
        Write-Host "请确认您在 $REGION 地域有ECS实例" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✅ 找到 $($instances.Count) 个ECS实例:" -ForegroundColor Green
    Write-Host ""
    
    # 显示实例列表
    for ($i = 0; $i -lt $instances.Count; $i++) {
        $instance = $instances[$i]
        $status = $instance.Status
        $statusColor = switch ($status) {
            "Running" { "Green" }
            "Stopped" { "Yellow" }
            default { "Red" }
        }
        
        Write-Host "[$($i + 1)] 实例信息:" -ForegroundColor Cyan
        Write-Host "    ID: $($instance.InstanceId)" -ForegroundColor White
        Write-Host "    名称: $($instance.InstanceName)" -ForegroundColor White
        Write-Host "    状态: $status" -ForegroundColor $statusColor
        Write-Host "    规格: $($instance.InstanceType)" -ForegroundColor White
        
        # 获取公网IP
        if ($instance.PublicIpAddress.IpAddress.Count -gt 0) {
            $publicIP = $instance.PublicIpAddress.IpAddress[0]
            Write-Host "    公网IP: $publicIP" -ForegroundColor Green
        } elseif ($instance.EipAddress.IpAddress) {
            Write-Host "    弹性IP: $($instance.EipAddress.IpAddress)" -ForegroundColor Green
        } else {
            Write-Host "    公网IP: 未分配" -ForegroundColor Red
        }
        
        Write-Host "    创建时间: $($instance.CreationTime)" -ForegroundColor Gray
        Write-Host ""
    }
    
} catch {
    Write-Host "❌ 获取ECS实例失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 让用户选择实例
Write-Host "请选择要使用的ECS实例 (输入数字1-$($instances.Count)):" -ForegroundColor Yellow -NoNewline
$selection = Read-Host " "

try {
    $selectedIndex = [int]$selection - 1
    if ($selectedIndex -lt 0 -or $selectedIndex -ge $instances.Count) {
        throw "无效选择"
    }
    
    $selectedInstance = $instances[$selectedIndex]
    Write-Host "✅ 已选择实例: $($selectedInstance.InstanceName)" -ForegroundColor Green
    
} catch {
    Write-Host "❌ 无效的选择，请重新运行脚本" -ForegroundColor Red
    exit 1
}

# 获取实例详细信息
$instanceId = $selectedInstance.InstanceId
$instanceStatus = $selectedInstance.Status

# 检查实例状态
if ($instanceStatus -ne "Running") {
    Write-Host "⚠️ 实例状态为: $instanceStatus" -ForegroundColor Yellow
    Write-Host "是否要启动实例? (y/n):" -ForegroundColor Yellow -NoNewline
    $startChoice = Read-Host " "
    
    if ($startChoice -eq "y" -or $startChoice -eq "Y") {
        Write-Host "🚀 启动ECS实例..." -ForegroundColor Yellow
        try {
            & aliyun ecs StartInstance --InstanceId $instanceId 2>$null
            Write-Host "✅ 实例启动请求已发送，等待启动..." -ForegroundColor Green
            Start-Sleep 30  # 等待30秒
        } catch {
            Write-Host "❌ 启动实例失败: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# 获取最新的实例信息
Write-Host "📋 获取实例最新信息..." -ForegroundColor Yellow
try {
    $instanceDetailResult = & aliyun ecs DescribeInstances --InstanceIds "[$instanceId]" 2>$null
    $instanceDetail = ($instanceDetailResult | ConvertFrom-Json).Instances.Instance[0]
    
    # 获取公网IP
    $publicIP = $null
    if ($instanceDetail.PublicIpAddress.IpAddress.Count -gt 0) {
        $publicIP = $instanceDetail.PublicIpAddress.IpAddress[0]
    } elseif ($instanceDetail.EipAddress.IpAddress) {
        $publicIP = $instanceDetail.EipAddress.IpAddress
    }
    
    if (-not $publicIP) {
        Write-Host "⚠️ 实例没有公网IP，是否要分配? (y/n):" -ForegroundColor Yellow -NoNewline
        $allocateChoice = Read-Host " "
        
        if ($allocateChoice -eq "y" -or $allocateChoice -eq "Y") {
            Write-Host "🌐 分配公网IP..." -ForegroundColor Yellow
            try {
                $ipResult = & aliyun ecs AllocatePublicIpAddress --InstanceId $instanceId 2>$null
                $publicIP = ($ipResult | ConvertFrom-Json).IpAddress
                Write-Host "✅ 公网IP分配成功: $publicIP" -ForegroundColor Green
            } catch {
                Write-Host "❌ 公网IP分配失败: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
    
} catch {
    Write-Host "❌ 获取实例详细信息失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 检查安全组端口
Write-Host "🛡️ 检查安全组配置..." -ForegroundColor Yellow
$securityGroupId = $instanceDetail.SecurityGroupIds.SecurityGroupId[0]

try {
    $sgRulesResult = & aliyun ecs DescribeSecurityGroupAttribute --SecurityGroupId $securityGroupId --RegionId $REGION 2>$null
    $sgRules = ($sgRulesResult | ConvertFrom-Json).Permissions.Permission
    
    $requiredPorts = @("22", "80", "443", "3000", "5000")
    $missingPorts = @()
    
    foreach ($port in $requiredPorts) {
        $hasRule = $sgRules | Where-Object { 
            $_.IpProtocol -eq "tcp" -and 
            ($_.PortRange -eq "$port/$port" -or $_.PortRange -eq "1/65535") -and
            $_.SourceCidrIp -eq "0.0.0.0/0"
        }
        
        if (-not $hasRule) {
            $missingPorts += $port
        }
    }
    
    if ($missingPorts.Count -gt 0) {
        Write-Host "⚠️ 需要开放以下端口: $($missingPorts -join ', ')" -ForegroundColor Yellow
        Write-Host "是否要自动配置安全组? (y/n):" -ForegroundColor Yellow -NoNewline
        $configChoice = Read-Host " "
        
        if ($configChoice -eq "y" -or $configChoice -eq "Y") {
            foreach ($port in $missingPorts) {
                try {
                    $description = switch ($port) {
                        "22" { "SSH访问" }
                        "80" { "HTTP访问" }
                        "443" { "HTTPS访问" }
                        "3000" { "前端应用" }
                        "5000" { "后端API" }
                    }
                    
                    & aliyun ecs AuthorizeSecurityGroup --RegionId $REGION --SecurityGroupId $securityGroupId --IpProtocol tcp --PortRange "$port/$port" --SourceCidrIp "0.0.0.0/0" --Description $description 2>$null
                    Write-Host "  ✅ 开放端口 $port ($description)" -ForegroundColor Green
                } catch {
                    Write-Host "  ⚠️ 端口 $port 配置失败: $($_.Exception.Message)" -ForegroundColor Yellow
                }
            }
        }
    } else {
        Write-Host "✅ 安全组端口配置正确" -ForegroundColor Green
    }
    
} catch {
    Write-Host "⚠️ 检查安全组失败: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 保存实例信息
if ($publicIP) {
    $deploymentInfo = @{
        InstanceId = $instanceId
        PublicIP = $publicIP
        SecurityGroupId = $securityGroupId
        Region = $REGION
        InstanceName = $instanceDetail.InstanceName
        InstanceType = $instanceDetail.InstanceType
        Status = $instanceDetail.Status
        UseExisting = $true
        UpdateTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    }
    
    $deploymentInfo | ConvertTo-Json | Out-File "d:\project\trade\.aliyun-deployment.json" -Encoding UTF8
    
    Write-Host ""
    Write-Host "🎉 现有ECS资源配置完成！" -ForegroundColor Green
    Write-Host "=" * 50
    Write-Host "📋 实例信息:" -ForegroundColor Cyan
    Write-Host "  实例ID: $instanceId" -ForegroundColor White
    Write-Host "  实例名称: $($instanceDetail.InstanceName)" -ForegroundColor White
    Write-Host "  公网IP: $publicIP" -ForegroundColor White
    Write-Host "  状态: $($instanceDetail.Status)" -ForegroundColor White
    Write-Host "  SSH连接: ssh root@$publicIP" -ForegroundColor White
    Write-Host ""
    
    # 自动更新DNS记录
    Write-Host "🌐 更新DNS记录指向现有服务器..." -ForegroundColor Yellow
    try {
        & powershell -ExecutionPolicy Bypass -File "d:\project\trade\scripts\setup-dns-simple.ps1" -Token "7oau74rVYmV5VWw073z1FmhpZ2ZVPy3js3JFh0ke" -ServerIP $publicIP
        Write-Host "✅ DNS记录更新完成" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ DNS记录更新失败，请手动更新" -ForegroundColor Yellow
        Write-Host "服务器IP: $publicIP" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "🔄 下一步操作:" -ForegroundColor Cyan
    Write-Host "1. SSH连接到服务器: ssh root@$publicIP" -ForegroundColor White
    Write-Host "2. 部署应用到服务器" -ForegroundColor White
    Write-Host "3. 配置域名和SSL证书" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 实例信息已保存到: .aliyun-deployment.json" -ForegroundColor Yellow
    
} else {
    Write-Host "❌ 无法获取实例公网IP，请检查实例配置" -ForegroundColor Red
}