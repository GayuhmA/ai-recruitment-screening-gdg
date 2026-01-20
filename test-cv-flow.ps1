param(
  [string]$BaseUrl = "http://127.0.0.1:3001",
  [string]$CvPath = ".\DimasJatiSatria-resume.pdf"
)

$ErrorActionPreference = "Stop"

function Log($msg, $color = "White") { 
  Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $msg" -ForegroundColor $color 
}

function LogSuccess($msg) { Log "✅ $msg" "Green" }
function LogError($msg) { Log "❌ $msg" "Red" }
function LogInfo($msg) { Log "INFO: $msg" "Cyan" }
function LogWarn($msg) { Log "WARN: $msg" "Yellow" }

function GetJson($url) {
  try {
    $response = Invoke-RestMethod -Uri $url -Method GET -ContentType "application/json"
    return $response
  } catch {
    LogError "GET $url failed: $_"
    throw
  }
}

function PostJson($url, $obj) {
  try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Body ($obj | ConvertTo-Json -Depth 10) -ContentType "application/json"
    return $response
  } catch {
    LogError "POST $url failed: $_"
    throw
  }
}

function PostFile($url, $filePath) {
  try {
    $fileName = [System.IO.Path]::GetFileName($filePath)
    $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
    $boundary = [System.Guid]::NewGuid().ToString()
    
    $LF = "`r`n"
    $bodyLines = @(
      "--$boundary",
      "Content-Disposition: form-data; name=`"cv`"; filename=`"$fileName`"",
      "Content-Type: application/pdf",
      "",
      [System.Text.Encoding]::GetEncoding("ISO-8859-1").GetString($fileBytes),
      "--$boundary--"
    ) -join $LF

    $response = Invoke-RestMethod -Uri $url -Method POST -ContentType "multipart/form-data; boundary=$boundary" -Body $bodyLines
    return $response
  } catch {
    LogError "POST FILE $url failed: $_"
    throw
  }
}

# ==========================================
# STEP 0: Health Check
# ==========================================
LogInfo "Testing backend connection..."
try {
  $health = GetJson "$BaseUrl/health"
  if ($health.ok -eq $true) {
    LogSuccess "Backend is healthy"
  } else {
    throw "Backend health check failed"
  }
} catch {
  LogError "Cannot connect to backend at $BaseUrl"
  LogError "Make sure backend is running: cd apps/api; npm run dev:api"
  exit 1
}

# Check if CV file exists
if (-not (Test-Path $CvPath)) {
  LogError "CV file not found: $CvPath"
  exit 1
}
LogSuccess "CV file found: $CvPath ($([Math]::Round((Get-Item $CvPath).Length / 1024, 2)) KB)"

# ==========================================
# STEP 1: Create or Get Job
# ==========================================
LogInfo "Creating test job..."
$jobData = @{
  title = "Backend Engineer Test"
  department = "Engineering"
  location = "Remote"
  employmentType = "FULL_TIME"
  requirements = @{
    requiredSkills = @("node.js", "postgresql", "docker", "typescript")
    experience = "2+ years"
  }
  description = "Test job for CV processing validation"
}

try {
  $job = PostJson "$BaseUrl/jobs" $jobData
  LogSuccess "Job created: $($job.title) (ID: $($job.id))"
} catch {
  LogWarn "Job creation failed, trying to get existing jobs..."
  $jobs = GetJson "$BaseUrl/jobs"
  if ($jobs.data.Count -gt 0) {
    $job = $jobs.data[0]
    LogSuccess "Using existing job: $($job.title) (ID: $($job.id))"
  } else {
    throw "No jobs available"
  }
}

# ==========================================
# STEP 2: Create Candidate Profile
# ==========================================
LogInfo "Creating candidate profile..."
$candidateData = @{
  fullName = "Dimas Jati Satria"
  email = "dimas.test.$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
}

$candidate = PostJson "$BaseUrl/candidates" $candidateData
LogSuccess "Candidate created: $($candidate.name) (ID: $($candidate.id))"

# ==========================================
# STEP 3: Create Application
# ==========================================
LogInfo "Creating job application..."
$applicationData = @{
  candidateProfileId = $candidate.id
}

$application = PostJson "$BaseUrl/jobs/$($job.id)/applications" $applicationData
LogSuccess "Application created (ID: $($application.id))"

# ==========================================
# STEP 4: Upload CV
# ==========================================
LogInfo "Uploading CV file..."
$uploadStartTime = Get-Date

