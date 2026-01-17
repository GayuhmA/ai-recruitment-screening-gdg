
param(
  [string]$BaseUrl = "http://127.0.0.1:3001",
  [string]$CvPath = ".\DimasJatiSatria-resume.pdf",
  [int]$PollMax = 60,
  [int]$PollSleepSec = 2
)

$ErrorActionPreference = "Stop"

function Ok($name) { Write-Host "✅ $name" -ForegroundColor Green }
function Fail($name, $msg) { Write-Host "❌ $name :: $msg" -ForegroundColor Red }

function GetJson($url) {
  return (curl.exe -s $url) | ConvertFrom-Json
}

function PostJson($url, $obj) {
  $json = $obj | ConvertTo-Json -Depth 10 -Compress
  $tmp = Join-Path $PWD "temp.json"
  [System.IO.File]::WriteAllText($tmp, $json, [System.Text.Encoding]::UTF8)
  $raw = (curl.exe -s -X POST $url -H "Content-Type: application/json" --data-binary "@temp.json")
  return $raw | ConvertFrom-Json
}

function PatchJson($url, $obj) {
  $json = $obj | ConvertTo-Json -Depth 10 -Compress
  $tmp = Join-Path $PWD "temp.json"
  [System.IO.File]::WriteAllText($tmp, $json, [System.Text.Encoding]::UTF8)
  $raw = (curl.exe -s -X PATCH $url -H "Content-Type: application/json" --data-binary "@temp.json")
  return $raw | ConvertFrom-Json
}


function DeleteJson($url) {
  return (curl.exe -s -X DELETE $url) | ConvertFrom-Json
}

function Assert($cond, $msg) {
  if (-not $cond) { throw $msg }
}

Write-Host "== AI Recruitment Backend API Test ==" -ForegroundColor Cyan
Write-Host "BaseUrl: $BaseUrl"
Write-Host "CV Path: $CvPath"

# 0) Preflight
try {
  $h = GetJson "$BaseUrl/health"
  Assert ($h.ok -eq $true) "health not ok"
  Ok "GET /health"
} catch { Fail "GET /health" $_.Exception.Message; exit 1 }

if (!(Test-Path $CvPath)) {
  Fail "CV file" "Not found: $CvPath"
  exit 1
}

# 1) JOBS
try {
  $job = PostJson "$BaseUrl/jobs" @{
    title="Backend Dev"
    description="Hiring backend developer"
    requirements=@{ requiredSkills=@("node.js","postgresql","docker") }
  }
  Assert ($job.id) "job.id missing"
  $jobId = $job.id
  Ok "POST /jobs -> $jobId"
} catch { Fail "POST /jobs" $_.Exception.Message; exit 1 }

try {
  $jobs1 = GetJson "$BaseUrl/jobs?limit=3"
  Assert ($jobs1.data.Count -ge 1) "jobs list empty"
  Ok "GET /jobs?limit=3"
} catch { Fail "GET /jobs" $_.Exception.Message }

try {
  $jobDetail = GetJson "$BaseUrl/jobs/$jobId"
  Assert ($jobDetail.id -eq $jobId) "job detail mismatch"
  Ok "GET /jobs/:jobId"
} catch { Fail "GET /jobs/:jobId" $_.Exception.Message }

try {
  $jobUpdated = PatchJson "$BaseUrl/jobs/$jobId" @{
    title="Backend Dev Updated"
    description="Hiring backend developer (updated)"
    requirements=@{ requiredSkills=@("node.js","postgresql","docker","redis") }
  }
  Assert ($jobUpdated.title -match "Updated") "job patch failed"
  Ok "PATCH /jobs/:jobId"
} catch { Fail "PATCH /jobs/:jobId" $_.Exception.Message }

try {
  $jobsSearch = GetJson "$BaseUrl/jobs?limit=5&q=backend"
  Ok "GET /jobs?q=backend"
} catch { Fail "GET /jobs?q=" $_.Exception.Message }

