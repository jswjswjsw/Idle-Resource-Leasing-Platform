# Check existing Aliyun ECS resources

$ACCESS_KEY_ID = "LTAI5tSApCkhMZTuujKHYt3r"
$ACCESS_KEY_SECRET = "qGLVQsrFCvhPZ6PD8dN36sHqhY76mV"
$REGION = "cn-hangzhou"

Write-Host "Checking existing Aliyun ECS resources..." -ForegroundColor Cyan

# Check Aliyun CLI
if (-not (Get-Command "aliyun" -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Aliyun CLI not installed" -ForegroundColor Red
    Write-Host "Please install from: https://help.aliyun.com/document_detail/121541.html" -ForegroundColor Yellow
    exit 1
}

# Configure authentication
Write-Host "Configuring Aliyun authentication..." -ForegroundColor Yellow
try {
    & aliyun configure set --profile default --mode AK --region $REGION --access-key-id $ACCESS_KEY_ID --access-key-secret $ACCESS_KEY_SECRET
    Write-Host "SUCCESS: Authentication configured" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Authentication failed - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Get ECS instances
Write-Host "Finding ECS instances..." -ForegroundColor Yellow
try {
    $instancesResult = & aliyun ecs DescribeInstances --RegionId $REGION --PageSize 50
    $instances = ($instancesResult | ConvertFrom-Json).Instances.Instance
    
    if ($instances.Count -eq 0) {
        Write-Host "ERROR: No ECS instances found in region $REGION" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "SUCCESS: Found $($instances.Count) ECS instances" -ForegroundColor Green
    Write-Host ""
    
    # Show instances
    for ($i = 0; $i -lt $instances.Count; $i++) {
        $instance = $instances[$i]
        $publicIP = "Not assigned"
        
        if ($instance.PublicIpAddress.IpAddress.Count -gt 0) {
            $publicIP = $instance.PublicIpAddress.IpAddress[0]
        } elseif ($instance.EipAddress.IpAddress) {
            $publicIP = $instance.EipAddress.IpAddress
        }
        
        Write-Host "[$($i + 1)] Instance Info:" -ForegroundColor Cyan
        Write-Host "    ID: $($instance.InstanceId)" -ForegroundColor White
        Write-Host "    Name: $($instance.InstanceName)" -ForegroundColor White
        Write-Host "    Status: $($instance.Status)" -ForegroundColor White
        Write-Host "    Type: $($instance.InstanceType)" -ForegroundColor White
        Write-Host "    Public IP: $publicIP" -ForegroundColor White
        Write-Host ""
    }
    
} catch {
    Write-Host "ERROR: Failed to get instances - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Save for manual selection
$instances | ConvertTo-Json | Out-File "d:\project\trade\.available-instances.json" -Encoding UTF8

Write-Host "Available instances saved to .available-instances.json" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Review the instances above" -ForegroundColor White
Write-Host "2. Choose which instance to use" -ForegroundColor White
Write-Host "3. Provide the instance ID and public IP" -ForegroundColor White