try {
  $cvDoc = PostFile "$BaseUrl/applications/$($application.id)/cv" $CvPath
  $uploadDuration = ((Get-Date) - $uploadStartTime).TotalSeconds
  $cvDocId = $cvDoc.cvDocumentId
  LogSuccess "CV uploaded successfully (ID: $cvDocId) - took $([Math]::Round($uploadDuration, 2))s"
  LogInfo "Status: $($cvDoc.status)"
} catch {
  LogError "CV upload failed"
  exit 1
}

# ==========================================
# STEP 5: Monitor Processing Status
# ==========================================
LogInfo "Monitoring CV processing status..."
$processingStartTime = Get-Date
$maxWaitSeconds = 120
$pollInterval = 2
$iteration = 0

while ($true) {
  $iteration++
  Start-Sleep -Seconds $pollInterval
  
  try {
    $status = GetJson "$BaseUrl/cvs/$cvDocId/status"
    $elapsed = ((Get-Date) - $processingStartTime).TotalSeconds
    
    Write-Host "`r[$(Get-Date -Format 'HH:mm:ss')] " -NoNewline
    Write-Host "Status: $($status.status) " -NoNewline -ForegroundColor Yellow
    Write-Host "| Elapsed: $([Math]::Round($elapsed, 1))s " -NoNewline -ForegroundColor Cyan
    Write-Host "| Iteration: $iteration" -NoNewline -ForegroundColor Gray
    
    if ($status.status -eq "AI_DONE") {
      Write-Host ""
      LogSuccess "Processing complete! Total time: $([Math]::Round($elapsed, 2))s"
      break
    }
    
    if ($status.status -eq "FAILED") {
      Write-Host ""
      LogError "Processing failed: $($status.errorMessage)"
      LogError "Fail Reason: $($status.failReason)"
      exit 1
    }
    
    if ($elapsed -gt $maxWaitSeconds) {
      Write-Host ""
      LogWarn "Processing timeout after ${maxWaitSeconds}s"
      LogWarn "Current status: $($status.status)"
      exit 1
    }
  } catch {
    Write-Host ""
    LogError "Failed to check status: $_"
    exit 1
  }
}

# ==========================================
# STEP 6: Get Final Results
# ==========================================
LogInfo "Fetching AI analysis results..."

try {
  $cvDetail = GetJson "$BaseUrl/cvs/$cvDocId"
  
  LogSuccess "=== CV Processing Results ==="
  Write-Host ""
  
  if ($cvDetail.extractedText) {
    $textPreview = $cvDetail.extractedText.Substring(0, [Math]::Min(200, $cvDetail.extractedText.Length))
    LogInfo "Extracted Text (preview): $textPreview..."
  }
  
  Write-Host ""
  
  if ($cvDetail.aiOutputs) {
    foreach ($output in $cvDetail.aiOutputs) {
      if ($output.type -eq "SKILLS") {
        $skills = $output.outputJson.skills
        LogSuccess "Detected Skills ($($skills.Count)):"
        $skills | ForEach-Object { Write-Host "  • $_" -ForegroundColor Green }
      }
      
      if ($output.type -eq "SUMMARY") {
        $summary = $output.outputJson.summary
        LogSuccess "Summary:"
        Write-Host "  $summary" -ForegroundColor Green
      }
    }
  }
  
  Write-Host ""
  
  # Get match score
  LogInfo "Fetching match score..."
  $jobCandidates = GetJson "$BaseUrl/jobs/$($job.id)/candidates"
  $matchData = $jobCandidates.data | Where-Object { $_.candidate.id -eq $candidate.id }
  
  if ($matchData) {
    LogSuccess "Match Score: $($matchData.matchScore)%"
    if ($matchData.matchedSkills -and $matchData.matchedSkills.Count -gt 0) {
      Write-Host "  Matched Skills: $($matchData.matchedSkills -join ', ')" -ForegroundColor Green
    }
    if ($matchData.missingSkills -and $matchData.missingSkills.Count -gt 0) {
      Write-Host "  Missing Skills: $($matchData.missingSkills -join ', ')" -ForegroundColor Yellow
    }
  }
  
  Write-Host ""
  LogSuccess "=== Test Complete ==="
  
  # Timing Summary
  $totalTime = ((Get-Date) - $uploadStartTime).TotalSeconds
  $processingTime = ((Get-Date) - $processingStartTime).TotalSeconds
  
  Write-Host ""
  LogInfo "Timing Breakdown:"
  Write-Host "  Upload: $([Math]::Round($uploadDuration, 2))s" -ForegroundColor Cyan
  Write-Host "  Processing: $([Math]::Round($processingTime, 2))s" -ForegroundColor Cyan
  Write-Host "  Total: $([Math]::Round($totalTime, 2))s" -ForegroundColor Cyan
  
} catch {
  LogError "Failed to fetch results: $_"
  exit 1
}
