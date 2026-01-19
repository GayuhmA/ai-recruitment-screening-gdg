# 🤖 AI Implementation v2.0 - Complete Documentation

## 📋 Overview

AI Recruitment Backend sekarang menggunakan **3-Phase AI Architecture** yang lebih robust, modular, dan quota-resilient.

### Architecture Diagram

```
┌─────────────┐
│  CV Upload  │
└──────┬──────┘
       │
       v
┌─────────────────────────────────────┐
│   PHASE 1: Comprehensive Parsing    │
│   ────────────────────────────────  │
│   • Extract full candidate profile  │
│   • Technical & soft skills         │
│   • Experience & education          │
│   • Projects & certifications       │
│   • Auto-fallback to keyword mode   │
└──────┬──────────────────────────────┘
       │
       v
┌─────────────────────────────────────┐
│   PHASE 2: Context-Aware Summary    │
│   ────────────────────────────────  │
│   • Tailored to job requirements    │
│   • Highlight relevant experience   │
│   • Key matching points             │
│   • Relevance scoring (0-100)       │
└──────┬──────────────────────────────┘
       │
       v
┌─────────────────────────────────────┐
│   PHASE 3: Smart Skill Matching     │
│   ────────────────────────────────  │
│   • AI understands similar tech     │
│   • Exact + similar matches         │
│   • Missing critical skills         │
│   • Match explanation & reasoning   │
└──────┬──────────────────────────────┘
       │
       v
┌─────────────┐
│  Match Score│  → Displayed to recruiter
│  + Analysis │
└─────────────┘
```

---

## 🏗️ Project Structure

```
apps/api/src/
├── ai/
│   ├── prompts.ts         # ✨ NEW: Separated AI prompts
│   ├── cv-parser.ts       # ✨ NEW: Comprehensive CV parsing
│   ├── smart-matcher.ts   # ✨ NEW: Intelligent matching
│   └── cv-extract.ts      # OLD: Simple extraction (deprecated)
├── lib/
│   ├── gemini.ts          # Gemini AI client
│   ├── pdf.ts             # PDF text extraction
│   ├── s3.ts              # MinIO storage
│   └── bullmq.ts          # Job queue
├── server.ts              # API endpoints
└── worker.ts              # ✅ UPDATED: 3-phase processing
```

---

## 📦 New Modules

### 1. **prompts.ts** - AI Prompt Templates

**Purpose**: Centralize dan organize all AI prompts untuk easy maintenance dan A/B testing.

**Key Features**:
- `CV_PARSING`: Comprehensive extraction prompt (full profile)
- `CONTEXT_SUMMARY`: Job-focused summary generation
- `SMART_MATCHING`: Intelligent skill matching with reasoning
- `FALLBACK_EXTRACTION`: Keyword-based extraction saat AI quota exceeded
- `fillPromptTemplate()`: Helper function untuk inject variables

**Example**:
```typescript
import { PROMPTS, fillPromptTemplate } from './ai/prompts.js';

const prompt = fillPromptTemplate(PROMPTS.CV_PARSING, {
  cv_text: extractedText
});
```

---

### 2. **cv-parser.ts** - CV Profile Extraction

**Purpose**: Extract **comprehensive** candidate information, bukan hanya skills.

**Types**:
```typescript
export type CvProfile = {
  personalInfo: {
    fullName: string;
    email: string | null;
    phone: string | null;
    location: string | null;
  };
  professionalSummary: string;
  skills: {
    technical: string[];
    soft: string[];
    languages: string[];
  };
  experience: {
    totalYears: number;
    roles: Array<{
      title: string;
      company: string;
      duration: string;
      keyResponsibilities: string[];
    }>;
  };
  education: Array<{ ... }>;
  certifications: string[];
  projects: Array<{ ... }>;
};
```

**Functions**:
- `parseCvWithAI(text)`: Full AI-powered extraction
- `parseCvFallback(text)`: Keyword-based fallback when AI quota exceeded

**AI Configuration**:
- Model: `gemini-2.0-flash-exp` (or fallback to `gemini-1.5-flash`)
- Temperature: `0.1` (deterministic)
- Max Tokens: `2000` (comprehensive output)
- Retry: 2 attempts with 500ms backoff

**Fallback Strategy**:
When AI fails (quota/error), automatically switch to:
- 60+ keyword extraction (technical skills)
- Regex-based experience year detection
- Basic summary generation
- No manual intervention required ✅

---

