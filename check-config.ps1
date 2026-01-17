# Configuration Verification Script
# Run this to verify your environment is properly configured

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Frontend Configuration Check" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check .env.local exists
Write-Host "1. Checking .env.local file..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "   OK .env.local exists" -ForegroundColor Green
    Write-Host ""
    
    # Read and display configuration
    $envContent = Get-Content ".env.local"
    $apiUrl = $envContent | Select-String "NEXT_PUBLIC_API_URL"
    $nextAuthUrl = $envContent | Select-String "NEXTAUTH_URL"
    $hasSecret = $envContent | Select-String "NEXTAUTH_SECRET"
    
    if ($apiUrl) {
        Write-Host "   OK $($apiUrl.Line)" -ForegroundColor Green
    } else {
        Write-Host "   ERROR: NEXT_PUBLIC_API_URL not found" -ForegroundColor Red
    }
    
    if ($nextAuthUrl) {
        Write-Host "   OK $($nextAuthUrl.Line)" -ForegroundColor Green
    } else {
        Write-Host "   ERROR: NEXTAUTH_URL not found" -ForegroundColor Red
    }
    
    if ($hasSecret) {
        Write-Host "   OK NEXTAUTH_SECRET is set" -ForegroundColor Green
    } else {
        Write-Host "   ERROR: NEXTAUTH_SECRET not found" -ForegroundColor Red
    }
} else {
    Write-Host "   ERROR: .env.local does not exist" -ForegroundColor Red
    Write-Host "   --> Copy .env.example to .env.local" -ForegroundColor Yellow
}

Write-Host ""

# 2. Check backend connectivity
Write-Host "2. Testing backend connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:3001/health" -TimeoutSec 3 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   OK Backend is running at http://127.0.0.1:3001" -ForegroundColor Green
        Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ERROR: Cannot connect to backend" -ForegroundColor Red
    Write-Host "   --> Make sure backend is running on http://127.0.0.1:3001" -ForegroundColor Yellow
    Write-Host "   --> Run npm run start:dev in backend directory" -ForegroundColor Yellow
}

Write-Host ""

# 3. Check node_modules
Write-Host "3. Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "   OK node_modules exists" -ForegroundColor Green
    
    # Check critical packages
    $packages = @("next", "react", "@tanstack/react-query", "next-auth", "sonner")
    foreach ($pkg in $packages) {
        if (Test-Path "node_modules/$pkg") {
            Write-Host "   OK $pkg installed" -ForegroundColor Green
        } else {
            Write-Host "   ERROR: $pkg not found" -ForegroundColor Red
        }
    }
} else {
    Write-Host "   ERROR: node_modules not found" -ForegroundColor Red
    Write-Host "   --> Run npm install" -ForegroundColor Yellow
}

Write-Host ""

# 4. Check if dev server is running
Write-Host "4. Checking if frontend is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   OK Frontend is running at http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "   INFO: Frontend is not running" -ForegroundColor Yellow
    Write-Host "   --> Run npm run dev to start" -ForegroundColor Yellow
}

Write-Host ""

# 5. Summary
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Configuration Summary" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$envExists = Test-Path ".env.local"
$backendRunning = $false
try {
    Invoke-WebRequest -Uri "http://127.0.0.1:3001/health" -TimeoutSec 2 -ErrorAction Stop | Out-Null
    $backendRunning = $true
} catch {
    # Backend not running
}

if ($envExists -and $backendRunning) {
    Write-Host "OK Configuration: READY" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Run npm run dev (if not already running)" -ForegroundColor White
    Write-Host "  2. Open http://localhost:3000 in browser" -ForegroundColor White
    Write-Host "  3. Test login and API operations" -ForegroundColor White
} elseif (-not $envExists) {
    Write-Host "ERROR: Configuration INCOMPLETE" -ForegroundColor Red
    Write-Host ""
    Write-Host "Fix:" -ForegroundColor Cyan
    Write-Host "  1. Copy .env.example to .env.local" -ForegroundColor White
    Write-Host "  2. Update values in .env.local if needed" -ForegroundColor White
} elseif (-not $backendRunning) {
    Write-Host "WARNING: Configuration OK but BACKEND NOT RUNNING" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Fix:" -ForegroundColor Cyan
    Write-Host "  1. Navigate to backend directory" -ForegroundColor White
    Write-Host "  2. Run npm run start:dev" -ForegroundColor White
    Write-Host "  3. Come back and run npm run dev here" -ForegroundColor White
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