# pagination cursor test
try {
  $p1 = GetJson "$BaseUrl/jobs?limit=1"
  Assert ($p1.data.Count -eq 1) "p1 count !=1"
  $cursor = $p1.nextCursor
  Assert ($cursor) "nextCursor missing"
  $p2 = GetJson "$BaseUrl/jobs?limit=1&cursor=$cursor"
  Ok "GET /jobs cursor pagination"
} catch { Fail "GET /jobs pagination" $_.Exception.Message }

# 2) CANDIDATES
try {
  $rand = Get-Random
  $cand = PostJson "$BaseUrl/candidates" @{
    fullName="Test User"
    email="test+$rand@example.com"
    phone="08123456789"
  }
  Assert ($cand.id) "candidate.id missing"
  $candidateId = $cand.id
  Ok "POST /candidates -> $candidateId"
} catch { Fail "POST /candidates" $_.Exception.Message; exit 1 }

try {
  $cands = GetJson "$BaseUrl/candidates?limit=3"
  Ok "GET /candidates?limit=3"
} catch { Fail "GET /candidates" $_.Exception.Message }

try {
  $candDetail = GetJson "$BaseUrl/candidates/$candidateId"
  Assert ($candDetail.id -eq $candidateId) "candidate detail mismatch"
  Ok "GET /candidates/:candidateId"
} catch { Fail "GET /candidates/:candidateId" $_.Exception.Message }

try {
  $candUpd = PatchJson "$BaseUrl/candidates/$candidateId" @{ fullName="Test User Updated" }
  Assert ($candUpd.fullName -match "Updated") "candidate patch failed"
  Ok "PATCH /candidates/:candidateId"
} catch { Fail "PATCH /candidates/:candidateId" $_.Exception.Message }

try {
  $candSearch = GetJson "$BaseUrl/candidates?limit=5&q=test"
  Ok "GET /candidates?q=test"
} catch { Fail "GET /candidates?q=" $_.Exception.Message }

# 3) APPLICATIONS
try {
  $app = PostJson "$BaseUrl/jobs/$jobId/applications" @{ candidateProfileId = $candidateId }
  Assert ($app.id) "application.id missing"
  $applicationId = $app.id
  Ok "POST /jobs/:jobId/applications -> $applicationId"
} catch { Fail "POST /jobs/:jobId/applications" $_.Exception.Message; exit 1 }

try {
  $apps = GetJson "$BaseUrl/applications?limit=5"
  Ok "GET /applications?limit=5"
} catch { Fail "GET /applications" $_.Exception.Message }

try {
  $appsFilterJob = GetJson "$BaseUrl/applications?limit=5&jobId=$jobId"
  Ok "GET /applications?jobId="
} catch { Fail "GET /applications?jobId=" $_.Exception.Message }

try {
  $appsFilterCand = GetJson "$BaseUrl/applications?limit=5&candidateId=$candidateId"
  Ok "GET /applications?candidateId="
} catch { Fail "GET /applications?candidateId=" $_.Exception.Message }

try {
  $appDetail = GetJson "$BaseUrl/applications/$applicationId"
  Assert ($appDetail.id -eq $applicationId) "application detail mismatch"
  Ok "GET /applications/:applicationId"
} catch { Fail "GET /applications/:applicationId" $_.Exception.Message }

try {
  $appPatched = PatchJson "$BaseUrl/applications/$applicationId" @{ status="SHORTLISTED" }
  Assert ($appPatched.status -eq "SHORTLISTED") "application status patch failed"
  Ok "PATCH /applications/:applicationId (status)"
} catch { Fail "PATCH /applications/:applicationId" $_.Exception.Message }

