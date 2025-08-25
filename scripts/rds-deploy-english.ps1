# Alibaba Cloud RDS Database Deployment Script (English Version)
# Fixed password version for trade platform

# Configuration
$Region = "cn-hangzhou"
$InstanceName = "trade-platform-db"
$DatabaseName = "trade_platform"
$Username = "trade_admin"
$Password = "Db_11010811."

Write-Host "=== Alibaba Cloud RDS Database Deployment ===" -ForegroundColor Cyan

Write-Host ""
Write-Host "Deployment Configuration:" -ForegroundColor Green
Write-Host "Region: $Region"
Write-Host "Instance Name: $InstanceName"
Write-Host "Database Name: $DatabaseName"
Write-Host "Username: $Username"
Write-Host "Password: $Password"

Write-Host ""
Write-Host "Please follow these steps to create RDS instance in Alibaba Cloud Console:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Login to Alibaba Cloud Console: https://rds.console.aliyun.com" -ForegroundColor White
Write-Host ""
Write-Host "2. Create MySQL instance with the following configuration:" -ForegroundColor White
Write-Host "   - Region: $Region" -ForegroundColor Gray
Write-Host "   - Database Type: MySQL" -ForegroundColor Gray
Write-Host "   - Version: 8.0" -ForegroundColor Gray
Write-Host "   - Specification: 2 cores 4GB (db.mysql.s3.large)" -ForegroundColor Gray
Write-Host "   - Storage: 100GB" -ForegroundColor Gray
Write-Host "   - Network: VPC" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Create database account:" -ForegroundColor White
Write-Host "   - Account Name: $Username" -ForegroundColor Gray
Write-Host "   - Password: $Password" -ForegroundColor Gray
Write-Host "   - Privilege: Read/Write" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Create database:" -ForegroundColor White
Write-Host "   - Database Name: $DatabaseName" -ForegroundColor Gray
Write-Host "   - Character Set: utf8mb4" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Set whitelist:" -ForegroundColor White
Write-Host "   - Add ECS IP: 116.62.44.24" -ForegroundColor Gray
Write-Host "   - Or add: 0.0.0.0/0 (for testing)" -ForegroundColor Gray
Write-Host ""

# Wait for user input
Write-Host "After completing the above steps, please enter the RDS connection endpoint:" -ForegroundColor Yellow
$endpoint = Read-Host "Connection Endpoint"
$port = Read-Host "Port (default 3306)"
if ([string]::IsNullOrEmpty($port)) { $port = "3306" }

# Generate database connection string
$databaseUrl = "mysql://${Username}:${Password}@${endpoint}:${port}/${DatabaseName}?schema=public&sslmode=require"

Write-Host ""
Write-Host "=== Database Configuration Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Database Connection Information:" -ForegroundColor Cyan
Write-Host "Connection Endpoint: $endpoint"
Write-Host "Port: $port"
Write-Host "Database Name: $DatabaseName"
Write-Host "Username: $Username"
Write-Host "Password: $Password"
Write-Host ""
Write-Host "Complete Connection String:" -ForegroundColor Yellow
Write-Host $databaseUrl
Write-Host ""

# Save configuration
$configContent = @"
# Alibaba Cloud RDS Configuration
DATABASE_URL="$databaseUrl"
RDS_ENDPOINT="$endpoint"
RDS_PORT="$port"
RDS_DATABASE="$DatabaseName"
RDS_USERNAME="$Username"
RDS_PASSWORD="$Password"
"@

$configPath = "rds-config.env"
$configContent | Out-File -FilePath $configPath -Encoding UTF8
Write-Host "Configuration saved to: $configPath" -ForegroundColor Green

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Update backend/.env file, add DATABASE_URL" -ForegroundColor White
Write-Host "2. Run database migration: cd backend && npx prisma db push" -ForegroundColor White
Write-Host "3. Insert initial data: npm run db:seed" -ForegroundColor White
Write-Host "4. Update environment variables on ECS and restart application" -ForegroundColor White