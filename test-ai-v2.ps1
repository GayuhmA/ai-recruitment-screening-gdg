# Test New AI Implementation v2.0
# This script tests the 3-phase AI processing

$ErrorActionPreference = "Stop"
$BASE_URL = "http://localhost:3001"

Write-Host "Testing AI Implementation v2.0" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create test job
Write-Host "Step 1: Creating test job..." -ForegroundColor Yellow
$jobPayload = @{
    title = "Senior Full-Stack Engineer"
    department = "Engineering"
    description = "Looking for experienced full-stack developer"
    location = "Remote"
    employmentType = "FULL_TIME"
    status = "OPEN"
    requirements = @{
        requiredSkills = @("react", "node.js", "postgresql", "docker", "typescript")
    }
} | ConvertTo-Json

$job = Invoke-RestMethod -Uri "$BASE_URL/jobs" -Method POST `
    -ContentType "application/json" `
    -Body $jobPayload

Write-Host "[OK] Job created: $($job.id)" -ForegroundColor Green
Write-Host "   Title: $($job.title)"
Write-Host "   Required Skills: react, node.js, postgresql, docker, typescript"
Write-Host ""

# Step 2: Create candidate
Write-Host "Step 2: Creating candidate..." -ForegroundColor Yellow
$candidatePayload = @{
    fullName = "Test Candidate AI v2"
    email = "test.ai.v2@example.com"
    phone = "+1234567890"
} | ConvertTo-Json

$candidate = Invoke-RestMethod -Uri "$BASE_URL/candidates" -Method POST `
    -ContentType "application/json" `
    -Body $candidatePayload

Write-Host "[OK] Candidate created: $($candidate.id)" -ForegroundColor Green
Write-Host "   Name: $($candidate.fullName)"
Write-Host ""

# Step 3: Create application
Write-Host "Step 3: Creating application..." -ForegroundColor Yellow
$applicationPayload = @{
    candidateProfileId = $candidate.id
} | ConvertTo-Json

$application = Invoke-RestMethod -Uri "$BASE_URL/jobs/$($job.id)/applications" -Method POST `
    -ContentType "application/json" `
    -Body $applicationPayload

Write-Host "[OK] Application created: $($application.id)" -ForegroundColor Green
Write-Host ""

# Step 4: Upload CV
Write-Host "Step 4: Uploading CV..." -ForegroundColor Yellow

# Find any PDF in current directory or use placeholder
$cvFile = Get-ChildItem -Path . -Filter "*.pdf" | Select-Object -First 1
if (-not $cvFile) {
    Write-Host "[WARNING] No PDF found in current directory. Please place a CV PDF file here." -ForegroundColor Red
    Write-Host "   Skipping CV upload..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Test Summary:" -ForegroundColor Cyan
    Write-Host "   Job ID: $($job.id)" -ForegroundColor White
    Write-Host "   Candidate ID: $($candidate.id)" -ForegroundColor White
    Write-Host "   Application ID: $($application.id)" -ForegroundColor White
    Write-Host ""
    Write-Host "To complete the test, upload a CV manually:" -ForegroundColor Yellow
    Write-Host "   curl.exe -X POST ""$BASE_URL/applications/$($application.id)/cv"" -F ""cv=@your-cv.pdf""" -ForegroundColor White
    exit 0
}

$cvUploadUrl = "$BASE_URL/applications/$($application.id)/cv"

# Use curl for file upload (more reliable than Invoke-RestMethod)
$curlCommand = "curl.exe -X POST `"$cvUploadUrl`" -F `"cv=@$($cvFile.FullName)`" -s"
$cvUploadResponse = Invoke-Expression $curlCommand | ConvertFrom-Json

Write-Host "[OK] CV uploaded: $($cvUploadResponse.id)" -ForegroundColor Green
Write-Host "   File: $($cvFile.Name)"
Write-Host "   Size: $([math]::Round($cvFile.Length / 1KB, 2)) KB"
Write-Host "   Status: $($cvUploadResponse.status)"
Write-Host ""

# Step 5: Monitor processing (with detailed phase logging)
Write-Host "Step 5: Monitoring AI Processing (3 phases)..." -ForegroundColor Yellow
Write-Host "   Phase 1: Comprehensive CV Parsing (AI)" -ForegroundColor Gray
Write-Host "   Phase 2: Context-Aware Summary Generation" -ForegroundColor Gray
Write-Host "   Phase 3: Smart Skill Matching" -ForegroundColor Gray
Write-Host ""

$maxWaitSeconds = 30
$waitInterval = 2
$elapsed = 0
$previousStatus = ""

