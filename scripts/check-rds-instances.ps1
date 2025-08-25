# Check RDS Instances - Helper Script
Write-Host "=== RDS Instance Information Check ===" -ForegroundColor Cyan

Write-Host ""
Write-Host "Please follow these steps to get your RDS endpoint:" -ForegroundColor Yellow
Write-Host ""

Write-Host "Step 1: Login to Alibaba Cloud Console" -ForegroundColor Green
Write-Host "Visit: https://rds.console.aliyun.com" -ForegroundColor White
Write-Host ""

Write-Host "Step 2: Find Your RDS Instance" -ForegroundColor Green
Write-Host "Look for instance with:" -ForegroundColor White
Write-Host "  - Instance Name: trade-platform-db" -ForegroundColor Gray
Write-Host "  - Engine Type: MySQL" -ForegroundColor Gray
Write-Host "  - Version: 8.0" -ForegroundColor Gray
Write-Host "  - Region: 华东1(杭州)" -ForegroundColor Gray
Write-Host ""

Write-Host "Step 3: Get Connection Information" -ForegroundColor Green
Write-Host "Click on your instance name, then:" -ForegroundColor White
Write-Host "  1. Click '数据库连接' in left menu" -ForegroundColor Gray
Write-Host "  2. Copy the '内网地址' (Internal Endpoint)" -ForegroundColor Gray
Write-Host "  3. Should look like: rm-xxxxxx.mysql.rds.aliyuncs.com" -ForegroundColor Gray
Write-Host ""

Write-Host "Step 4: Verify Instance Details" -ForegroundColor Green
Write-Host "Make sure your instance has:" -ForegroundColor White
Write-Host "  ✓ Status: Running" -ForegroundColor Gray
Write-Host "  ✓ Database: trade_platform" -ForegroundColor Gray
Write-Host "  ✓ Account: trade_admin" -ForegroundColor Gray
Write-Host "  ✓ Whitelist: includes 116.62.44.24 or 0.0.0.0/0" -ForegroundColor Gray
Write-Host ""

Write-Host "Common Issues:" -ForegroundColor Red
Write-Host "❌ Instance still creating - Wait for status to be 'Running'" -ForegroundColor Yellow
Write-Host "❌ No connection address - Instance may not be ready yet" -ForegroundColor Yellow
Write-Host "❌ Access denied - Check whitelist configuration" -ForegroundColor Yellow
Write-Host ""

Write-Host "If you can't find the instance or connection address:" -ForegroundColor Cyan
Write-Host "1. Check if instance creation completed successfully" -ForegroundColor White
Write-Host "2. Verify you're in the correct region (杭州)" -ForegroundColor White
Write-Host "3. Make sure you have proper permissions" -ForegroundColor White
Write-Host ""

# Ask user for their RDS endpoint
Write-Host "Once you have the RDS endpoint, please enter it below:" -ForegroundColor Green
$endpoint = Read-Host "RDS Endpoint (e.g., rm-xxxxx.mysql.rds.aliyuncs.com)"

if ([string]::IsNullOrEmpty($endpoint)) {
    Write-Host ""
    Write-Host "⚠️ No endpoint provided. Please get the endpoint from RDS console first." -ForegroundColor Yellow
    Write-Host "Re-run this script after you have the endpoint." -ForegroundColor Yellow
    return
}

# Validate endpoint format
if ($endpoint -match "^rm-[a-zA-Z0-9]+\.mysql\.rds\.aliyuncs\.com$") {
    Write-Host ""
    Write-Host "✅ Endpoint format looks correct!" -ForegroundColor Green
    
    # Test network connectivity
    Write-Host ""
    Write-Host "Testing network connectivity..." -ForegroundColor Yellow
    try {
        $result = Test-NetConnection -ComputerName $endpoint -Port 3306 -WarningAction SilentlyContinue
        if ($result.TcpTestSucceeded) {
            Write-Host "✅ Network connection successful" -ForegroundColor Green
        } else {
            Write-Host "❌ Network connection failed" -ForegroundColor Red
            Write-Host "   Check whitelist configuration in RDS console" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Network test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Generate configuration
    $databaseUrl = "mysql://trade_admin:Db_11010811.@${endpoint}:3306/trade_platform?schema=public&sslmode=require"
    
    Write-Host ""
    Write-Host "Generated DATABASE_URL:" -ForegroundColor Cyan
    Write-Host $databaseUrl -ForegroundColor Yellow
    
    # Update config file
    $configContent = @"
# Alibaba Cloud RDS Configuration
DATABASE_URL="$databaseUrl"
RDS_ENDPOINT="$endpoint"
RDS_PORT="3306"
RDS_DATABASE="trade_platform"
RDS_USERNAME="trade_admin"
RDS_PASSWORD="Db_11010811."
"@
    
    $configPath = "rds-config.env"
    $configContent | Out-File -FilePath $configPath -Encoding UTF8
    Write-Host ""
    Write-Host "✅ Configuration saved to: $configPath" -ForegroundColor Green
    
} else {
    Write-Host ""
    Write-Host "❌ Invalid endpoint format!" -ForegroundColor Red
    Write-Host "Expected format: rm-xxxxx.mysql.rds.aliyuncs.com" -ForegroundColor Yellow
    Write-Host "You entered: $endpoint" -ForegroundColor Gray
}