# 4) CV UPLOAD
try {
  $cv = (curl.exe -s -X POST "$BaseUrl/applications/$applicationId/cv" -F "file=@$CvPath") | ConvertFrom-Json
  Assert ($cv.cvDocumentId) "cvDocumentId missing"
  $cvId = $cv.cvDocumentId
  Ok "POST /applications/:applicationId/cv -> $cvId"
} catch { Fail "POST /applications/:applicationId/cv" $_.Exception.Message; exit 1 }

# 5) CV READ/STATUS/AI
try {
  $cvList = GetJson "$BaseUrl/cvs?limit=5"
  Ok "GET /cvs?limit=5"
} catch { Fail "GET /cvs" $_.Exception.Message }

try {
  $cvDetail = GetJson "$BaseUrl/cvs/$cvId"
  Assert ($cvDetail.id -eq $cvId) "cv detail mismatch"
  Ok "GET /cvs/:cvId"
} catch { Fail "GET /cvs/:cvId" $_.Exception.Message }

try {
  $cvStatus = GetJson "$BaseUrl/cvs/$cvId/status"
  Ok "GET /cvs/:cvId/status"
} catch { Fail "GET /cvs/:cvId/status" $_.Exception.Message }

# poll for AI_DONE/FAILED
try {
  for ($i=0; $i -lt $PollMax; $i++) {
    $st = GetJson "$BaseUrl/cvs/$cvId/status"
    $s = $st.status
    Write-Host "poll[$i] status=$s"
    if ($s -eq "AI_DONE" -or $s -eq "FAILED") { break }
    Start-Sleep -Seconds $PollSleepSec
  }
  Ok "Poll /cvs/:cvId/status"
} catch { Fail "Poll /cvs/:cvId/status" $_.Exception.Message }

try {
  $ai = GetJson "$BaseUrl/cvs/$cvId/ai"
  Ok "GET /cvs/:cvId/ai"
} catch { Fail "GET /cvs/:cvId/ai" $_.Exception.Message }

# filter by status and applicationId
try {
  $cvByApp = GetJson "$BaseUrl/cvs?limit=5&applicationId=$applicationId"
  Ok "GET /cvs?applicationId="
} catch { Fail "GET /cvs?applicationId=" $_.Exception.Message }

try {
  $cvByStatus = GetJson "$BaseUrl/cvs?limit=5&status=UPLOADED"
  Ok "GET /cvs?status="
} catch { Fail "GET /cvs?status=" $_.Exception.Message }

# 6) MATCHES/RANKING
try {
  $matches = GetJson "$BaseUrl/jobs/$jobId/matches?sort=score_desc"
  Ok "GET /jobs/:jobId/matches"
} catch { Fail "GET /jobs/:jobId/matches" $_.Exception.Message }

try {
  $rank = GetJson "$BaseUrl/jobs/$jobId/candidates?sort=score_desc"
  Ok "GET /jobs/:jobId/candidates"
} catch { Fail "GET /jobs/:jobId/candidates" $_.Exception.Message }

# # 7) DELETE (cleanup)
# try {
#   $delCv = DeleteJson "$BaseUrl/cvs/$cvId"
#   Ok "DELETE /cvs/:cvId"
# } catch { Fail "DELETE /cvs/:cvId" $_.Exception.Message }

# try {
#   $delApp = DeleteJson "$BaseUrl/applications/$applicationId"
#   Ok "DELETE /applications/:applicationId"
# } catch { Fail "DELETE /applications/:applicationId" $_.Exception.Message }

# try {
#   $delCand = DeleteJson "$BaseUrl/candidates/$candidateId"
#   Ok "DELETE /candidates/:candidateId"
# } catch { Fail "DELETE /candidates/:candidateId" $_.Exception.Message }

# try {
#   $delJob = DeleteJson "$BaseUrl/jobs/$jobId"
#   Ok "DELETE /jobs/:jobId"
# } catch { Fail "DELETE /jobs/:jobId" $_.Exception.Message }

Write-Host "`n== DONE ==" -ForegroundColor Cyan
