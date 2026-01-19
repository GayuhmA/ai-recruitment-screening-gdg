import "dotenv/config";
import Fastify from "fastify";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import cors from "@fastify/cors";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "./lib/db.js";
import { putCvObject } from "./lib/s3.js";
import { cvQueue } from "./lib/bullmq.js";

const app = Fastify({ logger: true });

// CORS configuration for frontend access
await app.register(cors, {
  origin: [
    "http://localhost:3000",
    "http://localhost:3003",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3003",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
});

// Rate limiting for smoother experience and resource protection
await app.register(rateLimit, {
  max: 100, // Max requests per timeWindow
  timeWindow: "1 minute", // Time window for rate limiting
  cache: 10000, // Cache size for storing request counts
  allowList: ["127.0.0.1"], // Whitelist localhost for development
  redis: undefined, // Can be configured with Redis for distributed systems
  skipOnError: true, // Continue serving on rate limit errors
  keyGenerator: (req) => req.ip, // Rate limit by IP address
  errorResponseBuilder: (req, context) => ({
    statusCode: 429,
    error: "Too Many Requests",
    message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
    retryAfter: context.ttl,
  }),
});

await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

app.get("/health", async () => ({ ok: true }));

// ========== AUTH ENDPOINTS ==========

// Simple token generation (in production, use JWT)
function generateToken(userId: string): string {
  return Buffer.from(`${userId}:${Date.now()}`).toString('base64');
}

app.post("/auth/register", {
  config: {
    rateLimit: {
      max: 5, // 5 registrations per minute
      timeWindow: "1 minute",
    },
  },
}, async (req, reply) => {
  const body = z.object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }).parse(req.body);

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return reply.code(400).send({
        statusCode: 400,
        error: "Bad Request",
        message: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // Create default organization for new user
    const organization = await prisma.organization.create({
      data: {
        name: `${body.fullName}'s Organization`,
      },
    });

    // Create user
    const user = await prisma.user.create({
      data: {
        fullName: body.fullName,
        email: body.email,
        passwordHash: hashedPassword,
        organizationId: organization.id,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
      },
    });

    // Generate token
    const accessToken = generateToken(user.id);

    return {
      accessToken,
      user,
    };
  } catch (error) {
    req.log.error(error);
    
    // Better error message for debugging
    if (error instanceof z.ZodError) {
      return reply.code(400).send({
        statusCode: 400,
        error: "Validation Error",
        message: error.issues[0].message,
        details: error.issues,
      });
    }
    
    return reply.code(500).send({
      statusCode: 500,
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : "Failed to create user",
    });
  }
});

app.post("/auth/login", {
  config: {
    rateLimit: {
      max: 10, // 10 login attempts per minute
      timeWindow: "1 minute",
    },
  },
}, async (req, reply) => {
  const body = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }).parse(req.body);

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: body.email },
      select: {
        id: true,
        fullName: true,
        email: true,
        passwordHash: true,
        createdAt: true,
      },
    });

    if (!user) {
      return reply.code(401).send({
        statusCode: 401,
        error: "Unauthorized",
        message: "Invalid email or password",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(body.password, user.passwordHash);

    if (!isPasswordValid) {
      return reply.code(401).send({
        statusCode: 401,
        error: "Unauthorized",
        message: "Invalid email or password",
      });
    }

    // Generate token
    const accessToken = generateToken(user.id);

    // Remove password from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      accessToken,
      user: userWithoutPassword,
    };
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({
      statusCode: 500,
      error: "Internal Server Error",
      message: "Failed to login",
    });
  }
});

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
    select: { 
      id: true, 
      title: true, 
      description: true,
      department: true,
      status: true,
      requirements: true, 
      createdAt: true, 
      updatedAt: true,
      _count: {
        select: {
          applications: true
        }
      }
    },
  };

  if (query.cursor) {
    queryOptions.cursor = { id: query.cursor };
    queryOptions.skip = 1;
  }

  const rows = await prisma.job.findMany(queryOptions);

  // Get hired count for each job
  const jobIds = rows.map(job => job.id);
  const hiredCounts = await prisma.application.groupBy({
    by: ['jobId'],
    where: {
      jobId: { in: jobIds },
      status: 'HIRED'
    },
    _count: {
      id: true
    }
  });

  const hiredCountMap = new Map(hiredCounts.map(h => [h.jobId, h._count.id]));

  // Add hired count and extract required skills to each job
  const jobsWithStats = rows.map(job => {
    const requirements = job.requirements as any;
    return {
      ...job,
      requiredSkills: requirements?.requiredSkills || [],
      _count: {
        ...job._count,
        hired: hiredCountMap.get(job.id) || 0
      }
    };
  });

  const hasMore = jobsWithStats.length > query.limit;
  const data = hasMore ? jobsWithStats.slice(0, query.limit) : jobsWithStats;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return { data, nextCursor };
});

