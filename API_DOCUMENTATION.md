# AI Recruitment Backend - API Documentation

Complete REST API with CRUD operations for all entities, CV processing with AI analysis, and candidate matching.

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 16
- Redis 7
- MinIO (S3-compatible)
- Gemini API Key

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Start infrastructure
docker-compose up -d

# Run database migrations
npm run prisma:migrate

# Start API server (port 3001)
npm run dev:api

# Start worker (separate terminal)
npm run dev:worker
```

## 📋 API Endpoints

Base URL: `http://127.0.0.1:3001`

### Health Check

- **GET** `/health`
  - Returns: `{ "ok": true }`

---

## 🏢 Jobs API

### List Jobs
- **GET** `/jobs`
- Query Parameters:
  - `limit` (default: 10, max: 100) - Number of jobs per page
  - `cursor` (optional) - Pagination cursor (job ID)
  - `q` (optional) - Search query (searches title and description)
- Response:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "title": "Backend Developer",
        "description": "Job description...",
        "requirements": { "requiredSkills": ["node.js", "postgres"] },
        "createdAt": "2026-01-09T15:49:38.074Z",
        "updatedAt": "2026-01-09T15:49:38.074Z"
      }
    ],
    "nextCursor": "uuid" | null
  }
  ```

### Get Job Detail
- **GET** `/jobs/:jobId`
- Response: Single job object

### Create Job
- **POST** `/jobs`
- Body:
  ```json
  {
    "title": "Backend Developer",
    "description": "We are hiring...",
    "requirements": {
      "requiredSkills": ["node.js", "postgresql", "docker"]
    }
  }
  ```
- Response: Created job object

### Update Job
- **PATCH** `/jobs/:jobId`
- Body: Partial job object (same fields as create)
- Response: Updated job object

### Delete Job
- **DELETE** `/jobs/:jobId`
- Response: `{ "message": "Job deleted" }`

---

## 👥 Candidates API

### List Candidates
- **GET** `/candidates`
- Query Parameters:
  - `limit` (default: 10, max: 100)
  - `cursor` (optional)
  - `q` (optional) - Search fullName or email
- Response:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "fullName": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "createdAt": "2026-01-09T15:49:38.126Z"
      }
    ],
    "nextCursor": "uuid" | null
  }
  ```

### Get Candidate Detail
- **GET** `/candidates/:candidateId`
- Response: Single candidate object

### Create Candidate
- **POST** `/candidates`
- Body:
  ```json
  {
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  }
  ```
- Response: Created candidate object

### Update Candidate
- **PATCH** `/candidates/:candidateId`
- Body: Partial candidate object
- Response: Updated candidate object

### Delete Candidate
- **DELETE** `/candidates/:candidateId`
- Response: `{ "message": "Candidate deleted" }`

---

## 📝 Applications API

### List Applications
- **GET** `/applications`
- Query Parameters:
  - `limit` (default: 10, max: 100)
  - `cursor` (optional)
  - `jobId` (optional) - Filter by job ID
  - `candidateId` (optional) - Filter by candidate profile ID
- Response:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "status": "APPLIED",
        "createdAt": "2026-01-09T15:51:56.616Z",
        "job": {
          "id": "uuid",
          "title": "Backend Developer"
        },
        "candidate": {
          "id": "uuid",
          "fullName": "John Doe",
          "email": "john@example.com"
        }
      }
    ],
    "nextCursor": "uuid" | null
  }
  ```

### Get Application Detail
- **GET** `/applications/:applicationId`
- Response: Application with job, candidate, and CV documents

### Create Application
- **POST** `/jobs/:jobId/applications`
- Body:
  ```json
  {
    "candidateProfileId": "uuid"
  }
  ```
- Response: Created application object

### Update Application Status
- **PATCH** `/applications/:applicationId`
- Body:
  ```json
  {
    "status": "APPLIED" | "IN_REVIEW" | "INTERVIEWED" | "OFFERED" | "HIRED" | "REJECTED"
  }
  ```
- Response: Updated application object

### Delete Application
- **DELETE** `/applications/:applicationId`
- Response: `{ "message": "Application deleted" }`

---

## 📄 CV Documents API

### List CV Documents
- **GET** `/cvs`
- Query Parameters:
  - `limit` (default: 10, max: 100)
  - `cursor` (optional)
  - `applicationId` (optional) - Filter by application ID
  - `status` (optional) - Filter by status (UPLOADED, TEXT_EXTRACTED, AI_DONE, FAILED)
- Response:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "status": "AI_DONE",
        "mimeType": "application/pdf",
        "createdAt": "2026-01-09T15:51:56.616Z",
        "updatedAt": "2026-01-09T15:51:56.620Z",
        "errorMessage": null,
        "failReason": null,
        "application": {
          "id": "uuid",
          "candidate": { "id": "uuid", "fullName": "John Doe" },
          "job": { "id": "uuid", "title": "Backend Developer" }
        }
      }
    ],
    "nextCursor": "uuid" | null
  }
  ```

