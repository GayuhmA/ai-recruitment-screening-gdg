import "dotenv/config";
import Fastify from "fastify";
import multipart from "@fastify/multipart";
import { z } from "zod";
import { prisma } from "./lib/db.js";
import { putCvObject } from "./lib/s3.js";
import { cvQueue } from "./lib/bullmq.js";

const app = Fastify({ logger: true });
await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

app.get("/health", async () => ({ ok: true }));

// NOTE: sementara hardcode 1 org untuk cepat (MVP lokal).
// Nanti auth+org context baru kita rapihin.
const ORG_ID = "local-org";

// bootstrap org on start (id fixed biar simpel)
async function ensureOrg() {
  const exists = await prisma.organization.findFirst({ where: { id: ORG_ID } });
  if (!exists) {
    await prisma.organization.create({ data: { id: ORG_ID, name: "Local Org" } });
  }
}
await ensureOrg();

// ========== JOBS CRUD ==========

app.get("/jobs", async (req) => {
  const query = z.object({
    limit: z.coerce.number().min(1).max(100).default(20),
    cursor: z.string().optional(),
    q: z.string().optional(),
  }).parse(req.query);

  const where: any = { organizationId: ORG_ID };
  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: "insensitive" } },
      { description: { contains: query.q, mode: "insensitive" } },
    ];
  }

  type JobQuery = Parameters<typeof prisma.job.findMany>[0];
  const queryOptions: JobQuery = {
    where,
    take: query.limit + 1,
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, description: true, requirements: true, createdAt: true, updatedAt: true },
  };

  if (query.cursor) {
    queryOptions.cursor = { id: query.cursor };
    queryOptions.skip = 1;
  }

  const rows = await prisma.job.findMany(queryOptions);

  const hasMore = rows.length > query.limit;
  const data = hasMore ? rows.slice(0, query.limit) : rows;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return { data, nextCursor };
});

app.get("/jobs/:jobId", async (req, reply) => {
  const params = z.object({ jobId: z.string().uuid() }).parse(req.params);
  const job = await prisma.job.findUnique({
    where: { id: params.jobId },
    select: { id: true, title: true, description: true, requirements: true, createdAt: true, updatedAt: true },
  });
  if (!job) return reply.code(404).send({ message: "Job not found" });
  return job;
});

app.post("/jobs", async (req) => {
  const body = z.object({
    title: z.string().min(2),
    description: z.string().min(10),
    requirements: z.object({
      requiredSkills: z.array(z.string()).optional(),
    }).optional(),
  }).parse(req.body);

  const requirements = body.requirements ? {
    requiredSkills: body.requirements.requiredSkills ?? [],
  } : { requiredSkills: [] };

  const job = await prisma.job.create({
    data: {
      organizationId: ORG_ID,
      title: body.title,
      description: body.description,
      requirements,
    },
  });
  return job;
});

app.patch("/jobs/:jobId", async (req, reply) => {
  const params = z.object({ jobId: z.string().uuid() }).parse(req.params);
  const body = z.object({
    title: z.string().min(2).optional(),
    description: z.string().min(10).optional(),
    requirements: z.object({
      requiredSkills: z.array(z.string()).optional(),
    }).optional(),
  }).parse(req.body);

  const exists = await prisma.job.findUnique({ where: { id: params.jobId } });
  if (!exists) return reply.code(404).send({ message: "Job not found" });

  const updateData: any = {};
  if (body.title) updateData.title = body.title;
  if (body.description) updateData.description = body.description;
  if (body.requirements) {
    updateData.requirements = {
      requiredSkills: body.requirements.requiredSkills ?? [],
    };
  }

  const job = await prisma.job.update({
    where: { id: params.jobId },
    data: updateData,
  });
  return job;
});

app.delete("/jobs/:jobId", async (req, reply) => {
  const params = z.object({ jobId: z.string().uuid() }).parse(req.params);
  
  const exists = await prisma.job.findUnique({ where: { id: params.jobId } });
  if (!exists) return reply.code(404).send({ message: "Job not found" });

  await prisma.job.delete({ where: { id: params.jobId } });
  return { message: "Job deleted successfully" };
});

// ========== CANDIDATES CRUD ==========