app.get("/jobs/:jobId", async (req, reply) => {
  const params = z.object({ jobId: z.string().uuid() }).parse(req.params);
  const job = await prisma.job.findUnique({
    where: { id: params.jobId },
    select: { 
      id: true, 
      title: true, 
      description: true,
      department: true,
      status: true,
      requirements: true, 
      createdAt: true, 
      updatedAt: true,
      _count: {
        select: {
          applications: true
        }
      }
    },
  });
  if (!job) return reply.code(404).send({ message: "Job not found" });

  // Get hired count
  const hiredCount = await prisma.application.count({
    where: {
      jobId: params.jobId,
      status: 'HIRED'
    }
  });

  const requirements = job.requirements as any;
  return {
    ...job,
    requiredSkills: requirements?.requiredSkills || [],
    _count: {
      ...job._count,
      hired: hiredCount
    }
  };
});

app.post("/jobs", {
  config: {
    rateLimit: {
      max: 20, // 20 job creations per minute
      timeWindow: "1 minute",
    },
  },
  handler: async (req) => {
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
  },
});

app.patch("/jobs/:jobId", {
  config: {
    rateLimit: {
      max: 30, // 30 updates per minute
      timeWindow: "1 minute",
    },
  },
  handler: async (req, reply) => {
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
  },
});

