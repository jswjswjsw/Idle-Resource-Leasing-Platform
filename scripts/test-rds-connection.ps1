# Test RDS Database Connection
param(
    [string]$Endpoint = "",
    [string]$Port = "3306",
    [string]$Database = "trade_platform",
    [string]$Username = "trade_admin",
    [string]$Password = "Db_11010811."
)

Write-Host "=== RDS Database Connection Test ===" -ForegroundColor Cyan

if ([string]::IsNullOrEmpty($Endpoint)) {
    $Endpoint = Read-Host "Please enter RDS endpoint (e.g., rm-xxxxx.mysql.rds.aliyuncs.com)"
}

Write-Host ""
Write-Host "Testing connection with:" -ForegroundColor Yellow
Write-Host "Endpoint: $Endpoint"
Write-Host "Port: $Port"
Write-Host "Database: $Database"
Write-Host "Username: $Username"
Write-Host "Password: $Password"

# Test 1: Test network connectivity
Write-Host ""
Write-Host "Test 1: Testing network connectivity..." -ForegroundColor Green
try {
    $result = Test-NetConnection -ComputerName $Endpoint -Port $Port
    if ($result.TcpTestSucceeded) {
        Write-Host "✅ Network connection successful" -ForegroundColor Green
    } else {
        Write-Host "❌ Network connection failed" -ForegroundColor Red
        Write-Host "Check if whitelist includes your IP address" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Network test error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Test database connection using mysql client (if available)
Write-Host ""
Write-Host "Test 2: Testing MySQL connection..." -ForegroundColor Green

# Check if mysql client is available
if (Get-Command mysql -ErrorAction SilentlyContinue) {
    $connectionString = "mysql -h $Endpoint -P $Port -u $Username -p$Password -D $Database -e 'SELECT 1;'"
    Write-Host "Executing: mysql -h $Endpoint -P $Port -u $Username -p****** -D $Database -e 'SELECT 1;'" -ForegroundColor Gray
    
    try {
        $result = Invoke-Expression "mysql -h $Endpoint -P $Port -u $Username -p$Password -D $Database -e 'SELECT 1;'" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ MySQL connection successful" -ForegroundColor Green
        } else {
            Write-Host "❌ MySQL connection failed" -ForegroundColor Red
            Write-Host "Error: $result" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ MySQL connection error: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️ MySQL client not found, skipping database connection test" -ForegroundColor Yellow
    Write-Host "You can install MySQL client or test from your application" -ForegroundColor Gray
}

# Generate connection string for application
Write-Host ""
Write-Host "Database connection string for your application:" -ForegroundColor Cyan
$databaseUrl = "mysql://${Username}:${Password}@${Endpoint}:${Port}/${Database}?schema=public&sslmode=require"
Write-Host $databaseUrl -ForegroundColor Yellow

Write-Host ""
Write-Host "Common Issues and Solutions:" -ForegroundColor Cyan
Write-Host "1. Network connection failed:" -ForegroundColor White
Write-Host "   - Check RDS whitelist settings" -ForegroundColor Gray
Write-Host "   - Ensure ECS IP (116.62.44.24) is in whitelist" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Access denied error:" -ForegroundColor White
Write-Host "   - Verify username and password" -ForegroundColor Gray
Write-Host "   - Check account permissions in RDS console" -ForegroundColor Gray
Write-Host "   - Ensure account has access to the database" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Database not found:" -ForegroundColor White
Write-Host "   - Verify database name is correct" -ForegroundColor Gray
Write-Host "   - Check if database was created successfully" -ForegroundColor Gray