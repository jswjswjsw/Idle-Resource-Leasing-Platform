# Windows ECS服务器自动部署脚本
# 用于在Windows服务器上部署Trade Platform项目

param(
    [string]$ProjectPath = "C:\www\trade-platform",
    [switch]$SkipNodeInstall = $false,
    [switch]$SkipGitInstall = $false
)

Write-Host "开始Windows ECS服务器部署" -ForegroundColor Cyan
Write-Host "=" * 50

# 检查管理员权限
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "需要管理员权限运行此脚本" -ForegroundColor Red
    Write-Host "请右键选择'以管理员身份运行'" -ForegroundColor Yellow
    exit 1
}

Write-Host "管理员权限验证通过" -ForegroundColor Green

# 系统信息检查
Write-Host "检查系统信息..." -ForegroundColor Yellow
$osInfo = Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion
Write-Host "操作系统: $($osInfo.WindowsProductName)" -ForegroundColor White
Write-Host "版本: $($osInfo.WindowsVersion)" -ForegroundColor White

# 检查Node.js
Write-Host "检查Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    $npmVersion = npm --version 2>$null
    if ($nodeVersion -and $npmVersion) {
        Write-Host "Node.js已安装: $nodeVersion, npm: $npmVersion" -ForegroundColor Green
        $SkipNodeInstall = $true
    }
} catch {
    Write-Host "Node.js未安装" -ForegroundColor Yellow
}

# 安装Node.js
if (-not $SkipNodeInstall) {
    Write-Host "下载并安装Node.js 18..." -ForegroundColor Yellow
    $nodeUrl = "https://nodejs.org/dist/v18.19.0/node-v18.19.0-x64.msi"
    $downloadPath = "$env:TEMP\nodejs.msi"
    
    try {
        Invoke-WebRequest -Uri $nodeUrl -OutFile $downloadPath -UseBasicParsing
        Write-Host "Node.js下载完成" -ForegroundColor Green
        
        Write-Host "安装Node.js..." -ForegroundColor Yellow
        Start-Process -FilePath "msiexec.exe" -ArgumentList "/i", $downloadPath, "/quiet", "/norestart" -Wait
        
        # 重新加载环境变量
        $machinePath = [System.Environment]::GetEnvironmentVariable("Path","Machine")
        $userPath = [System.Environment]::GetEnvironmentVariable("Path","User")
        $env:Path = $machinePath + ";" + $userPath
        
        # 验证安装
        Start-Sleep 3
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-Host "Node.js安装成功: $nodeVersion" -ForegroundColor Green
        } else {
            throw "Node.js安装验证失败"
        }
    } catch {
        Write-Host "Node.js安装失败: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# 检查Git
Write-Host "检查Git..." -ForegroundColor Yellow
try {
    $gitVersion = git --version 2>$null
    if ($gitVersion) {
        Write-Host "Git已安装: $gitVersion" -ForegroundColor Green
        $SkipGitInstall = $true
    }
} catch {
    Write-Host "Git未安装" -ForegroundColor Yellow
}

# 安装Git
if (-not $SkipGitInstall) {
    Write-Host "下载并安装Git..." -ForegroundColor Yellow
    $gitUrl = "https://github.com/git-for-windows/git/releases/download/v2.42.0.windows.2/Git-2.42.0.2-64-bit.exe"
    $gitPath = "$env:TEMP\git-installer.exe"
    
    try {
        Invoke-WebRequest -Uri $gitUrl -OutFile $gitPath -UseBasicParsing
        Write-Host "Git下载完成" -ForegroundColor Green
        
        Write-Host "安装Git..." -ForegroundColor Yellow
        Start-Process -FilePath $gitPath -ArgumentList "/SILENT" -Wait
        
        # 重新加载环境变量
        $machinePath = [System.Environment]::GetEnvironmentVariable("Path","Machine")
        $userPath = [System.Environment]::GetEnvironmentVariable("Path","User")
        $env:Path = $machinePath + ";" + $userPath
        
        # 验证安装
        Start-Sleep 3
        $gitVersion = git --version 2>$null
        if ($gitVersion) {
            Write-Host "Git安装成功: $gitVersion" -ForegroundColor Green
        } else {
            throw "Git安装验证失败"
        }
    } catch {
        Write-Host "Git安装失败: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# 配置npm镜像源
Write-Host "配置npm镜像源..." -ForegroundColor Yellow
try {
    npm config set registry https://registry.npmmirror.com
    $registry = npm config get registry
    Write-Host "npm镜像源配置成功: $registry" -ForegroundColor Green
} catch {
    Write-Host "npm镜像源配置失败，将使用默认源" -ForegroundColor Yellow
}

# 创建项目目录
Write-Host "创建项目目录..." -ForegroundColor Yellow
$projectDir = Split-Path $ProjectPath -Parent
if (-not (Test-Path $projectDir)) {
    New-Item -ItemType Directory -Path $projectDir -Force | Out-Null
    Write-Host "创建目录: $projectDir" -ForegroundColor Green
}

# 克隆项目
Write-Host "克隆项目代码..." -ForegroundColor Yellow
try {
    Set-Location $projectDir
    
    # 如果项目目录已存在，先备份
    if (Test-Path $ProjectPath) {
        $backupPath = "$ProjectPath.backup.$(Get-Date -Format 'yyyyMMddHHmmss')"
        Move-Item $ProjectPath $backupPath
        Write-Host "备份现有项目到: $backupPath" -ForegroundColor Yellow
    }
    
    git clone https://github.com/jswjswjsw/Idle-Resource-Leasing-Platform.git $ProjectPath
    Write-Host "项目克隆成功" -ForegroundColor Green
} catch {
    Write-Host "项目克隆失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 安装依赖
Write-Host "安装项目依赖..." -ForegroundColor Yellow

# 安装后端依赖
Write-Host "安装后端依赖..." -ForegroundColor Cyan
try {
    Set-Location "$ProjectPath\backend"
    npm install
    Write-Host "后端依赖安装成功" -ForegroundColor Green
} catch {
    Write-Host "后端依赖安装失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 安装前端依赖
Write-Host "安装前端依赖..." -ForegroundColor Cyan
try {
    Set-Location "$ProjectPath\frontend"
    npm install
    Write-Host "前端依赖安装成功" -ForegroundColor Green
} catch {
    Write-Host "前端依赖安装失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 返回项目根目录
Set-Location $ProjectPath

Write-Host ""
Write-Host "Windows ECS部署完成！" -ForegroundColor Green
Write-Host "=" * 50
Write-Host "部署信息:" -ForegroundColor Cyan
Write-Host "  项目路径: $ProjectPath" -ForegroundColor White
Write-Host "  Node.js版本: $(node --version)" -ForegroundColor White
Write-Host "  npm版本: $(npm --version)" -ForegroundColor White
Write-Host "  Git版本: $(git --version)" -ForegroundColor White
Write-Host ""
Write-Host "下一步操作:" -ForegroundColor Cyan
Write-Host "1. 配置环境变量文件 (.env)" -ForegroundColor White
Write-Host "2. 构建前端应用" -ForegroundColor White
Write-Host "3. 编译后端代码" -ForegroundColor White
Write-Host "4. 启动应用服务" -ForegroundColor White
Write-Host ""
Write-Host "项目目录结构:" -ForegroundColor Yellow
Get-ChildItem $ProjectPath | Select-Object Name, Mode | Format-Table -AutoSize