app.get("/candidates", async (req) => {
  const query = z.object({
    limit: z.coerce.number().min(1).max(100).default(20),
    cursor: z.string().optional(),
    q: z.string().optional(),
  }).parse(req.query);

  const where: any = { organizationId: ORG_ID };
  if (query.q) {
    where.OR = [
      { fullName: { contains: query.q, mode: "insensitive" } },
      { email: { contains: query.q, mode: "insensitive" } },
    ];
  }

  type CandidateQuery = Parameters<typeof prisma.candidateProfile.findMany>[0];
  const queryOptions: CandidateQuery = {
    where,
    take: query.limit + 1,
    orderBy: { createdAt: "desc" },
    select: { id: true, fullName: true, email: true, phone: true, createdAt: true },
  };

  if (query.cursor) {
    queryOptions.cursor = { id: query.cursor };
    queryOptions.skip = 1;
  }

  const rows = await prisma.candidateProfile.findMany(queryOptions);

  const hasMore = rows.length > query.limit;
  const data = hasMore ? rows.slice(0, query.limit) : rows;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return { data, nextCursor };
});

app.get("/candidates/:candidateId", async (req, reply) => {
  const params = z.object({ candidateId: z.string().uuid() }).parse(req.params);
  const candidate = await prisma.candidateProfile.findUnique({
    where: { id: params.candidateId },
    select: { id: true, fullName: true, email: true, phone: true, createdAt: true },
  });
  if (!candidate) return reply.code(404).send({ message: "Candidate not found" });
  return candidate;
});

app.post("/candidates", async (req) => {
  const body = z.object({
    fullName: z.string().min(2),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }).parse(req.body);

  const candidate = await prisma.candidateProfile.create({
    data: { organizationId: ORG_ID, ...body },
  });
  return candidate;
});

app.patch("/candidates/:candidateId", async (req, reply) => {
  const params = z.object({ candidateId: z.string().uuid() }).parse(req.params);
  const body = z.object({
    fullName: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }).parse(req.body);

  const exists = await prisma.candidateProfile.findUnique({ where: { id: params.candidateId } });
  if (!exists) return reply.code(404).send({ message: "Candidate not found" });

  const candidate = await prisma.candidateProfile.update({
    where: { id: params.candidateId },
    data: body,
  });
  return candidate;
});

app.delete("/candidates/:candidateId", async (req, reply) => {
  const params = z.object({ candidateId: z.string().uuid() }).parse(req.params);
  
  const exists = await prisma.candidateProfile.findUnique({ where: { id: params.candidateId } });
  if (!exists) return reply.code(404).send({ message: "Candidate not found" });

  await prisma.candidateProfile.delete({ where: { id: params.candidateId } });
  return { message: "Candidate deleted successfully" };
});

// ========== APPLICATIONS ==========

app.get("/applications", async (req) => {
  const query = z.object({
    limit: z.coerce.number().min(1).max(100).default(20),
    cursor: z.string().optional(),
    jobId: z.string().uuid().optional(),
    candidateId: z.string().uuid().optional(),
  }).parse(req.query);

  const where: any = {};
  if (query.jobId) where.jobId = query.jobId;
  if (query.candidateId) where.candidateProfileId = query.candidateId;

  type ApplicationQuery = Parameters<typeof prisma.application.findMany>[0];
  const queryOptions: ApplicationQuery = {
    where,
    take: query.limit + 1,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      job: { select: { id: true, title: true } },
      candidate: { select: { id: true, fullName: true, email: true } },
    },
  };

  if (query.cursor) {
    queryOptions.cursor = { id: query.cursor };
    queryOptions.skip = 1;
  }

  const rows = await prisma.application.findMany(queryOptions);

  const hasMore = rows.length > query.limit;
  const data = hasMore ? rows.slice(0, query.limit) : rows;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return { data, nextCursor };
});

app.get("/applications/:applicationId", async (req, reply) => {
  const params = z.object({ applicationId: z.string().uuid() }).parse(req.params);
  const application = await prisma.application.findUnique({
    where: { id: params.applicationId },
    select: {
      id: true,
      status: true,
      createdAt: true,
      job: { select: { id: true, title: true, description: true, requirements: true } },
      candidate: { select: { id: true, fullName: true, email: true, phone: true } },
      cvDocuments: { select: { id: true, status: true, mimeType: true, createdAt: true } },
    },
  });
  if (!application) return reply.code(404).send({ message: "Application not found" });
  return application;
});