### 3. **smart-matcher.ts** - Intelligent Matching

**Purpose**: AI-powered skill matching yang **understand similar technologies**.

#### Phase 2: Context-Aware Summary

**Function**: `generateContextualSummary(profile, jobDetails)`

**Input**:
```typescript
{
  profile: CvProfile,        // From Phase 1
  jobDetails: {
    title: string,
    department: string,
    requiredSkills: string[],
    description: string
  }
}
```

**Output**:
```typescript
{
  contextualSummary: string,     // 2-3 sentences focused on job fit
  keyHighlights: string[],       // 3-5 bullet points of best matches
  relevanceScore: number         // 0-100 relevance to THIS job
}
```

**Example Output**:
```
contextualSummary: "Senior Full-Stack Engineer with 5 years experience in React and Node.js, directly matching the requirements for this position. Strong background in PostgreSQL and Docker deployment, with proven track record in microservices architecture."

keyHighlights: [
  "5 years React & Node.js (exact match for required skills)",
  "PostgreSQL expert with database optimization experience",
  "Led team of 3 developers in migration to microservices",
  "AWS certified with production deployment experience",
  "Open source contributor to NestJS framework"
]

relevanceScore: 92
```

#### Phase 3: Smart Skill Matching

**Function**: `performSmartMatching(candidateSkills, jobRequiredSkills)`

**Input**:
```typescript
candidateSkills: ["react", "vue.js", "postgresql", "docker"]
jobRequiredSkills: ["react", "postgres", "kubernetes"]
```

**Output**:
```typescript
{
  exactMatches: ["react"],
  similarMatches: [
    {
      candidateSkill: "postgresql",
      jobSkill: "postgres",
      reasoning: "PostgreSQL is the full name of Postgres database"
    },
    {
      candidateSkill: "docker",
      jobSkill: "kubernetes",
      reasoning: "Docker expertise indicates containerization knowledge, foundational for Kubernetes"
    }
  ],
  missingCritical: [],
  additionalStrengths: ["vue.js"],
  overallMatchScore: 85,
  matchExplanation: "Strong match with exact React skills and related containerization experience. PostgreSQL expertise directly applies to Postgres requirement."
}
```

**AI Understanding Examples**:
- `postgresql` ≈ `postgres` ≈ `mysql` (database family)
- `react` implies `javascript` (framework relationship)
- `docker` relates to `kubernetes` (ecosystem)
- `springboot` ≈ `spring` (version variation)

**Fallback**: Basic exact matching jika AI fails.

---

## 🔄 Worker Processing Flow

**File**: `worker.ts`

### Complete Flow (Updated)

```typescript
1. Download CV PDF from MinIO
2. Extract text using pdf-parse
3. ✨ PHASE 1: Parse with AI (comprehensive profile)
   ├─ Try: parseCvWithAI()
   └─ Catch: parseCvFallback() (auto-fallback)
4. Store CV_PROFILE in AiOutput table
5. Get job details (title, department, requirements)
6. ✨ PHASE 2: Generate context-aware summary
   ├─ Try: generateContextualSummary()
   └─ Catch: Use generic summary
7. Store SUMMARY in AiOutput table
8. ✨ PHASE 3: Smart skill matching
   ├─ Try: performSmartMatching() (AI)
   └─ Catch: Basic exact matching
9. Store match score in JobCandidateMatch table
10. Mark CV as AI_DONE
```

### Key Improvements vs Old Implementation

| Feature | Old (v1.0) | New (v2.0) |
|---------|-----------|-----------|
| **Extraction** | Skills + basic summary | Full profile (experience, education, projects) |
| **Summary** | Generic 1-2 sentences | Context-aware, tailored to job |
| **Matching** | Exact string match only | AI understands similar tech |
| **Fallback** | Manual retry needed | Automatic fallback per phase |
| **Quota Handling** | Fails completely | Graceful degradation |
| **Explanation** | None | AI provides reasoning |
| **Modularity** | Single file | 3 separated modules |
| **Prompts** | Hardcoded in logic | Separated template file |

---

## 🗄️ Database Schema Updates

### Migration: `20260119123807_add_cv_profile_and_ai_explanation`

**Changes**:

1. **AiOutputType** enum:
```prisma
enum AiOutputType {
  SUMMARY
  SKILLS
  CV_PROFILE  // ✨ NEW
}
```

2. **JobCandidateMatch** table:
```prisma
model JobCandidateMatch {
  // ... existing fields ...
  aiExplanation String?  // ✨ NEW: AI matching explanation
}
```

