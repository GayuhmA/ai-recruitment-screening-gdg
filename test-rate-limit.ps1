# Rate Limiting Test Script
$baseUrl = "http://127.0.0.1:3001"

Write-Host "`n=== Testing Rate Limiting ===" -ForegroundColor Green

# Test 1: Check rate limit headers on normal requests
Write-Host "`n1. Testing normal requests with rate limit headers:" -ForegroundColor Cyan
for ($i = 1; $i -le 5; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/health" -UseBasicParsing
        $limit = $response.Headers['X-RateLimit-Limit']
        $remaining = $response.Headers['X-RateLimit-Remaining']
        $reset = $response.Headers['X-RateLimit-Reset']
        
        Write-Host "Request $i : Status $($response.StatusCode) | Limit: $limit | Remaining: $remaining" -ForegroundColor White
    } catch {
        Write-Host "Request $i : Error - $($_.Exception.Message)" -ForegroundColor Red
    }
    Start-Sleep -Milliseconds 100
}

# Test 2: Test write endpoint rate limiting (stricter limits)
Write-Host "`n2. Testing write endpoint (POST /jobs) with stricter rate limiting:" -ForegroundColor Cyan
$jobData = @{
    title = "Test Job"
    description = "Testing rate limits"
    requirements = @{
        requiredSkills = @("test")
    }
} | ConvertTo-Json -Depth 10

for ($i = 1; $i -le 5; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/jobs" -Method POST -Body $jobData -ContentType "application/json" -UseBasicParsing
        $limit = $response.Headers['X-RateLimit-Limit']
        $remaining = $response.Headers['X-RateLimit-Remaining']
        
        Write-Host "Request $i : Status $($response.StatusCode) | Limit: $limit | Remaining: $remaining" -ForegroundColor White
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 429) {
            Write-Host "Request $i : ✓ Rate limit triggered (429 Too Many Requests)" -ForegroundColor Yellow
        } else {
            Write-Host "Request $i : Error - Status $statusCode" -ForegroundColor Red
        }
    }
    Start-Sleep -Milliseconds 50
}

# Test 3: Rapid fire test (should trigger rate limit)
Write-Host "`n3. Rapid fire test (should trigger rate limit eventually):" -ForegroundColor Cyan
$successCount = 0
$rateLimitedCount = 0

for ($i = 1; $i -le 110; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/health" -UseBasicParsing -TimeoutSec 2
        $successCount++
        
        if ($i % 10 -eq 0) {
            $remaining = $response.Headers['X-RateLimit-Remaining']
            Write-Host "Requests $($i-9)-$i : Success (Remaining: $remaining)" -ForegroundColor Green
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 429) {
            $rateLimitedCount++
            if ($rateLimitedCount -eq 1) {
                Write-Host "Request $i : ✓ Rate limit triggered!" -ForegroundColor Yellow
            }
        }
    }
}

Write-Host "`nResults:" -ForegroundColor Magenta
Write-Host "  Successful requests: $successCount / 110" -ForegroundColor White
Write-Host "  Rate limited requests: $rateLimitedCount / 110" -ForegroundColor White

if ($rateLimitedCount -gt 0) {
    Write-Host "`n✓ Rate limiting is working correctly!" -ForegroundColor Green
    Write-Host "  Global limit: 100 requests per minute" -ForegroundColor White
    Write-Host "  Write operations (POST/PATCH/DELETE): 10-30 per minute" -ForegroundColor White
    Write-Host "  CV uploads: 10 per minute" -ForegroundColor White
} else {
    Write-Host "`n⚠ Rate limiting may not be working as expected" -ForegroundColor Yellow
    Write-Host "  Check @fastify/rate-limit configuration" -ForegroundColor White
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Green
