import "dotenv/config";
import { Worker } from "bullmq";
import { prisma } from "./lib/db.js";
import { connection } from "./lib/bullmq.js";
import { extractCvInsights } from "./ai/cv-extract.js";
import { getObjectBuffer } from "./lib/s3.js";
import { extractTextFromPdf } from "./lib/pdf.js";

// Classify error reason for user-friendly display
function classifyFailReason(err: unknown): "S3_UPLOAD_FAILED" | "PDF_PARSE_FAILED" | "AI_TIMEOUT" | "AI_FAILED" | "DB_FAILED" | "UNKNOWN" {
  const msg = err instanceof Error ? err.message : String(err);

  if (/NoSuchBucket|bucket|S3|MinIO|download/i.test(msg)) return "S3_UPLOAD_FAILED";
  if (/pdf|parse|invalid pdf/i.test(msg)) return "PDF_PARSE_FAILED";
  if (/timeout|ETIMEDOUT|deadline/i.test(msg)) return "AI_TIMEOUT";
  if (/gemini|model|generateContent|extraction failed/i.test(msg)) return "AI_FAILED";
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

new Worker(
  "cv-processing",
  async (job) => {
    const { cvDocumentId } = job.data as { cvDocumentId: string };

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

      if (!extractedText || extractedText.length < 10) {
        throw new Error("PDF parsing returned empty text (possible scan/image-based PDF)");
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
      const errorMessage = err instanceof Error ? err.message : String(err);
      const failReason = classifyFailReason(err);

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