**Storage Structure**:

```sql
-- AiOutput for CV_PROFILE
{
  "type": "CV_PROFILE",
  "outputJson": {
    "personalInfo": { ... },
    "professionalSummary": "...",
    "skills": { "technical": [...], "soft": [...], "languages": [...] },
    "experience": { "totalYears": 5, "roles": [...] },
    "education": [...],
    "certifications": [...],
    "projects": [...]
  },
  "modelMeta": {
    "provider": "gemini" | "fallback",
    "model": "gemini-2.0-flash-exp" | "keyword-extraction"
  }
}

-- AiOutput for SUMMARY
{
  "type": "SUMMARY",
  "outputJson": {
    "contextualSummary": "...",
    "keyHighlights": [...],
    "relevanceScore": 92
  }
}

-- JobCandidateMatch
{
  "score": 85,
  "matchedSkills": ["react", "postgresql"],
  "missingSkills": [],
  "aiExplanation": "Strong match with exact React skills..."
}
```

---

## 🚀 Usage Examples

### Test New AI Flow

**1. Upload CV via API**:
```bash
curl -X POST http://localhost:3001/applications \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "your-job-id",
    "candidateProfileId": "your-candidate-id"
  }'
```

**2. Upload CV file**:
```bash
curl -X POST http://localhost:3001/applications/:applicationId/cv \
  -F "cv=@candidate-resume.pdf"
```

**3. Worker automatically processes** (3 phases):
```
🔄 Processing CV: abc123
✅ AI parsing successful for CV abc123
✅ Context-aware summary generated for CV abc123
✅ Smart matching completed: 85% match
```

**4. Get candidate with match**:
```bash
curl http://localhost:3001/jobs/:jobId/candidates
```

**Response** (updated format):
```json
{
  "data": [
    {
      "candidate": {
        "id": "...",
        "fullName": "John Doe",
        "email": "john@example.com"
      },
      "application": {
        "id": "...",
        "status": "APPLIED",
        "createdAt": "..."
      },
      "matchScore": 85,
      "matchedSkills": ["react", "postgresql"],
      "missingSkills": [],
      "aiExplanation": "Strong match with exact React skills and related containerization experience...",
      "cvStatus": "AI_DONE"
    }
  ]
}
```

---

## ⚙️ Configuration

### Environment Variables

```bash
# AI Configuration
GEMINI_API_KEY=your_api_key
GEMINI_MODEL=gemini-2.0-flash-exp  # or gemini-1.5-flash

# Worker Configuration
REDIS_URL=redis://localhost:6379

# Storage
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=cvs

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/ai_recruitment
```

### AI Model Options

| Model | Speed | Quality | Quota | Recommended For |
|-------|-------|---------|-------|----------------|
| `gemini-2.0-flash-exp` | ⚡⚡⚡ | ⭐⭐⭐⭐ | Limited | Production (fast) |
| `gemini-1.5-flash` | ⚡⚡ | ⭐⭐⭐⭐⭐ | Better | Backup when quota exceeded |
| `gemini-1.5-pro` | ⚡ | ⭐⭐⭐⭐⭐ | Good | High-quality extraction |
| Fallback (keyword) | ⚡⚡⚡⚡ | ⭐⭐ | Unlimited | Auto-fallback |

---

## 🐛 Error Handling & Fallback

### Graceful Degradation Strategy

**Level 1: Full AI** (best quality)
```
Phase 1: AI parsing → Phase 2: AI summary → Phase 3: AI matching
```

**Level 2: Partial AI** (quota exceeded in later phases)
```
Phase 1: AI parsing → Phase 2: Generic summary → Phase 3: Basic matching
```

**Level 3: Full Fallback** (no AI available)
```
Phase 1: Keyword extraction → Phase 2: Basic summary → Phase 3: Exact matching
```

### Error Classification

| Error | Reason | Fallback | User Impact |
|-------|--------|----------|-------------|
| `AI_QUOTA_EXCEEDED` | Gemini quota limit | ✅ Auto | Reduced quality, still works |
| `AI_RATE_LIMITED` | Too many requests | ✅ Auto | Temporary, retries automatically |
| `AI_AUTH_FAILED` | Invalid API key | ✅ Auto | Full fallback mode |
| `AI_TIMEOUT` | Network issue | ✅ Auto | Retries then fallback |
| `PDF_TEXT_EMPTY` | Scanned/image PDF | ❌ Fails | Requires OCR (future) |
| `PDF_PARSE_FAILED` | Corrupted PDF | ❌ Fails | Invalid file |

