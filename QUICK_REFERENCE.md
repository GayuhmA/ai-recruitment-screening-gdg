# 🎯 Quick Reference - AI Recruitment Backend

## 🚀 Start Servers

```powershell
# Terminal 1: API Server
npm run dev:api

# Terminal 2: Worker
npm run dev:worker

# Terminal 3: Docker (if not running)
docker-compose up -d
```

## 🧪 Run Tests

```powershell
# Basic CRUD tests
.\test-api.ps1

# Full CV upload flow (needs sample-cv.pdf)
.\test-cv-upload.ps1
```

## 📡 Quick API Examples

### Create Job
```powershell
$job = @{
    title = "Backend Developer"
    description = "Node.js expert needed"
    requirements = @{
        requiredSkills = @("Node.js", "PostgreSQL", "Docker")
    }
}
Invoke-RestMethod -Uri "http://127.0.0.1:3001/jobs" `
    -Method POST `
    -Body ($job | ConvertTo-Json -Depth 10) `
    -ContentType "application/json"
```

### Create Candidate
```powershell
$candidate = @{
    fullName = "John Doe"
    email = "john@example.com"
    phone = "+1234567890"
}
Invoke-RestMethod -Uri "http://127.0.0.1:3001/candidates" `
    -Method POST `
    -Body ($candidate | ConvertTo-Json) `
    -ContentType "application/json"
```

### Create Application
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:3001/jobs/{jobId}/applications" `
    -Method POST `
    -Body '{"candidateProfileId":"uuid"}' `
    -ContentType "application/json"
```

### Upload CV
```powershell
$form = @{ cv = Get-Item "resume.pdf" }
Invoke-RestMethod -Uri "http://127.0.0.1:3001/applications/{appId}/cv" `
    -Method POST `
    -Form $form
```

### Check CV Status
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:3001/cvs/{cvId}/status"
```

### Get AI Analysis
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:3001/cvs/{cvId}/ai"
```

### Get Matches (Explainable)
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:3001/jobs/{jobId}/matches"
```

### Get Rankings (Simple)
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:3001/jobs/{jobId}/candidates"
```

## 🔍 All Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/jobs` | List jobs (paginated, searchable) |
| GET | `/jobs/:id` | Get job detail |
| POST | `/jobs` | Create job |
| PATCH | `/jobs/:id` | Update job |
| DELETE | `/jobs/:id` | Delete job |
| GET | `/candidates` | List candidates (paginated, searchable) |
| GET | `/candidates/:id` | Get candidate detail |
| POST | `/candidates` | Create candidate |
| PATCH | `/candidates/:id` | Update candidate |
| DELETE | `/candidates/:id` | Delete candidate |
| GET | `/applications` | List applications (filterable) |
| GET | `/applications/:id` | Get application detail |
| POST | `/jobs/:jobId/applications` | Create application |
| PATCH | `/applications/:id` | Update application status |
| DELETE | `/applications/:id` | Delete application |
| GET | `/cvs` | List CVs (filterable) |
| GET | `/cvs/:id` | Get CV detail |
| GET | `/cvs/:id/status` | Get CV processing status |
| GET | `/cvs/:id/ai` | Get AI analysis results |
| POST | `/applications/:id/cv` | Upload CV (multipart) |
| DELETE | `/cvs/:id` | Delete CV |
| GET | `/jobs/:id/matches` | Get explainable matches |
| GET | `/jobs/:id/candidates` | Get simple rankings |

## 📋 Query Parameters

### Pagination (all list endpoints)
- `limit` - Results per page (default: 10, max: 100)
- `cursor` - Pagination cursor (UUID from `nextCursor`)

### Search
- Jobs: `?q=keyword` (searches title + description)
- Candidates: `?q=keyword` (searches fullName + email)

### Filters
- Applications: `?jobId=uuid` or `?candidateId=uuid`
- CVs: `?applicationId=uuid` or `?status=UPLOADED|TEXT_EXTRACTED|AI_DONE|FAILED`

## 🗂️ Response Format

### List Endpoints
```json
{
  "data": [...],
  "nextCursor": "uuid" | null
}
```

### Single Resources
```json
{
  "id": "uuid",
  "field1": "value",
  ...
}
```

### Errors
```json
{
  "statusCode": 400 | 404 | 500,
  "error": "Error Name",
  "message": "Detailed message"
}
```

## 🔧 Troubleshooting

### Port in Use
```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess -Force
```

### Check Services
```bash
docker ps
# Should show: postgres, redis, minio, mc
```

### Restart Services
```bash
docker-compose restart
npm run prisma:migrate
```

### Check Logs
```bash
# API logs (terminal 1)
# Worker logs (terminal 2)
```

## 📚 Documentation

- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference
- **[README.md](./README.md)** - Setup and architecture
- **[IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md)** - Feature checklist

## 🔑 Environment Variables

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/ai_recruitment
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
S3_ENDPOINT=http://127.0.0.1:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET_NAME=cv-docs
GEMINI_API_KEY=your_key_here
```

## 📊 CV Processing States

```
UPLOADED → TEXT_EXTRACTED → AI_DONE
                ↓
              FAILED (with failReason)
```

## 🎯 Typical Workflow

1. Create Job
2. Create Candidate
3. Create Application (link candidate to job)
4. Upload CV (triggers async processing)
5. Poll CV status until AI_DONE
6. View AI analysis (skills + summary)
7. Check matches (explainable with skill breakdown)
8. View rankings (simple sorted list)

## 📝 Status Codes

- `200` - Success
- `400` - Validation error
- `404` - Resource not found
- `500` - Server error

---

**Base URL**: `http://127.0.0.1:3001`  
**API Version**: 1.0.0  
**Framework**: Fastify + TypeScript