app.delete("/jobs/:jobId", {
  config: {
    rateLimit: {
      max: 15, // 15 deletions per minute
      timeWindow: "1 minute",
    },
  },
  handler: async (req, reply) => {
    const params = z.object({ jobId: z.string().uuid() }).parse(req.params);
  
  const exists = await prisma.job.findUnique({ where: { id: params.jobId } });
  if (!exists) return reply.code(404).send({ message: "Job not found" });

  await prisma.job.delete({ where: { id: params.jobId } });
  return { message: "Job deleted successfully" };
  },
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
    include: {
      applications: {
        include: {
          job: {
            select: { id: true, title: true, department: true }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 1, // Get most recent application
      }
    }
  };

  if (query.cursor) {
    queryOptions.cursor = { id: query.cursor };
    queryOptions.skip = 1;
  }

  const rows = await prisma.candidateProfile.findMany(queryOptions);

  // Get match scores for candidates
  const candidateIds = rows.map(c => c.id);
  const matches = await prisma.jobCandidateMatch.findMany({
    where: { candidateProfileId: { in: candidateIds } },
    select: {
      candidateProfileId: true,
      score: true,
      matchedSkills: true,
    },
    orderBy: { updatedAt: 'desc' }
  });

  const matchMap = new Map(matches.map(m => [m.candidateProfileId, m]));

  // Transform data with match scores and skills
  const transformedRows = rows.map(candidate => {
    const match = matchMap.get(candidate.id);
    const matchedSkills = match?.matchedSkills as string[] || [];
    
    return {
      id: candidate.id,
      name: candidate.fullName,
      email: candidate.email,
      phone: candidate.phone,
      createdAt: candidate.createdAt,
      skills: matchedSkills,
      applications: candidate.applications.map(app => ({
        id: app.id,
        status: app.status,
        createdAt: app.createdAt,
        matchScore: match?.score || 0,
        job: app.job
      }))
    };
  });

  const hasMore = transformedRows.length > query.limit;
  const data = hasMore ? transformedRows.slice(0, query.limit) : transformedRows;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return { data, nextCursor };
});

app.get("/candidates/:candidateId", async (req, reply) => {
  const params = z.object({ candidateId: z.string().uuid() }).parse(req.params);
  
  const candidate = await prisma.candidateProfile.findUnique({
    where: { id: params.candidateId },
    select: { 
      id: true, 
      fullName: true, 
      email: true, 
      phone: true, 
      createdAt: true,
    },
  });
  
  if (!candidate) return reply.code(404).send({ message: "Candidate not found" });
  
  // Get all applications for this candidate
  const applications = await prisma.application.findMany({
    where: { candidateProfileId: params.candidateId },
    include: {
      job: {
        select: { id: true, title: true, department: true, status: true }
      },
    },
    orderBy: { createdAt: "desc" },
  });
  
  // Get match scores for each application
  const matches = await prisma.jobCandidateMatch.findMany({
    where: { candidateProfileId: params.candidateId },
    select: {
      jobId: true,
      score: true,
      matchedSkills: true,
      missingSkills: true,
    },
  });
  
  const matchMap = new Map(matches.map(m => [m.jobId, m]));
  
  const applicationsWithScores = applications.map(app => {
    const match = matchMap.get(app.jobId);
    return {
      id: app.id,
      jobId: app.jobId,
      status: app.status,
      createdAt: app.createdAt,
      job: app.job,
      matchScore: match?.score ?? 0,
      matchedSkills: match?.matchedSkills ?? [],
      missingSkills: match?.missingSkills ?? [],
    };
  });
  
  return {
    id: candidate.id,
    name: candidate.fullName,
    email: candidate.email,
    phone: candidate.phone,
    createdAt: candidate.createdAt,
    applications: applicationsWithScores,
  };
});

app.post("/candidates", {
  config: {
    rateLimit: {
      max: 20, // 20 candidate creations per minute
      timeWindow: "1 minute",
    },
  },
  handler: async (req) => {
    const body = z.object({
    fullName: z.string().min(2),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }).parse(req.body);

  const candidate = await prisma.candidateProfile.create({
    data: { organizationId: ORG_ID, ...body },
  });
  return candidate;
  },
});

app.patch("/candidates/:candidateId", {
  config: {
    rateLimit: {
      max: 30, // 30 updates per minute
      timeWindow: "1 minute",
    },
  },
  handler: async (req, reply) => {
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
  },
});

app.delete("/candidates/:candidateId", {
  config: {
    rateLimit: {
      max: 15, // 15 deletions per minute
      timeWindow: "1 minute",
    },
  },
  handler: async (req, reply) => {
    const params = z.object({ candidateId: z.string().uuid() }).parse(req.params);
  
  const exists = await prisma.candidateProfile.findUnique({ where: { id: params.candidateId } });
  if (!exists) return reply.code(404).send({ message: "Candidate not found" });

  await prisma.candidateProfile.delete({ where: { id: params.candidateId } });
  return { message: "Candidate deleted successfully" };  },});

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

app.post("/jobs/:jobId/applications", {
  config: {
    rateLimit: {
      max: 25, // 25 applications per minute
      timeWindow: "1 minute",
    },
  },
  handler: async (req) => {
    const params = z.object({ jobId: z.string().uuid() }).parse(req.params);
  const body = z.object({ candidateProfileId: z.string().uuid() }).parse(req.body);

  const application = await prisma.application.create({
    data: {
      jobId: params.jobId,
      candidateProfileId: body.candidateProfileId,
    },
  });
  return application;
  },
});

app.patch("/applications/:applicationId", {
  config: {
    rateLimit: {
      max: 30, // 30 status updates per minute
      timeWindow: "1 minute",
    },
  },
  handler: async (req, reply) => {
    const params = z.object({ applicationId: z.string().uuid() }).parse(req.params);
  const body = z.object({
    status: z.enum(["APPLIED", "IN_REVIEW", "SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED", "REJECTED"]).optional(),
  }).parse(req.body);

  const exists = await prisma.application.findUnique({ where: { id: params.applicationId } });
  if (!exists) return reply.code(404).send({ message: "Application not found" });

  const application = await prisma.application.update({
    where: { id: params.applicationId },
    data: body,
  });
  return application;
  },
});

app.delete("/applications/:applicationId", {
  config: {
    rateLimit: {
      max: 15, // 15 deletions per minute
      timeWindow: "1 minute",
    },
  },
  handler: async (req, reply) => {
    const params = z.object({ applicationId: z.string().uuid() }).parse(req.params);
  
  const exists = await prisma.application.findUnique({ where: { id: params.applicationId } });
  if (!exists) return reply.code(404).send({ message: "Application not found" });

  await prisma.application.delete({ where: { id: params.applicationId } });
  return { message: "Application deleted successfully" };
  },
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
      extractedText: true,
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
  
  // Return with extractedText preview for detail view
  return {
    ...cv,
    extractedTextPreview: cv.extractedText ? cv.extractedText.slice(0, 500) : null,
    extractedTextLength: cv.extractedText?.length ?? 0,
  };
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

app.post("/applications/:applicationId/cv", {
  config: {
    rateLimit: {
      max: 10, // Only 10 CV uploads per minute per IP
      timeWindow: "1 minute",
    },
  },
  handler: async (req, reply) => {
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
  },
});

app.delete("/cvs/:cvId", {
  config: {
    rateLimit: {
      max: 15, // 15 CV deletions per minute
      timeWindow: "1 minute",
    },
  },
  handler: async (req, reply) => {
    const params = z.object({ cvId: z.string().uuid() }).parse(req.params);
  
  const cv = await prisma.cvDocument.findUnique({ where: { id: params.cvId }, select: { storageKey: true } });
  if (!cv) return reply.code(404).send({ message: "CV not found" });

  // TODO: Delete from MinIO/S3 if needed
  // await deleteObjectFromS3(cv.storageKey);

  await prisma.cvDocument.delete({ where: { id: params.cvId } });
  return { message: "CV deleted successfully" };
  },
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

app.get("/jobs/:jobId/candidates", async (req, reply) => {
  try {
    const params = z.object({ jobId: z.string().uuid() }).parse(req.params);
    const query = z
      .object({ sort: z.enum(["score_desc", "score_asc"]).optional() })
      .parse((req as any).query ?? {});

    // Get all applications for this job (including those still processing)
    const applications = await prisma.application.findMany({
      where: { jobId: params.jobId },
      include: {
        candidate: {
          select: { id: true, fullName: true, email: true, phone: true }
        },
        cvDocuments: {
          select: { id: true, status: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    // Get match scores
    const matches = await prisma.jobCandidateMatch.findMany({
      where: { jobId: params.jobId },
      select: {
        candidateProfileId: true,
        score: true,
        matchedSkills: true,
        missingSkills: true,
        aiExplanation: true,
      },
    });

    const matchMap = new Map(matches.map(m => [m.candidateProfileId, m]));

    const result = applications.map((app) => {
      const match = matchMap.get(app.candidateProfileId);
      const cvDoc = app.cvDocuments[0];
      const cvStatus = cvDoc?.status;
      
      return {
        candidate: {
          id: app.candidate.id,
          name: app.candidate.fullName,
          email: app.candidate.email,
          phone: app.candidate.phone,
        },
        application: {
          id: app.id,
          status: app.status,
          createdAt: app.createdAt,
        },
        matchScore: match?.score ?? 0,
        matchedSkills: match?.matchedSkills ?? [],
        missingSkills: match?.missingSkills ?? [],
        aiExplanation: match?.aiExplanation ?? null,
        cvStatus: cvStatus,
      };
    });

    // Sort by score if requested
    if (query.sort) {
      result.sort((a, b) => {
        return query.sort === "score_asc" 
          ? a.matchScore - b.matchScore 
          : b.matchScore - a.matchScore;
      });
    }

    return { data: result };
  } catch (error) {
    console.error("Error in /jobs/:jobId/candidates:", error);
    reply.status(500).send({ error: "Internal server error", details: error.message });
  }
});

const port = Number(process.env.APP_PORT || 3001);

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${port} already in use`);
  }
  process.exit(1);
});
console.log(`Server listening on port ${port}`);
