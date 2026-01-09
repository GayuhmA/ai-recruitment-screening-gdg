# AI Recruitment Backend

> **Intelligent CV processing and candidate matching system powered by AI**

A production-ready REST API built with Fastify, PostgreSQL, BullMQ, and Google Gemini AI for automated CV analysis and smart candidate-job matching.

## ✨ Features

- 🔄 **Complete CRUD API** for Jobs, Candidates, Applications, and CVs
- 🤖 **AI-Powered CV Analysis** using Google Gemini (structured extraction)
- 📊 **Smart Matching Algorithm** with explainable skill-based scoring
- 📄 **Async CV Processing** via BullMQ worker queue
- 🔍 **Search & Pagination** with cursor-based navigation
- 🗂️ **S3-Compatible Storage** (MinIO) for CV documents
- ✅ **Type-Safe** with TypeScript, Zod validation, and Prisma ORM
- 🎯 **Error Classification** with user-friendly failure reasons

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Gemini API Key ([Get one here](https://ai.google.dev/))

### Installation

```bash
# Clone repository
git clone <repo-url>
cd ai-recruitment-backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Start infrastructure (Postgres, Redis, MinIO)
docker-compose up -d

# Run database migrations
npm run prisma:migrate

# Start API server (port 3001)
npm run dev:api

# Start worker (in separate terminal)
npm run dev:worker
```

### Test the API

```powershell
# Run basic CRUD tests
.\test-api.ps1

# Test full CV upload pipeline (requires sample-cv.pdf)
.\test-cv-upload.ps1
```

## 📖 Documentation

**[📋 Complete API Documentation →](./API_DOCUMENTATION.md)**

Includes:
- All REST endpoints with examples
- Request/response schemas
- Complete CV processing flow
- Matching & ranking endpoints
- Error handling guide
- PowerShell test examples

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Fastify   │────▶│  PostgreSQL  │     │    Redis    │
│  REST API   │     │  (Prisma)    │     │  (BullMQ)   │
└──────┬──────┘     └──────────────┘     └──────┬──────┘
       │                                         │
       │            ┌──────────────┐            │
       └───────────▶│    MinIO     │◀───────────┘
                    │  (S3 Store)  │
                    └──────────────┘
                           │
                    ┌──────▼──────┐
                    │  BullMQ     │
                    │  Worker     │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Gemini    │
                    │     AI      │
                    └─────────────┘
```

### Key Technologies
- **Fastify** - High-performance Node.js web framework
- **Prisma** - Type-safe ORM for PostgreSQL
- **BullMQ** - Redis-based queue for async processing
- **MinIO** - S3-compatible object storage
- **Gemini AI** - Structured CV data extraction
- **pdf-parse** - PDF text extraction
- **Zod** - Runtime validation

## 📝 API Endpoints Overview

### Core Resources
- **Jobs**: Full CRUD + search
- **Candidates**: Full CRUD + search
- **Applications**: Create, list, update status, delete
- **CVs**: Upload (multipart), list, detail, AI results, delete

### Advanced Features
- **Matching**: GET `/jobs/:id/matches` - Explainable match scores with skill breakdown
- **Ranking**: GET `/jobs/:id/candidates` - Simple ranked candidate list
- **Status Polling**: GET `/cvs/:id/status` - Track CV processing progress

All list endpoints support:
- Cursor-based pagination (`?cursor=uuid`)
- Search queries (`?q=keyword`)
- Filters (jobId, candidateId, status)
- Configurable limits (`?limit=20`)

## 🔄 CV Processing Pipeline

1. **Upload** → CV saved to MinIO, job queued
2. **Extract** → PDF text extraction via pdf-parse
3. **Analyze** → Gemini AI extracts skills & summary (structured JSON)
4. **Match** → Calculate similarity score vs. job requirements
5. **Store** → Save AI outputs and matching results to database

**Error Handling**: Failures classified as `AI_TIMEOUT`, `AI_FAILED`, `PDF_PARSE_FAILED`, etc.

## 🧪 Testing

```powershell
# Health check
curl http://127.0.0.1:3001/health

# Create job
Invoke-RestMethod -Uri "http://127.0.0.1:3001/jobs" -Method POST `
  -Body '{"title":"Backend Dev","description":"Node.js expert"}' `
  -ContentType "application/json"

# Full test suite
.\test-api.ps1
.\test-cv-upload.ps1
```

## 🛠️ Development

### Project Structure
```
src/
├── server.ts          # Fastify REST API
├── worker.ts          # BullMQ CV processor
├── main.ts            # Server entry point
├── lib/
│   ├── db.ts          # Prisma client
│   ├── bullmq.ts      # Queue setup
│   ├── s3.ts          # MinIO operations
│   ├── pdf.ts         # PDF parsing
│   ├── gemini.ts      # Gemini AI client
│   └── env.ts         # Environment config
└── ai/
    └── cv-extract.ts  # Gemini extraction logic

prisma/
├── schema.prisma      # Database schema
└── migrations/        # Schema history

test-api.ps1           # CRUD tests
test-cv-upload.ps1     # End-to-end CV flow
```

### Available Scripts
```bash
npm run dev:api        # Start API server (watch mode)
npm run dev:worker     # Start worker (watch mode)
npm run prisma:migrate # Run migrations
npm run prisma:studio  # Database GUI
```

## 🐛 Troubleshooting

**Port in use**:
```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess -Force
```

**Database issues**:
```bash
docker-compose restart postgres
npm run prisma:migrate
```

**Worker not processing**:
- Check Redis is running: `docker ps | grep redis`
- Verify `GEMINI_API_KEY` in `.env`
- Review worker terminal for errors

## 📊 Database Schema

- **Organization** → multiple **Users**, **Jobs**, **Candidates**
- **Job** ← many **Applications** → **CandidateProfile**
- **Application** ← many **CvDocuments** → many **AiOutputs**
- **JobCandidateMatch**: Computed scores linking Jobs ↔ Candidates

See [schema.prisma](./prisma/schema.prisma) for full details.

## 🔐 Environment Variables

```env
# Required
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/ai_recruitment
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
S3_ENDPOINT=http://127.0.0.1:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET_NAME=cv-docs
GEMINI_API_KEY=your_key_here

# Optional
GEMINI_MODEL=gemini-2.0-flash-exp
```

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

**[📋 View Complete API Documentation →](./API_DOCUMENTATION.md)**

$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
