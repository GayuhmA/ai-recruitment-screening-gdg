# 🚀 Quick Start Guide - AI Implementation v2.0

## Prerequisites Check

```bash
✓ PostgreSQL running (port 5432)
✓ Redis running (port 6379)
✓ MinIO running (port 9000)
✓ Node.js installed
✓ Dependencies installed (npm install)
```

## Start Services

### Option A: Development Mode (2 Terminals)

**Terminal 1 - Worker**:
```bash
cd apps/api
npm run dev:worker
```
Expected output:
```
✅ Worker started. Waiting for jobs in queue: cv-processing
```

**Terminal 2 - API Server**:
```bash
cd apps/api
npm run dev:api
```
Expected output:
```
Server listening on port 3001
```

### Option B: Test New AI Implementation

```powershell
# Make sure API and Worker are running first
.\test-ai-v2.ps1
```

This will:
1. Create a test job with required skills
2. Create a test candidate
3. Upload a CV (if PDF found in directory)
4. Monitor 3-phase AI processing
5. Display results with AI explanation

## What to Expect

### Normal Processing (AI Mode)
```
🔄 Processing CV: abc123
✅ AI parsing successful for CV abc123
✅ Context-aware summary generated for CV abc123
✅ Smart matching completed: 85% match
```

### Fallback Mode (Quota Exceeded)
```
🔄 Processing CV: abc123
⚠️ AI parsing failed, using fallback: quota exceeded
⚠️ Summary generation failed, using generic: quota exceeded
⚠️ Smart matching failed, using basic: quota exceeded
✅ Processing completed with fallback mode
```

### Error (Critical Failure)
```
🔄 Processing CV: abc123
❌ CV processing failed for abc123: PDF contains no extractable text
```

## API Endpoints

### Upload CV
```bash
POST /applications/:applicationId/cv
Content-Type: multipart/form-data
Body: cv=@file.pdf
```

### Get Candidates with Matches
```bash
GET /jobs/:jobId/candidates
```

Response:
```json
{
  "data": [{
    "candidate": { "id": "...", "fullName": "..." },
    "matchScore": 85,
    "matchedSkills": ["react", "postgresql"],
    "missingSkills": [],
    "aiExplanation": "Strong match with exact React skills...",
    "cvStatus": "AI_DONE"
  }]
}
```

### Get Detailed AI Analysis
```bash
GET /cvs/:cvId/ai-analysis
```

Response:
```json
{
  "cvProfile": {
    "personalInfo": { ... },
    "skills": { "technical": [...], "soft": [...] },
    "experience": { "totalYears": 5, "roles": [...] }
  },
  "contextualSummary": {
    "contextualSummary": "...",
    "keyHighlights": [...],
    "relevanceScore": 92
  }
}
```

## Troubleshooting

### Worker not processing
```bash
# Check Redis connection
redis-cli ping  # Should return PONG

# Check worker logs
cd apps/api
npm run dev:worker
```

### AI quota exceeded
```bash
# Check .env file
cat apps/api/.env | grep GEMINI

# System automatically uses fallback - no action needed!
```

### Database migration needed
```bash
cd apps/api
npx prisma migrate dev
```

### Port already in use
```powershell
# Kill process on port 3001
Get-NetTCPConnection -LocalPort 3001 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

## Files to Know

| File | Purpose |
|------|---------|
| `apps/api/src/ai/prompts.ts` | All AI prompt templates |
| `apps/api/src/ai/cv-parser.ts` | CV extraction logic |
| `apps/api/src/ai/smart-matcher.ts` | Skill matching logic |
| `apps/api/src/worker.ts` | Background processing |
| `apps/api/src/server.ts` | API endpoints |
| `apps/api/.env` | Configuration (API keys, etc.) |
| `AI_IMPLEMENTATION_V2.md` | Full documentation |

## Configuration

### Change AI Model
Edit `apps/api/.env`:
```bash
GEMINI_MODEL=gemini-2.0-flash-exp  # Fast (default)
# or
GEMINI_MODEL=gemini-1.5-flash      # Better quality
# or
GEMINI_MODEL=gemini-1.5-pro        # Best quality (slower)
```

### Adjust Processing Speed
Edit `apps/api/src/ai/cv-parser.ts`:
```typescript
maxOutputTokens: 2000  // Increase for more detail
temperature: 0.1       // Lower = more consistent
```

## Monitoring

### Check Worker Status
```bash
# Worker should show:
✅ Worker started. Waiting for jobs in queue: cv-processing

# During processing:
🔄 Processing CV: [id]
✅ AI parsing successful for CV [id]
✅ Context-aware summary generated for CV [id]
✅ Smart matching completed: 85% match
```

### Check Database
```bash
cd apps/api
npx prisma studio  # Opens GUI at http://localhost:5555
```

Look for:
- `AiOutput` table: Should have 2 entries per CV (CV_PROFILE + SUMMARY)
- `JobCandidateMatch` table: Should have `aiExplanation` field filled

## Next Steps

1. ✅ **Test with real CVs**: Upload actual candidate resumes
2. 📊 **Monitor performance**: Check processing time and AI quota usage
3. 🎨 **Update frontend**: Display `aiExplanation` to recruiters
4. 📈 **Measure improvement**: Compare match quality vs old system
5. 🔔 **Set up alerts**: Monitor for quota exceeded events

## Quick Commands

```bash
# Start everything
cd apps/api && npm run dev:worker &  # Worker in background
cd apps/api && npm run dev:api       # API in foreground

# Run test
.\test-ai-v2.ps1

# Check logs
# Worker logs show in Terminal 1
# API logs show in Terminal 2

# Reset database (if needed)
cd apps/api
npx prisma migrate reset
npx prisma migrate dev
```

## Success Indicators

You know it's working when:
- ✅ Worker starts without errors
- ✅ CV uploads successfully
- ✅ Processing completes in 2-5 seconds
- ✅ Match score appears with AI explanation
- ✅ No "FAILED" status in CV documents
- ✅ Database has `CV_PROFILE` entries

## Get Help

- 📖 Full docs: `AI_IMPLEMENTATION_V2.md`
- 📝 Summary: `IMPLEMENTATION_SUMMARY.md`
- 🐛 Issues: Check worker logs and database

---

**Last Updated**: January 19, 2026
**Version**: 2.0.0