### Get CV Detail
- **GET** `/cvs/:cvId`
- Response: Full CV document object

### Get CV Processing Status
- **GET** `/cvs/:cvId/status`
- Response:
  ```json
  {
    "id": "uuid",
    "status": "AI_DONE",
    "errorMessage": null,
    "failReason": null,
    "updatedAt": "2026-01-09T15:51:56.620Z"
  }
  ```

### Get CV AI Analysis
- **GET** `/cvs/:cvId/ai`
- Response:
  ```json
  {
    "aiOutputs": [
      {
        "id": "uuid",
        "outputType": "SKILLS",
        "data": {
          "skills": ["Node.js", "PostgreSQL", "Docker", "TypeScript"]
        }
      },
      {
        "id": "uuid",
        "outputType": "SUMMARY",
        "data": {
          "summary": "Experienced backend developer with 5+ years..."
        }
      }
    ]
  }
  ```

### Upload CV
- **POST** `/applications/:applicationId/cv`
- Content-Type: `multipart/form-data`
- Body: Form data with `cv` field (PDF file, max 10MB)
- Response: Created CV document object
- Note: Triggers async processing via BullMQ worker

### Delete CV
- **DELETE** `/cvs/:cvId`
- Response: `{ "message": "CV deleted" }`

---

## 🎯 Matching & Ranking API

### Get Job Matches (Explainable)
- **GET** `/jobs/:jobId/matches`
- Query Parameters:
  - `limit` (default: 10, max: 100)
  - `cursor` (optional)
- Response:
  ```json
  {
    "data": [
      {
        "candidateId": "uuid",
        "candidateName": "John Doe",
        "candidateEmail": "john@example.com",
        "applicationId": "uuid",
        "applicationStatus": "APPLIED",
        "matchScore": 75.5,
        "matchedSkills": ["node.js", "postgresql"],
        "missingSkills": ["docker", "kubernetes"]
      }
    ],
    "nextCursor": "uuid" | null
  }
  ```

### Get Job Candidate Rankings (Simple)
- **GET** `/jobs/:jobId/candidates`
- Query Parameters:
  - `limit` (default: 10, max: 100)
  - `cursor` (optional)
- Response:
  ```json
  {
    "data": [
      {
        "candidateId": "uuid",
        "candidateName": "John Doe",
        "candidateEmail": "john@example.com",
        "matchScore": 75.5,
        "applicationId": "uuid",
        "applicationStatus": "APPLIED"
      }
    ],
    "nextCursor": "uuid" | null
  }
  ```

---

## 🔄 Complete CV Processing Flow

### 1. Create Prerequisites
```bash
# Create a job
POST /jobs
{
  "title": "Backend Developer",
  "description": "Node.js expert needed",
  "requirements": {
    "requiredSkills": ["node.js", "postgresql", "docker"]
  }
}
# Returns jobId

# Create a candidate
POST /candidates
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890"
}
# Returns candidateId

# Create application
POST /jobs/{jobId}/applications
{
  "candidateProfileId": "{candidateId}"
}
# Returns applicationId
```

### 2. Upload CV
```bash
# Upload PDF file (multipart/form-data)
POST /applications/{applicationId}/cv
Content-Type: multipart/form-data

Form Data:
  cv: [PDF file]
  
# Returns:
{
  "id": "cvId",
  "status": "UPLOADED",
  ...
}
```

### 3. Poll CV Status
```bash
# Check processing status
GET /cvs/{cvId}/status

# Status progression:
# UPLOADED → TEXT_EXTRACTED → AI_DONE
# or FAILED (with errorMessage and failReason)
```

### 4. Get AI Results
```bash
# Once status is AI_DONE
GET /cvs/{cvId}/ai

# Returns extracted skills and summary
```

