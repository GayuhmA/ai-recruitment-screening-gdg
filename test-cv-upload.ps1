# CV Upload and Full Pipeline Test Script
$baseUrl = "http://127.0.0.1:3001"

# Colors for output
function Write-Step($message) { Write-Host "`n=== $message ===" -ForegroundColor Green }
function Write-Success($message) { Write-Host "✓ $message" -ForegroundColor Cyan }
function Write-Error($message) { Write-Host "✗ $message" -ForegroundColor Red }
function Write-Info($message) { Write-Host "ℹ $message" -ForegroundColor Yellow }

# Check if sample CV exists
$cvPath = ".\sample-cv.pdf"
if (-not (Test-Path $cvPath)) {
    Write-Error "Sample CV not found at $cvPath"
    Write-Info "Please create a PDF file named 'sample-cv.pdf' in the project root"
    Write-Info "The CV should contain skills like: Node.js, PostgreSQL, Docker, TypeScript, etc."
    exit 1
}

Write-Step "Step 1: Create a Job Posting"
$newJob = @{
    title = "Senior Backend Engineer"
    description = "Looking for experienced backend developer with strong Node.js skills"
    requirements = @{
        requiredSkills = @("Node.js", "PostgreSQL", "Docker", "TypeScript", "REST API", "Microservices")
    }
}

try {
    $job = Invoke-RestMethod -Uri "$baseUrl/jobs" -Method POST -Body ($newJob | ConvertTo-Json -Depth 10) -ContentType "application/json"
    $jobId = $job.id
    Write-Success "Created Job: $($job.title) (ID: $jobId)"
} catch {
    Write-Error "Failed to create job: $_"
    exit 1
}

Write-Step "Step 2: Create a Candidate Profile"
$newCandidate = @{
    fullName = "Jane Smith"
    email = "jane.smith@techpro.com"
    phone = "+1-555-0123"
}

try {
    $candidate = Invoke-RestMethod -Uri "$baseUrl/candidates" -Method POST -Body ($newCandidate | ConvertTo-Json) -ContentType "application/json"
    $candidateId = $candidate.id
    Write-Success "Created Candidate: $($candidate.fullName) (ID: $candidateId)"
} catch {
    Write-Error "Failed to create candidate: $_"
    exit 1
}

Write-Step "Step 3: Create Job Application"
try {
    $application = Invoke-RestMethod -Uri "$baseUrl/jobs/$jobId/applications" -Method POST -Body (@{candidateProfileId=$candidateId} | ConvertTo-Json) -ContentType "application/json"
    $applicationId = $application.id
    Write-Success "Created Application (ID: $applicationId)"
} catch {
    Write-Error "Failed to create application: $_"
    exit 1
}

Write-Step "Step 4: Upload CV (PDF)"
try {
    # PowerShell -Form parameter automatically handles multipart/form-data
    $form = @{
        cv = Get-Item $cvPath
    }
    $cvDoc = Invoke-RestMethod -Uri "$baseUrl/applications/$applicationId/cv" -Method POST -Form $form
    $cvId = $cvDoc.id
    Write-Success "CV Uploaded (ID: $cvId, Status: $($cvDoc.status))"
    Write-Info "CV processing started in background worker..."
} catch {
    Write-Error "Failed to upload CV: $_"
    exit 1
}

Write-Step "Step 5: Poll CV Processing Status"
$maxAttempts = 30
$pollInterval = 2
$attempt = 0
$cvStatus = $null

while ($attempt -lt $maxAttempts) {
    $attempt++
    Start-Sleep -Seconds $pollInterval
    
    try {
        $cvStatus = Invoke-RestMethod -Uri "$baseUrl/cvs/$cvId/status" -Method GET
        Write-Host "[Attempt $attempt/$maxAttempts] Status: $($cvStatus.status)" -ForegroundColor Gray
        
        if ($cvStatus.status -eq "AI_DONE") {
            Write-Success "CV processing completed successfully!"
            break
        } elseif ($cvStatus.status -eq "FAILED") {
            Write-Error "CV processing failed!"
            Write-Error "Error: $($cvStatus.errorMessage)"
            if ($cvStatus.failReason) {
                Write-Error "Reason: $($cvStatus.failReason)"
            }
            exit 1
        }
    } catch {
        Write-Error "Failed to check CV status: $_"
        exit 1
    }
}

if ($cvStatus.status -ne "AI_DONE") {
    Write-Error "CV processing timed out after $($maxAttempts * $pollInterval) seconds"
    Write-Info "Current status: $($cvStatus.status)"
    exit 1
}