app.post("/jobs/:jobId/applications", async (req) => {
  const params = z.object({ jobId: z.string().uuid() }).parse(req.params);
  const body = z.object({ candidateProfileId: z.string().uuid() }).parse(req.body);

  const application = await prisma.application.create({
    data: {
      jobId: params.jobId,
      candidateProfileId: body.candidateProfileId,
    },
  });
  return application;
});

app.patch("/applications/:applicationId", async (req, reply) => {
  const params = z.object({ applicationId: z.string().uuid() }).parse(req.params);
  const body = z.object({
    status: z.enum(["APPLIED", "SHORTLISTED", "REJECTED"]).optional(),
  }).parse(req.body);

  const exists = await prisma.application.findUnique({ where: { id: params.applicationId } });
  if (!exists) return reply.code(404).send({ message: "Application not found" });

  const application = await prisma.application.update({
    where: { id: params.applicationId },
    data: body,
  });
  return application;
});

app.delete("/applications/:applicationId", async (req, reply) => {
  const params = z.object({ applicationId: z.string().uuid() }).parse(req.params);
  
  const exists = await prisma.application.findUnique({ where: { id: params.applicationId } });
  if (!exists) return reply.code(404).send({ message: "Application not found" });

  await prisma.application.delete({ where: { id: params.applicationId } });
  return { message: "Application deleted successfully" };
});

// ========== CV DOCUMENTS ==========

app.get("/cvs", async (req) => {
  const query = z.object({
    limit: z.coerce.number().min(1).max(100).default(20),
    cursor: z.string().optional(),
    applicationId: z.string().uuid().optional(),
    status: z.enum(["UPLOADED", "TEXT_EXTRACTED", "AI_DONE", "FAILED"]).optional(),
  }).parse(req.query);

  const where: any = {};
  if (query.applicationId) where.applicationId = query.applicationId;
  if (query.status) where.status = query.status;

  type CvQuery = Parameters<typeof prisma.cvDocument.findMany>[0];
  const queryOptions: CvQuery = {
    where,
    take: query.limit + 1,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      mimeType: true,
      createdAt: true,
      updatedAt: true,
      errorMessage: true,
      failReason: true,
      application: {
        select: {
          id: true,
          candidate: { select: { id: true, fullName: true } },
          job: { select: { id: true, title: true } },
        },
      },
    },
  };

  if (query.cursor) {
    queryOptions.cursor = { id: query.cursor };
    queryOptions.skip = 1;
  }

  const rows = await prisma.cvDocument.findMany(queryOptions);

  const hasMore = rows.length > query.limit;
  const data = hasMore ? rows.slice(0, query.limit) : rows;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return { data, nextCursor };
});

app.get("/cvs/:cvId", async (req, reply) => {
  const params = z.object({ cvId: z.string().uuid() }).parse(req.params);
  const cv = await prisma.cvDocument.findUnique({
    where: { id: params.cvId },
    select: {
      id: true,
      status: true,
      mimeType: true,
      storageKey: true,
      createdAt: true,
      updatedAt: true,
      errorMessage: true,
      failReason: true,
      application: {
        select: {
          id: true,
          candidate: { select: { id: true, fullName: true, email: true } },
          job: { select: { id: true, title: true } },
        },
      },
    },
  });
  if (!cv) return reply.code(404).send({ message: "CV not found" });
  return cv;
});

app.get("/cvs/:cvId/status", async (req) => {
  const params = z.object({ cvId: z.string().uuid() }).parse(req.params);
  const cv = await prisma.cvDocument.findUnique({
    where: { id: params.cvId },
    select: { id: true, status: true, errorMessage: true, failReason: true, updatedAt: true },
  });
  return cv ?? { message: "not found" };
});

