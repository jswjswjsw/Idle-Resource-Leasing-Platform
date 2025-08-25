# GitHub上传脚本 - 最简版本

Write-Host "GitHub Upload Script" -ForegroundColor Cyan
Write-Host "====================" 

# 进入项目目录
Set-Location "d:\project\trade"
Write-Host "Project directory: d:\project\trade" -ForegroundColor Green

# 添加所有文件
Write-Host ""
Write-Host "Adding files to Git..." -ForegroundColor Yellow
git add .

if ($LASTEXITCODE -eq 0) {
    Write-Host "Files added successfully" -ForegroundColor Green
} else {
    Write-Host "Error adding files" -ForegroundColor Red
    exit 1
}

# 检查待提交文件
$stagedFiles = git diff --cached --name-only
if ($stagedFiles) {
    Write-Host ""
    Write-Host "Files to commit: $($stagedFiles.Count)" -ForegroundColor Cyan
} else {
    Write-Host "No files to commit" -ForegroundColor Yellow
    exit 0
}

# 提交
Write-Host ""
Write-Host "Creating commit..." -ForegroundColor Yellow

$commitMsg = "feat: Windows ECS deployment automation scripts

- Add SSL certificate configuration scripts
- Create Cloudflare DNS setup guides  
- Implement deployment verification tools
- Environment variables automation
- HTTP/HTTPS dual mode support
- Firewall and security configurations

Files: 11 scripts + 3 documentation files
Completion: 12/12 tasks (100%)"

git commit -m "$commitMsg"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Commit created successfully" -ForegroundColor Green
} else {
    Write-Host "Commit failed" -ForegroundColor Red
    exit 1
}

# 推送
Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow

# 尝试推送到main分支
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "Pushed to GitHub successfully (main branch)" -ForegroundColor Green
} else {
    Write-Host "Failed to push to main, trying master..." -ForegroundColor Yellow
    git push origin master
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Pushed to GitHub successfully (master branch)" -ForegroundColor Green
    } else {
        Write-Host "Push failed. Please check your remote repository configuration." -ForegroundColor Red
        Write-Host "Manual command: git push origin main" -ForegroundColor Gray
        exit 1
    }
}

Write-Host ""
Write-Host "Upload completed successfully!" -ForegroundColor Green
Write-Host "Repository: https://github.com/jswjswjsw/Idle-Resource-Leasing-Platform" -ForegroundColor Cyan