Write-Step "Step 6: Retrieve AI Analysis Results"
try {
    $aiResults = Invoke-RestMethod -Uri "$baseUrl/cvs/$cvId/ai" -Method GET
    Write-Success "AI Analysis Retrieved ($($aiResults.aiOutputs.Count) outputs)"
    
    foreach ($output in $aiResults.aiOutputs) {
        Write-Host "`n  Type: $($output.outputType)" -ForegroundColor Magenta
        
        if ($output.outputType -eq "SKILLS") {
            $skills = $output.data.skills
            Write-Host "  Skills Found ($($skills.Count)):" -ForegroundColor White
            $skills | ForEach-Object { Write-Host "    • $_" -ForegroundColor Cyan }
        } elseif ($output.outputType -eq "SUMMARY") {
            $summary = $output.data.summary
            Write-Host "  Summary:" -ForegroundColor White
            Write-Host "    $summary" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Error "Failed to retrieve AI results: $_"
    exit 1
}

Write-Step "Step 7: Check Job Matching Results"
try {
    $matches = Invoke-RestMethod -Uri "$baseUrl/jobs/$jobId/matches?limit=5" -Method GET
    
    if ($matches.data.Count -eq 0) {
        Write-Info "No matches found yet (matching may be processing)"
    } else {
        Write-Success "Found $($matches.data.Count) candidate match(es)"
        
        foreach ($match in $matches.data) {
            Write-Host "`n  Candidate: $($match.candidateName) ($($match.candidateEmail))" -ForegroundColor Magenta
            Write-Host "  Match Score: $($match.matchScore)%" -ForegroundColor Cyan
            Write-Host "  Application Status: $($match.applicationStatus)" -ForegroundColor White
            
            if ($match.matchedSkills -and $match.matchedSkills.Count -gt 0) {
                Write-Host "  ✓ Matched Skills ($($match.matchedSkills.Count)):" -ForegroundColor Green
                $match.matchedSkills | ForEach-Object { Write-Host "      • $_" -ForegroundColor Green }
            }
            
            if ($match.missingSkills -and $match.missingSkills.Count -gt 0) {
                Write-Host "  ✗ Missing Skills ($($match.missingSkills.Count)):" -ForegroundColor Yellow
                $match.missingSkills | ForEach-Object { Write-Host "      • $_" -ForegroundColor Yellow }
            }
        }
    }
} catch {
    Write-Error "Failed to retrieve matches: $_"
    exit 1
}

Write-Step "Step 8: Get Simple Candidate Ranking"
try {
    $rankings = Invoke-RestMethod -Uri "$baseUrl/jobs/$jobId/candidates?limit=10" -Method GET
    
    if ($rankings.data.Count -eq 0) {
        Write-Info "No rankings available yet"
    } else {
        Write-Success "Top Candidates for Job"
        Write-Host "`n  Rank | Name                | Score | Status" -ForegroundColor Magenta
        Write-Host "  -----|---------------------|-------|--------" -ForegroundColor Magenta
        
        $rank = 1
        foreach ($candidate in $rankings.data) {
            $name = $candidate.candidateName.PadRight(19).Substring(0, 19)
            $score = "$($candidate.matchScore)%".PadLeft(5)
            $status = $candidate.applicationStatus
            Write-Host "  $($rank.ToString().PadLeft(4)) | $name | $score | $status" -ForegroundColor Cyan
            $rank++
        }
    }
} catch {
    Write-Error "Failed to retrieve rankings: $_"
    exit 1
}

Write-Step "Test Complete - Summary"
Write-Host "`nCreated Resources:" -ForegroundColor Green
Write-Host "  Job ID:         $jobId" -ForegroundColor White
Write-Host "  Candidate ID:   $candidateId" -ForegroundColor White
Write-Host "  Application ID: $applicationId" -ForegroundColor White
Write-Host "  CV ID:          $cvId" -ForegroundColor White

Write-Host "`nAPI Endpoints Tested:" -ForegroundColor Green
Write-Host "  ✓ POST /jobs" -ForegroundColor White
Write-Host "  ✓ POST /candidates" -ForegroundColor White
Write-Host "  ✓ POST /jobs/:jobId/applications" -ForegroundColor White
Write-Host "  ✓ POST /applications/:applicationId/cv" -ForegroundColor White
Write-Host "  ✓ GET /cvs/:cvId/status" -ForegroundColor White
Write-Host "  ✓ GET /cvs/:cvId/ai" -ForegroundColor White
Write-Host "  ✓ GET /jobs/:jobId/matches" -ForegroundColor White
Write-Host "  ✓ GET /jobs/:jobId/candidates" -ForegroundColor White

Write-Host "`n✓ All tests passed successfully!" -ForegroundColor Green
