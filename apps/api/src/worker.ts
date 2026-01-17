import "dotenv/config";
import { Worker } from "bullmq";
import { prisma } from "./lib/db.js";
import { connection } from "./lib/bullmq.js";
import { extractCvInsights } from "./ai/cv-extract.js";
import { getObjectBuffer } from "./lib/s3.js";
import { extractTextFromPdf } from "./lib/pdf.js";

// Classify error reason for user-friendly display
function classifyFailReason(err: unknown): 
  | "S3_UPLOAD_FAILED" 
  | "PDF_PARSE_FAILED" 
  | "PDF_TEXT_EMPTY"
  | "AI_QUOTA_EXCEEDED" 
  | "AI_RATE_LIMITED" 
  | "AI_AUTH_FAILED"
  | "AI_TIMEOUT" 
  | "AI_FAILED" 
  | "DB_FAILED" 
  | "UNKNOWN" {
  const msg = err instanceof Error ? err.message : String(err);

  // Storage errors
  if (/NoSuchBucket|bucket|S3|MinIO|download/i.test(msg)) return "S3_UPLOAD_FAILED";
  
  // PDF errors
  if (/pdf contains no extractable text|scanned|image-based/i.test(msg)) return "PDF_TEXT_EMPTY";
  if (/pdf|parse|invalid pdf/i.test(msg)) return "PDF_PARSE_FAILED";
  
  // AI errors - specific classification
  if (/quota.*exceeded|exceeded.*quota|429.*quota/i.test(msg)) return "AI_QUOTA_EXCEEDED";
  if (/rate limit|too many requests|429/i.test(msg)) return "AI_RATE_LIMITED";
  if (/unauthorized|invalid.*api.*key|authentication|401|403/i.test(msg)) return "AI_AUTH_FAILED";
  if (/timeout|ETIMEDOUT|deadline|timed out/i.test(msg)) return "AI_TIMEOUT";
  if (/gemini|model|generateContent|extraction failed/i.test(msg)) return "AI_FAILED";
  
  // Database errors
  if (/prisma|database|postgres/i.test(msg)) return "DB_FAILED";
  
  return "UNKNOWN";
}

// Consistent normalization (lowercase + trim)
function norm(s: string): string {
  return s.trim().toLowerCase();
}

function getJobSkillsFromRequirements(requirements: unknown): string[] {
  if (!requirements || typeof requirements !== "object") return [];

  const req = requirements as Record<string, unknown>;
  const raw = (req.requiredSkills ?? req.skills) as unknown;
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((x): x is string => typeof x === "string")
    .map(norm)
    .filter((x) => x.length > 0);
}

// Anti divide-by-zero, consistent normalization
function computeMatchScore(cvSkills: string[], jobSkills: string[]) {
  const job = new Set(jobSkills.map(norm).filter(Boolean));
  if (job.size === 0) return { score: 0, matched: [] as string[], missing: [] as string[] };

  const cv = new Set(cvSkills.map(norm).filter(Boolean));
  const matched = [...job].filter((s) => cv.has(s));
  const missing = [...job].filter((s) => !cv.has(s));
  const score = Math.round((matched.length / job.size) * 100);

  return { score, matched, missing };
}

function fallbackAi(extractedText: string) {
  // very naive skill extraction (keyword based)
  const skillKeywords = [
    "javascript", "typescript", "node", "postgres", "mysql",
    "docker", "kotlin", "flutter", "python", "php", "laravel"
  ];

  const text = extractedText.toLowerCase();
  const skills = skillKeywords.filter(s => text.includes(s));

  const summary =
    extractedText
      .replace(/\s+/g, " ")
      .slice(0, 300)
      .trim() || "Fallback summary (AI unavailable)";

  return {
    skills,
    summary,
    meta: {
      provider: "fallback",
      reason: "AI_UNAVAILABLE",
    },
  };
}

function isAiFailure(reason: string) {
  return [
    "AI_QUOTA_EXCEEDED",
    "AI_RATE_LIMITED",
    "AI_AUTH_FAILED",
    "AI_TIMEOUT",
    "AI_FAILED",
  ].includes(reason);
}


