# DNS Problem Diagnosis Script
# Comprehensive diagnosis for wwwcn.uk domain issues

Write-Host "DNS Problem Diagnosis for wwwcn.uk" -ForegroundColor Cyan
Write-Host "======================================"

# Domain information
$domain = "wwwcn.uk"
$subdomains = @("api.wwwcn.uk", "www.wwwcn.uk")
$expectedIP = "116.62.44.24"

Write-Host ""
Write-Host "Step 1: Basic Domain Resolution Test" -ForegroundColor Yellow
Write-Host "------------------------------------"

# Test domain resolution with different DNS servers
$dnsServers = @(
    @{Name="Google DNS"; IP="8.8.8.8"},
    @{Name="Cloudflare DNS"; IP="1.1.1.1"},
    @{Name="Local DNS"; IP="auto"}
)

foreach ($dns in $dnsServers) {
    Write-Host "Testing with $($dns.Name) ($($dns.IP)):" -ForegroundColor White
    
    if ($dns.IP -eq "auto") {
        try {
            $result = nslookup $domain 2>&1
            Write-Host "  Local DNS Result: $result" -ForegroundColor Gray
        } catch {
            Write-Host "  Local DNS Failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        try {
            $result = nslookup $domain $dns.IP 2>&1
            Write-Host "  Result: $result" -ForegroundColor Gray
        } catch {
            Write-Host "  Failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    Write-Host ""
}

Write-Host ""
Write-Host "Step 2: Name Server Check" -ForegroundColor Yellow
Write-Host "-------------------------"

Write-Host "Checking current nameservers for $domain:" -ForegroundColor White
try {
    $nsResult = nslookup -type=NS $domain 8.8.8.8 2>&1
    Write-Host "NS Query Result: $nsResult" -ForegroundColor Gray
} catch {
    Write-Host "NS Query Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Expected Cloudflare Nameservers:" -ForegroundColor White
Write-Host "  daphne.ns.cloudflare.com" -ForegroundColor Green
Write-Host "  graham.ns.cloudflare.com" -ForegroundColor Green

Write-Host ""
Write-Host "Step 3: Domain Registration Check" -ForegroundColor Yellow
Write-Host "---------------------------------"

Write-Host "Checking domain registration status..." -ForegroundColor White
try {
    # Check if domain exists in any DNS system
    $whoisTest = nslookup -type=SOA $domain 8.8.8.8 2>&1
    Write-Host "SOA Record Check: $whoisTest" -ForegroundColor Gray
} catch {
    Write-Host "SOA Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 4: Subdomain Resolution Test" -ForegroundColor Yellow
Write-Host "-----------------------------------"

foreach ($subdomain in $subdomains) {
    Write-Host "Testing $subdomain:" -ForegroundColor White
    try {
        $subResult = nslookup $subdomain 8.8.8.8 2>&1
        Write-Host "  Result: $subResult" -ForegroundColor Gray
    } catch {
        Write-Host "  Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Step 5: Network Connectivity Test" -ForegroundColor Yellow
Write-Host "----------------------------------"

Write-Host "Testing network connectivity to DNS servers:" -ForegroundColor White
$testHosts = @("8.8.8.8", "1.1.1.1", "daphne.ns.cloudflare.com")

foreach ($host in $testHosts) {
    Write-Host "Pinging $host:" -ForegroundColor White
    try {
        $pingResult = Test-Connection -ComputerName $host -Count 2 -Quiet
        if ($pingResult) {
            Write-Host "  SUCCESS: $host is reachable" -ForegroundColor Green
        } else {
            Write-Host "  FAILED: $host is not reachable" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Step 6: Problem Analysis" -ForegroundColor Yellow
Write-Host "------------------------"

Write-Host "Analyzing possible causes:" -ForegroundColor White

# Check if it's a new domain issue
Write-Host ""
Write-Host "Possible Causes:" -ForegroundColor Cyan
Write-Host "1. Domain was recently registered (< 48 hours)" -ForegroundColor White
Write-Host "2. DNS propagation still in progress" -ForegroundColor White
Write-Host "3. Domain registration has issues" -ForegroundColor White
Write-Host "4. Nameserver configuration problem" -ForegroundColor White
Write-Host "5. Domain is suspended or inactive" -ForegroundColor White

Write-Host ""
Write-Host "Step 7: Recommended Actions" -ForegroundColor Yellow
Write-Host "---------------------------"

Write-Host "Based on diagnosis, here are the recommended actions:" -ForegroundColor White
Write-Host ""
Write-Host "ACTION 1: Check Cloudflare Domain Registration" -ForegroundColor Cyan
Write-Host "  - Login to Cloudflare Dashboard" -ForegroundColor White
Write-Host "  - Go to Domain Registration section" -ForegroundColor White
Write-Host "  - Verify wwwcn.uk status is Active" -ForegroundColor White
Write-Host "  - Check for any alerts or required actions" -ForegroundColor White

Write-Host ""
Write-Host "ACTION 2: Wait for DNS Propagation" -ForegroundColor Cyan
Write-Host "  - If domain was recently registered, wait 24-48 hours" -ForegroundColor White
Write-Host "  - DNS changes can take time to propagate globally" -ForegroundColor White

Write-Host ""
Write-Host "ACTION 3: Use IP-based Certificate (Temporary)" -ForegroundColor Cyan
Write-Host "  - While waiting for DNS to resolve, use IP certificate" -ForegroundColor White
Write-Host "  - Command: git pull && scripts\\ssl-cert-ip-validation.ps1" -ForegroundColor Green

Write-Host ""
Write-Host "ACTION 4: Contact Cloudflare Support" -ForegroundColor Cyan
Write-Host "  - If domain status shows issues in Cloudflare Dashboard" -ForegroundColor White
Write-Host "  - If problem persists after 48+ hours" -ForegroundColor White

Write-Host ""
Write-Host "Step 8: Next Immediate Steps" -ForegroundColor Yellow
Write-Host "-----------------------------"

Write-Host "Execute these commands now:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Check Cloudflare Domain Registration status" -ForegroundColor White
Write-Host "2. If domain is active, proceed with IP certificate:" -ForegroundColor White
Write-Host "   git add scripts\\dns-problem-diagnosis.ps1" -ForegroundColor Green
Write-Host "   git commit -m 'add: DNS problem diagnosis script'" -ForegroundColor Green
Write-Host "   git push origin main" -ForegroundColor Green
Write-Host "3. On ECS server:" -ForegroundColor White
Write-Host "   git pull origin main" -ForegroundColor Green
Write-Host "   powershell -ExecutionPolicy Bypass -File scripts\\ssl-cert-ip-validation.ps1" -ForegroundColor Green

Write-Host ""
Write-Host "Diagnosis Complete!" -ForegroundColor Green
Write-Host "==================="