app.get("/cvs/:cvId/ai", async (req, reply) => {
  const params = z.object({ cvId: z.string().uuid() }).parse(req.params);

  const cv = await prisma.cvDocument.findUnique({
    where: { id: params.cvId },
    select: {
      id: true,
      status: true,
      errorMessage: true,
      failReason: true,
      aiOutputs: { select: { type: true, outputJson: true }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!cv) return reply.code(404).send({ message: "not found" });

  const skillsOut = cv.aiOutputs.find((o) => o.type === "SKILLS");
  const summaryOut = cv.aiOutputs.find((o) => o.type === "SUMMARY");

  const skills = Array.isArray((skillsOut?.outputJson as any)?.skills)
    ? ((skillsOut?.outputJson as any).skills as unknown[]).filter((x): x is string => typeof x === "string")
    : [];
  const summary = typeof (summaryOut?.outputJson as any)?.summary === "string" ? (summaryOut?.outputJson as any).summary : null;

  return {
    status: cv.status,
    skills,
    summary,
    errorMessage: cv.errorMessage ?? null,
    failReason: cv.failReason ?? null,
  };
});

app.post("/applications/:applicationId/cv", async (req, reply) => {
  const params = z.object({ applicationId: z.string().uuid() }).parse(req.params);

  const file = await req.file();
  if (!file) return reply.code(400).send({ message: "file is required" });

  const buf = await file.toBuffer();
  const mime = file.mimetype;

  const storageKey = await putCvObject(buf, mime);

  const cv = await prisma.cvDocument.create({
    data: {
      applicationId: params.applicationId,
      storageKey,
      mimeType: mime,
      status: "UPLOADED",
    },
  });

  // enqueue processing
  await cvQueue.add("CV_PROCESS", { cvDocumentId: cv.id });

  return { cvDocumentId: cv.id, status: cv.status };
});

app.delete("/cvs/:cvId", async (req, reply) => {
  const params = z.object({ cvId: z.string().uuid() }).parse(req.params);
  
  const cv = await prisma.cvDocument.findUnique({ where: { id: params.cvId }, select: { storageKey: true } });
  if (!cv) return reply.code(404).send({ message: "CV not found" });

  // TODO: Delete from MinIO/S3 if needed
  // await deleteObjectFromS3(cv.storageKey);

  await prisma.cvDocument.delete({ where: { id: params.cvId } });
  return { message: "CV deleted successfully" };
});

// ========== MATCHES & RANKINGS (Read-only) ==========

app.get("/jobs/:jobId/matches", async (req) => {
  const params = z.object({ jobId: z.string().uuid() }).parse(req.params);
  const query = z
    .object({ sort: z.enum(["score_desc", "score_asc"]).optional() })
    .parse((req as any).query ?? {});

  const job = await prisma.job.findUnique({
    where: { id: params.jobId },
    select: { requirements: true },
  });

  if (!job) return [];

  const jobRequirements = job.requirements as any;
  const jobSkills = Array.isArray(jobRequirements?.requiredSkills)
    ? (jobRequirements.requiredSkills as unknown[]).filter((x): x is string => typeof x === "string")
    : [];

  const orderBy = query.sort === "score_asc" ? { score: "asc" as const } : { score: "desc" as const };
  const matches = await prisma.jobCandidateMatch.findMany({
    where: { jobId: params.jobId },
    orderBy,
    select: {
      score: true,
      matchedSkills: true,
      missingSkills: true,
      updatedAt: true,
      candidate: { select: { id: true, fullName: true, email: true, phone: true } },
    },
  });

  return matches.map((m) => ({
    candidate: m.candidate,
    score: m.score,
    matchedSkills: Array.isArray(m.matchedSkills) ? (m.matchedSkills as unknown[]).filter((x): x is string => typeof x === "string") : [],
    missingSkills: Array.isArray(m.missingSkills) ? (m.missingSkills as unknown[]).filter((x): x is string => typeof x === "string") : [],
    jobRequiredSkills: jobSkills,
    updatedAt: m.updatedAt,
  }));
});

app.get("/jobs/:jobId/candidates", async (req) => {
  const params = z.object({ jobId: z.string().uuid() }).parse(req.params);
  const query = z
    .object({ sort: z.enum(["score_desc", "score_asc"]).optional() })
    .parse((req as any).query ?? {});

  const orderBy = query.sort === "score_asc" ? { score: "asc" as const } : { score: "desc" as const };
  const rows = await prisma.jobCandidateMatch.findMany({
    where: { jobId: params.jobId },
    orderBy,
    select: {
      score: true,
      matchedSkills: true,
      candidate: { select: { id: true, fullName: true, email: true, phone: true } },
    },
  });

  return rows.map((r) => ({
    candidate: r.candidate,
    score: r.score,
    skills: Array.isArray(r.matchedSkills) ? (r.matchedSkills as unknown[]).filter((x): x is string => typeof x === "string") : [],
  }));
});

const port = Number(process.env.APP_PORT || 3001);

app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${port} already in use`);
  }
  process.exit(1);
});
console.log(`Server listening on port ${port}`);