new Worker(
  "cv-processing",
  async (job) => {
    const { cvDocumentId } = job.data as { cvDocumentId: string };

    console.log(`🔄 Processing CV: ${cvDocumentId}`);

    try {
      // 1. Get CV document metadata (storageKey for S3 download)
      const cvDoc = await prisma.cvDocument.findUnique({
        where: { id: cvDocumentId },
        select: { storageKey: true },
      });

      if (!cvDoc) {
        throw new Error("CV document not found");
      }

      // 2. Download PDF from S3 and extract text
      const pdfBuffer = await getObjectBuffer(cvDoc.storageKey);
      const extractedText = await extractTextFromPdf(pdfBuffer);

      if (!extractedText || extractedText.trim().length < 10) {
        // Empty text often means image-based/scanned PDF (needs OCR)
        await prisma.cvDocument.update({
          where: { id: cvDocumentId },
          data: {
            status: "FAILED",
            errorMessage: "PDF contains no extractable text. This may be a scanned/image-based PDF that requires OCR.",
            failReason: "PDF_TEXT_EMPTY",
          },
        });
        throw new Error("PDF text extraction returned empty result");
      }

      await prisma.cvDocument.update({
        where: { id: cvDocumentId },
        data: { extractedText, status: "TEXT_EXTRACTED" },
      });

      // 3. Call Gemini for structured extraction
      const { skills, summary } = await extractCvInsights(extractedText);

      await prisma.aiOutput.create({
        data: {
          cvDocumentId,
          type: "SKILLS",
          outputJson: { skills },
          modelMeta: { provider: "gemini", model: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp" },
        },
      });

      await prisma.aiOutput.create({
        data: {
          cvDocumentId,
          type: "SUMMARY",
          outputJson: { summary },
          modelMeta: { provider: "gemini", model: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp" },
        },
      });

      // 4. Deterministic matching score
      const cv = await prisma.cvDocument.findUnique({
        where: { id: cvDocumentId },
        select: {
          application: {
            select: {
              jobId: true,
              candidateProfileId: true,
              job: { select: { requirements: true } },
            },
          },
        },
      });

      const app = cv?.application;
      if (app) {
        const jobSkills = getJobSkillsFromRequirements(app.job.requirements);
        const { score, matched, missing } = computeMatchScore(skills, jobSkills);

        await prisma.jobCandidateMatch.upsert({
          where: {
            jobId_candidateProfileId: {
              jobId: app.jobId,
              candidateProfileId: app.candidateProfileId,
            },
          },
          create: {
            jobId: app.jobId,
            candidateProfileId: app.candidateProfileId,
            score,
            matchedSkills: matched,
            missingSkills: missing,
          },
          update: {
            score,
            matchedSkills: matched,
            missingSkills: missing,
          },
        });
      }

      // 5. Mark as done
      await prisma.cvDocument.update({
        where: { id: cvDocumentId },
        data: { status: "AI_DONE" },
      });

      return { ok: true };
    } catch (err) {
      // Robust error handling with classified reason
      const failReason = classifyFailReason(err);
      const errorMessage = err instanceof Error ? err.message : String(err);

      console.error(`❌ CV processing failed for ${cvDocumentId}:`, errorMessage);

      // === AI FAILURE → FALLBACK ===
      if (isAiFailure(failReason)) {
        const cv = await prisma.cvDocument.findUnique({
          where: { id: cvDocumentId },
          select: {
            extractedText: true,
            application: {
              select: {
                jobId: true,
                candidateProfileId: true,
                job: { select: { requirements: true } },
              },
            },
          },
        });

        const extractedText = cv?.extractedText ?? "";
        const { skills, summary, meta } = fallbackAi(extractedText);

        await prisma.aiOutput.create({
          data: {
            cvDocumentId,
            type: "SKILLS",
            outputJson: { skills },
            modelMeta: meta,
          },
        });

        await prisma.aiOutput.create({
          data: {
            cvDocumentId,
            type: "SUMMARY",
            outputJson: { summary },
            modelMeta: meta,
          },
        });

        // deterministic matching tetap jalan
        if (cv?.application) {
          const jobSkills = getJobSkillsFromRequirements(
            cv.application.job.requirements
          );
          const { score, matched, missing } = computeMatchScore(skills, jobSkills);

          await prisma.jobCandidateMatch.upsert({
            where: {
              jobId_candidateProfileId: {
                jobId: cv.application.jobId,
                candidateProfileId: cv.application.candidateProfileId,
              },
            },
            create: {
              jobId: cv.application.jobId,
              candidateProfileId: cv.application.candidateProfileId,
              score,
              matchedSkills: matched,
              missingSkills: missing,
            },
            update: {
              score,
              matchedSkills: matched,
              missingSkills: missing,
            },
          });
        }

        await prisma.cvDocument.update({
          where: { id: cvDocumentId },
          data: {
            status: "AI_DONE",
            errorMessage,   // disimpan sebagai warning
            failReason,     // info kenapa fallback
          },
        });

        return { ok: true, fallback: true };
      }

      // === NON-AI FAILURE (tetap FAILED) ===
      await prisma.cvDocument.update({
        where: { id: cvDocumentId },
        data: {
          status: "FAILED",
          errorMessage,
          failReason,
        },
      });

      throw err;
    }
  },
  { connection }
);

console.log("✅ Worker started. Waiting for jobs in queue: cv-processing");
