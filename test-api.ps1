# API Testing Script for AI Recruitment Backend
$baseUrl = "http://127.0.0.1:3001"

Write-Host "`n=== Testing Health Endpoint ===" -ForegroundColor Green
$health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
Write-Host "Health: $($health | ConvertTo-Json)" -ForegroundColor Cyan

Write-Host "`n=== Creating a Job ===" -ForegroundColor Green
$newJob = @{
    title = "Senior Software Engineer"
    description = "We are looking for an experienced backend developer"
    requirements = @{
        skills = @("Java", "Spring Boot", "PostgreSQL", "Docker")
        experience = "5+ years"
    }
}

$job = Invoke-RestMethod -Uri "$baseUrl/jobs" -Method POST -Body ($newJob | ConvertTo-Json -Depth 10) -ContentType "application/json"
Write-Host "Created Job: $($job | ConvertTo-Json)" -ForegroundColor Cyan
$jobId = $job.id

Write-Host "`n=== Listing All Jobs ===" -ForegroundColor Green
$jobs = Invoke-RestMethod -Uri "$baseUrl/jobs" -Method GET
Write-Host "Jobs: $($jobs | ConvertTo-Json -Depth 10)" -ForegroundColor Cyan

Write-Host "`n=== Getting Job Detail ===" -ForegroundColor Green
$jobDetail = Invoke-RestMethod -Uri "$baseUrl/jobs/$jobId" -Method GET
Write-Host "Job Detail: $($jobDetail | ConvertTo-Json -Depth 10)" -ForegroundColor Cyan

Write-Host "`n=== Creating a Candidate ===" -ForegroundColor Green
$newCandidate = @{
    fullName = "John Doe"
    email = "john.doe@example.com"
    phone = "+1234567890"
}

$candidate = Invoke-RestMethod -Uri "$baseUrl/candidates" -Method POST -Body ($newCandidate | ConvertTo-Json) -ContentType "application/json"
Write-Host "Created Candidate: $($candidate | ConvertTo-Json)" -ForegroundColor Cyan
$candidateId = $candidate.id

Write-Host "`n=== Listing All Candidates ===" -ForegroundColor Green
$candidates = Invoke-RestMethod -Uri "$baseUrl/candidates" -Method GET
Write-Host "Candidates: $($candidates | ConvertTo-Json -Depth 10)" -ForegroundColor Cyan

Write-Host "`n=== Creating an Application ===" -ForegroundColor Green
$application = Invoke-RestMethod -Uri "$baseUrl/jobs/$jobId/applications" -Method POST -Body (@{candidateProfileId=$candidateId} | ConvertTo-Json) -ContentType "application/json"
Write-Host "Created Application: $($application | ConvertTo-Json)" -ForegroundColor Cyan
$applicationId = $application.id

Write-Host "`n=== Listing Applications ===" -ForegroundColor Green
$applications = Invoke-RestMethod -Uri "$baseUrl/applications" -Method GET
Write-Host "Applications: $($applications | ConvertTo-Json -Depth 10)" -ForegroundColor Cyan

Write-Host "`n=== Updating Candidate ===" -ForegroundColor Green
$updatedCandidate = Invoke-RestMethod -Uri "$baseUrl/candidates/$candidateId" -Method PATCH -Body (@{phone="+9876543210"} | ConvertTo-Json) -ContentType "application/json"
Write-Host "Updated Candidate: $($updatedCandidate | ConvertTo-Json)" -ForegroundColor Cyan

Write-Host "`n=== Searching Jobs ===" -ForegroundColor Green
$searchResults = Invoke-RestMethod -Uri "$baseUrl/jobs?q=software" -Method GET
Write-Host "Search Results: $($searchResults | ConvertTo-Json -Depth 10)" -ForegroundColor Cyan

Write-Host "`n=== Pagination Test ===" -ForegroundColor Green
if ($jobs.nextCursor) {
    $nextPage = Invoke-RestMethod -Uri "$baseUrl/jobs?cursor=$($jobs.nextCursor)" -Method GET
    Write-Host "Next Page: $($nextPage | ConvertTo-Json -Depth 10)" -ForegroundColor Cyan
} else {
    Write-Host "No next page (only 1 job exists)" -ForegroundColor Yellow
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Green
Write-Host "`nCreated Resources:" -ForegroundColor Magenta
Write-Host "  Job ID: $jobId" -ForegroundColor White
Write-Host "  Candidate ID: $candidateId" -ForegroundColor White
Write-Host "  Application ID: $applicationId" -ForegroundColor White

Write-Host "`nNext Steps:" -ForegroundColor Magenta
Write-Host "  1. Upload CV: Use multipart/form-data to POST /applications/$applicationId/cv" -ForegroundColor White
Write-Host "  2. Check CV Status: GET /cvs/<cvId>/status" -ForegroundColor White
Write-Host "  3. View AI Results: GET /cvs/<cvId>/ai" -ForegroundColor White
Write-Host "  4. Check Matches: GET /jobs/$jobId/matches" -ForegroundColor White