### 5. View Matches
```bash
# Get matching score and skill analysis
GET /jobs/{jobId}/matches

# Shows:
# - Match score (0-100)
# - Matched skills (found in CV)
# - Missing skills (required but not found)
```

---

## 🧪 Testing

### Run Automated Tests
```powershell
# Basic CRUD operations
.\test-api.ps1

# Full CV upload flow (requires sample CV)
.\test-cv-upload.ps1
```

### Manual Testing with PowerShell

```powershell
# Health check
Invoke-RestMethod -Uri "http://127.0.0.1:3001/health"

# Create job
$job = @{
  title = "Backend Dev"
  description = "Hiring Node.js developer"
  requirements = @{ requiredSkills = @("node.js", "postgresql") }
}
$result = Invoke-RestMethod -Uri "http://127.0.0.1:3001/jobs" `
  -Method POST `
  -Body ($job | ConvertTo-Json -Depth 10) `
  -ContentType "application/json"

# Upload CV
$form = @{
  cv = Get-Item "path/to/resume.pdf"
}
Invoke-RestMethod -Uri "http://127.0.0.1:3001/applications/{appId}/cv" `
  -Method POST `
  -Form $form
```

---

## 🏗️ Architecture

### Tech Stack
- **Framework**: Fastify (Node.js, TypeScript, ESM)
- **Database**: PostgreSQL 16 (via Prisma ORM)
- **Queue**: BullMQ with Redis 7
- **Storage**: MinIO (S3-compatible)
- **AI**: Google Gemini API (gemini-2.0-flash)
- **PDF Parser**: pdf-parse
- **Validation**: Zod schemas

### Key Features
1. **Cursor-based Pagination**: ID-based cursors for consistent pagination
2. **Search**: Full-text search on jobs (title, description) and candidates (name, email)
3. **Filtering**: Query parameters for filtering applications and CVs
4. **Error Classification**: User-friendly error messages via `CvFailReason` enum
5. **Explainable Matching**: Shows matched vs. missing skills for transparency
6. **Retry Logic**: Gemini API calls with exponential backoff (3 attempts)
7. **PII Redaction**: Email and phone masking in AI processing

### Database Schema
- **Organization** → Users, Jobs, Candidates
- **Job** ← Applications → CandidateProfile
- **Application** ← CVDocuments → AiOutput
- **JobCandidateMatch**: Computed matching scores with skill analysis

### Worker Pipeline
1. Download CV from MinIO
2. Extract text using pdf-parse
3. Send to Gemini API for structured extraction
4. Store skills and summary as AiOutput records
5. Calculate matching score against job requirements
6. Upsert JobCandidateMatch with explainable results
7. Error classification on failure

---

## 🐛 Troubleshooting

### Port Already in Use
```powershell
# Kill process using port 3001
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess -Force
```

### Database Connection Issues
```bash
# Check Postgres is running
docker ps | Select-String postgres

# Restart database
docker-compose restart postgres

# Re-run migrations
npm run prisma:migrate
```

### Worker Not Processing Jobs
```bash
# Check Redis is running
docker ps | Select-String redis

# Restart worker
npm run dev:worker

# Check BullMQ dashboard (if installed)
npm run bullmq:dashboard
```

### Gemini API Errors
- Verify `GEMINI_API_KEY` in `.env`
- Check quota limits in Google AI Studio
- Review worker logs for retry attempts
- Errors classified as `AI_TIMEOUT`, `AI_FAILED`, etc.

---

## 📊 Response Format Standards

### List Endpoints
All list endpoints return:
```json
{
  "data": [...],
  "nextCursor": "uuid" | null
}
```

### Error Responses
```json
{
  "statusCode": 400 | 404 | 500,
  "error": "Bad Request" | "Not Found" | "Internal Server Error",
  "message": "Detailed error message"
}
```

### Success Status Codes
- `200 OK` - Successful GET, PATCH, DELETE
- `201 Created` - Successful POST (not used, returns 200)
- `404 Not Found` - Resource not found
- `400 Bad Request` - Validation error
- `500 Internal Server Error` - Server error

---

## 🔐 Environment Variables

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/ai_recruitment

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# MinIO (S3)
S3_ENDPOINT=http://127.0.0.1:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET_NAME=cv-docs

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Optional
GEMINI_MODEL=gemini-2.0-flash-exp
```

---

## 📝 License

MIT

## 👤 Author

Your Name

## 🤝 Contributing

Pull requests welcome!