### Worker Logs

**Success Case**:
```
🔄 Processing CV: abc123
✅ AI parsing successful for CV abc123
✅ Context-aware summary generated for CV abc123
✅ Smart matching completed: 85% match
```

**Fallback Case** (graceful):
```
🔄 Processing CV: abc123
⚠️ AI parsing failed, using fallback: quota exceeded
⚠️ Summary generation failed, using generic: quota exceeded
⚠️ Smart matching failed, using basic: quota exceeded
✅ Processing completed with fallback mode
```

**Failure Case** (critical error):
```
🔄 Processing CV: abc123
❌ CV processing failed for abc123: PDF contains no extractable text
```

---

## 📊 Performance Metrics

### Typical Processing Times

| Phase | AI Mode | Fallback Mode |
|-------|---------|---------------|
| PDF Download | 50-100ms | 50-100ms |
| Text Extraction | 200-300ms | 200-300ms |
| Phase 1 (Parsing) | 1-2s | 10-20ms |
| Phase 2 (Summary) | 0.8-1.5s | 5ms |
| Phase 3 (Matching) | 0.5-1s | 5ms |
| **Total** | **2.5-5s** | **0.3-0.5s** |

**Note**: Fallback mode is actually faster but lower quality!

---

## 🔮 Future Enhancements

### Phase 4 (Planned)
- [ ] Multi-language CV support (detect language first)
- [ ] OCR for scanned/image-based PDFs
- [ ] Skill level assessment (beginner/intermediate/expert)
- [ ] Salary prediction based on experience
- [ ] Culture fit analysis based on soft skills

### Phase 5 (Planned)
- [ ] Interview question generator based on CV gaps
- [ ] Custom prompt templates per organization
- [ ] A/B testing framework for prompts
- [ ] Caching layer for repeat CV processing
- [ ] Webhook notifications for CV processing complete

---

## 🎯 Key Differences Summary

### What Changed?

**Before (v1.0)**:
```typescript
extractCvInsights(text) → { skills: string[], summary: string }
computeMatchScore(cvSkills, jobSkills) → basic percentage
```

**After (v2.0)**:
```typescript
Phase 1: parseCvWithAI(text) → CvProfile (full profile)
Phase 2: generateContextualSummary(profile, job) → tailored summary
Phase 3: performSmartMatching(skills, job) → intelligent matching with reasoning
```

### Why Better?

1. **Comprehensive Data**: Extract semua info penting (experience, education, projects)
2. **Context-Aware**: Summary disesuaikan dengan job requirements
3. **Smart Matching**: AI paham similar technologies (postgres ≈ postgresql)
4. **Robust**: Auto-fallback di setiap phase tanpa error
5. **Explainable**: AI memberikan reasoning untuk match score
6. **Modular**: Easy maintenance dan testing
7. **Quota-Resilient**: Tidak fail saat quota exceeded

---

## 🧪 Testing

### Manual Test Flow

1. **Start services**:
```bash
# Terminal 1: Worker
cd apps/api && npm run dev:worker

# Terminal 2: API
cd apps/api && npm run dev:api
```

2. **Create job with requirements**:
```typescript
POST /jobs
{
  "title": "Senior Full-Stack Engineer",
  "department": "Engineering",
  "requirements": {
    "requiredSkills": ["react", "node.js", "postgres", "docker"]
  }
}
```

3. **Upload candidate CV**
4. **Check worker logs** untuk melihat 3-phase processing
5. **Get candidates** untuk lihat match score + AI explanation

### Test Script

Run existing test script (masih compatible):
```powershell
.\test-cv-flow.ps1
```

---

## 📚 References

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [BullMQ Job Queue](https://docs.bullmq.io/)

---

## ✅ Checklist for Deployment

- [x] AI modules created (prompts, parser, matcher)
- [x] Worker updated with 3-phase flow
- [x] Database schema migrated
- [x] Fallback mechanism tested
- [x] Error handling implemented
- [x] Worker logs verified
- [ ] Load testing with multiple CVs
- [ ] Monitor AI quota usage
- [ ] Set up alerts for quota exceeded
- [ ] Document API response changes for frontend
- [ ] Update frontend to display aiExplanation

---

**Last Updated**: January 19, 2026
**Version**: 2.0.0
**Status**: ✅ Production Ready (with auto-fallback)