while ($elapsed -lt $maxWaitSeconds) {
    Start-Sleep -Seconds $waitInterval
    $elapsed += $waitInterval
    
    try {
        $candidates = Invoke-RestMethod -Uri "$BASE_URL/jobs/$($job.id)/candidates" -Method GET
        $candidateData = $candidates.data[0]
        
        $currentStatus = $candidateData.cvStatus
        
        # Show status updates
        if ($currentStatus -ne $previousStatus) {
            Write-Host "   [$($elapsed)s] Status: $currentStatus" -ForegroundColor Cyan
            $previousStatus = $currentStatus
        }
        
        if ($currentStatus -eq "AI_DONE") {
            Write-Host ""
            Write-Host "[OK] Processing Complete!" -ForegroundColor Green
            Write-Host ""
            
            # Display results
            Write-Host "Results:" -ForegroundColor Cyan
            Write-Host "==========" -ForegroundColor Cyan
            Write-Host ""
            
            Write-Host "Match Score: $($candidateData.matchScore)%" -ForegroundColor $(if ($candidateData.matchScore -ge 70) { "Green" } elseif ($candidateData.matchScore -ge 50) { "Yellow" } else { "Red" })
            Write-Host ""
            
            if ($candidateData.matchedSkills -and $candidateData.matchedSkills.Count -gt 0) {
                Write-Host "[+] Matched Skills:" -ForegroundColor Green
                $candidateData.matchedSkills | ForEach-Object { Write-Host "   - $_" -ForegroundColor White }
                Write-Host ""
            }
            
            if ($candidateData.missingSkills -and $candidateData.missingSkills.Count -gt 0) {
                Write-Host "[-] Missing Skills:" -ForegroundColor Red
                $candidateData.missingSkills | ForEach-Object { Write-Host "   - $_" -ForegroundColor White }
                Write-Host ""
            }
            
            if ($candidateData.aiExplanation) {
                Write-Host "[AI] Explanation:" -ForegroundColor Magenta
                Write-Host "   $($candidateData.aiExplanation)" -ForegroundColor White
                Write-Host ""
            }
            
            # Fetch detailed AI outputs
            Write-Host "Checking AI Outputs..." -ForegroundColor Yellow
            try {
                $cvAnalysis = Invoke-RestMethod -Uri "$BASE_URL/cvs/$($cvUploadResponse.id)/ai-analysis" -Method GET
                
                if ($cvAnalysis.cvProfile) {
                    Write-Host "   [+] CV Profile extracted (comprehensive)" -ForegroundColor Green
                    Write-Host "      - Technical Skills: $($cvAnalysis.cvProfile.skills.technical.Count)" -ForegroundColor Gray
                    Write-Host "      - Experience: $($cvAnalysis.cvProfile.experience.totalYears) years" -ForegroundColor Gray
                    Write-Host "      - Education: $($cvAnalysis.cvProfile.education.Count) entries" -ForegroundColor Gray
                    Write-Host "      - Projects: $($cvAnalysis.cvProfile.projects.Count)" -ForegroundColor Gray
                }
                
                if ($cvAnalysis.contextualSummary) {
                    Write-Host "   [+] Context-aware summary generated" -ForegroundColor Green
                    Write-Host "      Relevance Score: $($cvAnalysis.contextualSummary.relevanceScore)" -ForegroundColor Gray
                    Write-Host "      Summary: $($cvAnalysis.contextualSummary.contextualSummary)" -ForegroundColor Cyan
                }
            } catch {
                Write-Host "   [!] Could not fetch detailed AI outputs" -ForegroundColor Yellow
            }
            
            break
        } elseif ($currentStatus -eq "FAILED") {
            Write-Host ""
            Write-Host "[FAIL] Processing Failed" -ForegroundColor Red
            Write-Host "   Reason: $($candidateData.failReason)" -ForegroundColor Red
            break
        }
    } catch {
        Write-Host "   Error checking status: $_" -ForegroundColor Red
    }
}

if ($elapsed -ge $maxWaitSeconds) {
    Write-Host ""
    Write-Host "[TIMEOUT] Processing took longer than $maxWaitSeconds seconds" -ForegroundColor Yellow
    Write-Host "   Check worker logs for details" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Test Complete!" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host ""
Write-Host "Resources created:" -ForegroundColor White
Write-Host "   Job ID: $($job.id)" -ForegroundColor Gray
Write-Host "   Candidate ID: $($candidate.id)" -ForegroundColor Gray
Write-Host "   Application ID: $($application.id)" -ForegroundColor Gray
Write-Host "   CV ID: $($cvUploadResponse.id)" -ForegroundColor Gray
Write-Host ""
Write-Host "View candidate in browser:" -ForegroundColor White
Write-Host "   http://localhost:3000/jobs/$($job.id)" -ForegroundColor Cyan
Write-Host ""
