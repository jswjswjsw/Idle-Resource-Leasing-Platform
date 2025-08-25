# 远程连接ECS并启动Trade Platform应用
param(
    [string]$ServerIP = "116.62.44.24",
    [string]$Username = "Administrator",
    [string]$KeyFile = "", # SSH私钥文件路径
    [switch]$UseHTTP = $false # 是否使用HTTP模式（非HTTPS）
)

Write-Host "🚀 远程启动ECS上的Trade Platform应用" -ForegroundColor Cyan
Write-Host "=" * 50
Write-Host "服务器IP: $ServerIP" -ForegroundColor White
Write-Host "用户名: $Username" -ForegroundColor White

# 检查是否安装了SSH客户端
$sshPath = Get-Command ssh -ErrorAction SilentlyContinue
if (-not $sshPath) {
    Write-Host "❌ 未找到SSH客户端" -ForegroundColor Red
    Write-Host "请安装OpenSSH客户端或使用Windows子系统(WSL)" -ForegroundColor Yellow
    Write-Host "安装命令: Add-WindowsCapability -Online -Name OpenSSH.Client*" -ForegroundColor Green
    exit 1
}

# 构建SSH连接命令
$sshOptions = @(
    "-o", "StrictHostKeyChecking=no",
    "-o", "ConnectTimeout=30"
)

if ($KeyFile -and (Test-Path $KeyFile)) {
    $sshOptions += @("-i", $KeyFile)
    $sshCommand = "ssh"
} else {
    Write-Host "⚠️ 未指定SSH密钥，将使用密码认证" -ForegroundColor Yellow
    $sshCommand = "ssh"
}

# 应用启动脚本内容
$startupScript = @'
# ECS服务器启动脚本
echo "🔍 检查项目目录..."
if [ ! -d "/www/trade-platform" ]; then
    echo "❌ 项目目录不存在: /www/trade-platform"
    echo "请先部署项目到ECS服务器"
    exit 1
fi

cd /www/trade-platform

echo "📦 检查依赖安装..."
# 检查后端依赖
cd backend
if [ ! -d "node_modules" ]; then
    echo "📦 安装后端依赖..."
    npm install
fi

# 检查前端依赖  
cd ../frontend
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi

echo "🔧 配置环境变量..."
cd ../backend
# 创建.env文件
cat > .env << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL="postgresql://trade_user:trade_password@localhost:5432/trade_platform"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
REDIS_URL="redis://localhost:6379"
SSL_ENABLED=false
EOF

echo "🚀 启动后端服务..."
# 使用PM2管理进程
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装PM2..."
    npm install -g pm2
fi

# 停止旧的进程（如果存在）
pm2 stop trade-backend 2>/dev/null || true
pm2 delete trade-backend 2>/dev/null || true

# 启动后端
pm2 start npm --name "trade-backend" -- start

echo "🚀 启动前端服务..."
cd ../frontend

# 停止旧的进程（如果存在）
pm2 stop trade-frontend 2>/dev/null || true  
pm2 delete trade-frontend 2>/dev/null || true

# 启动前端
pm2 start npm --name "trade-frontend" -- start

echo "📋 检查应用状态..."
pm2 list

echo "🌐 应用启动完成！"
echo "前端: http://116.62.44.24:3000"
echo "后端: http://116.62.44.24:5000"

echo "🔍 测试连接..."
curl -I http://localhost:5000/api/health || echo "后端API测试失败"
curl -I http://localhost:3000 || echo "前端服务测试失败"
'@

# 写入临时脚本文件
$tempScript = [System.IO.Path]::GetTempFileName() + ".sh"
$startupScript | Out-File -FilePath $tempScript -Encoding UTF8

Write-Host "📝 创建启动脚本: $tempScript" -ForegroundColor Green

try {
    Write-Host "🔗 连接到ECS服务器..." -ForegroundColor Yellow
    Write-Host "命令: $sshCommand $sshOptions ${Username}@${ServerIP}" -ForegroundColor Gray
    
    # 上传脚本到服务器
    Write-Host "📤 上传启动脚本..." -ForegroundColor Yellow
    $scpCommand = "scp"
    if ($KeyFile) {
        & $scpCommand -i $KeyFile -o "StrictHostKeyChecking=no" $tempScript "${Username}@${ServerIP}:/tmp/startup.sh"
    } else {
        & $scpCommand -o "StrictHostKeyChecking=no" $tempScript "${Username}@${ServerIP}:/tmp/startup.sh"
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 脚本上传成功" -ForegroundColor Green
        
        # 执行启动脚本
        Write-Host "🚀 执行启动脚本..." -ForegroundColor Yellow
        if ($KeyFile) {
            & $sshCommand $sshOptions -i $KeyFile "${Username}@${ServerIP}" "chmod +x /tmp/startup.sh && bash /tmp/startup.sh"
        } else {
            & $sshCommand $sshOptions "${Username}@${ServerIP}" "chmod +x /tmp/startup.sh && bash /tmp/startup.sh"
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ 应用启动完成！" -ForegroundColor Green
            Write-Host ""
            Write-Host "🌐 访问地址：" -ForegroundColor Cyan
            Write-Host "前端应用: http://${ServerIP}:3000" -ForegroundColor White
            Write-Host "后端API: http://${ServerIP}:5000" -ForegroundColor White
            Write-Host ""
            Write-Host "🔍 测试命令：" -ForegroundColor Yellow
            Write-Host "Test-NetConnection -ComputerName $ServerIP -Port 3000" -ForegroundColor Green
            Write-Host "Test-NetConnection -ComputerName $ServerIP -Port 5000" -ForegroundColor Green
        } else {
            Write-Host "❌ 应用启动失败" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ 脚本上传失败" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ 连接ECS失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 可能的解决方案：" -ForegroundColor Yellow
    Write-Host "1. 确认ECS安全组已开放SSH端口(22)" -ForegroundColor White
    Write-Host "2. 确认SSH密钥或密码正确" -ForegroundColor White
    Write-Host "3. 确认ECS实例正在运行" -ForegroundColor White
    Write-Host "4. 尝试直接在阿里云控制台连接ECS" -ForegroundColor White
} finally {
    # 清理临时文件
    if (Test-Path $tempScript) {
        Remove-Item $tempScript -Force
    }
}

Write-Host ""
Write-Host "🔄 下一步操作：" -ForegroundColor Cyan  
Write-Host "1. 测试应用端口是否可访问" -ForegroundColor White
Write-Host "2. 配置域名DNS解析" -ForegroundColor White
Write-Host "3. 申请和安装SSL证书" -ForegroundColor White
Write-Host "4. 测试HTTPS访问" -ForegroundColor White