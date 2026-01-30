import 'dotenv/config';
import { Worker } from 'bullmq';
import { prisma } from './lib/db.js';
import { getConnection } from './lib/bullmq.js';
import {
  parseCvWithAI,
  parseCvFallback,
  type CvProfile,
} from './ai/cv-parser.js';
import {
  generateContextualSummary,
  performSmartMatching,
} from './ai/smart-matcher.js';
import { getObjectBuffer } from './lib/s3.js';
import { extractTextFromPdf } from './lib/pdf.js';

// Classify error reason for user-friendly display
function classifyFailReason(
  err: unknown,
):
  | 'S3_UPLOAD_FAILED'
  | 'PDF_PARSE_FAILED'
  | 'PDF_TEXT_EMPTY'
  | 'AI_QUOTA_EXCEEDED'
  | 'AI_RATE_LIMITED'
  | 'AI_AUTH_FAILED'
  | 'AI_TIMEOUT'
  | 'AI_FAILED'
  | 'DB_FAILED'
  | 'UNKNOWN' {
  const msg = err instanceof Error ? err.message : String(err);

  // Storage errors
  if (/NoSuchBucket|bucket|S3|MinIO|download/i.test(msg))
    return 'S3_UPLOAD_FAILED';

  // PDF errors
  if (/pdf contains no extractable text|scanned|image-based/i.test(msg))
    return 'PDF_TEXT_EMPTY';
  if (/pdf|parse|invalid pdf/i.test(msg)) return 'PDF_PARSE_FAILED';

  // AI errors - specific classification
  if (/quota.*exceeded|exceeded.*quota|429.*quota/i.test(msg))
    return 'AI_QUOTA_EXCEEDED';
  if (/rate limit|too many requests|429/i.test(msg)) return 'AI_RATE_LIMITED';
  if (/unauthorized|invalid.*api.*key|authentication|401|403/i.test(msg))
    return 'AI_AUTH_FAILED';
  if (/timeout|ETIMEDOUT|deadline|timed out/i.test(msg)) return 'AI_TIMEOUT';
  if (/gemini|model|generateContent|extraction failed/i.test(msg))
    return 'AI_FAILED';

  // Database errors
  if (/prisma|database|postgres/i.test(msg)) return 'DB_FAILED';

  return 'UNKNOWN';
}

// Consistent normalization (lowercase + trim)
function norm(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Extract required skills from job requirements JSON
 */
function getJobSkillsFromRequirements(requirements: unknown): string[] {
  if (!requirements || typeof requirements !== 'object') return [];

  const req = requirements as Record<string, unknown>;
  const raw = (req.requiredSkills ?? req.skills) as unknown;
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((x): x is string => typeof x === 'string')
    .map(norm)
    .filter((x) => x.length > 0);
}

/**
 * Get job details for context-aware processing
 */
async function getJobDetails(jobId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      title: true,
      department: true,
      description: true,
      requirements: true,
    },
  });

  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  return {
    title: job.title,
    department: job.department || 'General',
    description: job.description,
    requiredSkills: getJobSkillsFromRequirements(job.requirements),
  };
}

function isAiFailure(reason: string) {
  return [
    'AI_QUOTA_EXCEEDED',
    'AI_RATE_LIMITED',
    'AI_AUTH_FAILED',
    'AI_TIMEOUT',
    'AI_FAILED',
  ].includes(reason);
}

new Worker(
  'cv-processing',
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
        throw new Error('CV document not found');
      }

      // 2. Download PDF from S3 and extract text
      const pdfBuffer = await getObjectBuffer(cvDoc.storageKey);
      const extractedText = await extractTextFromPdf(pdfBuffer);

      if (!extractedText || extractedText.trim().length < 10) {
        // Empty text often means image-based/scanned PDF (needs OCR)
        await prisma.cvDocument.update({
          where: { id: cvDocumentId },
          data: {
            status: 'FAILED',
            errorMessage:
              'PDF contains no extractable text. This may be a scanned/image-based PDF that requires OCR.',
            failReason: 'PDF_TEXT_EMPTY',
          },
        });
        throw new Error('PDF text extraction returned empty result');
      }

      await prisma.cvDocument.update({
        where: { id: cvDocumentId },
        data: { extractedText, status: 'TEXT_EXTRACTED' },
      });

      // 3. PHASE 1: Parse CV with AI (comprehensive extraction)
      let cvProfile: CvProfile;
      let usedFallback = false;

      try {
        cvProfile = await parseCvWithAI(extractedText);
        console.log(`✅ AI parsing successful for CV ${cvDocumentId}`);
      } catch (aiError) {
        console.warn(`⚠️ AI parsing failed, using fallback:`, aiError);
        cvProfile = parseCvFallback(extractedText);
        usedFallback = true;
      }

      // Store comprehensive CV profile
      await prisma.aiOutput.create({
        data: {
          cvDocumentId,
          type: 'CV_PROFILE',
          outputJson: cvProfile as any,
          modelMeta: {
            provider: usedFallback ? 'fallback' : 'gemini',
            model: usedFallback
              ? 'keyword-extraction'
              : process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
          },
        },
      });

      // 4. Get job details for context-aware processing
      const cv = await prisma.cvDocument.findUnique({
        where: { id: cvDocumentId },
        select: {
          application: {
            select: {
              jobId: true,
              candidateProfileId: true,
            },
          },
        },
      });

      const app = cv?.application;
      if (!app) {
        throw new Error('Application not found for this CV');
      }

      const jobDetails = await getJobDetails(app.jobId);

      // 5. PHASE 2: Generate context-aware summary
      let contextualSummary: string;
      let keyHighlights: string[];
      let relevanceScore: number;

      if (!usedFallback) {
        try {
          const summaryResult = await generateContextualSummary(
            cvProfile,
            jobDetails,
          );
          contextualSummary = summaryResult.contextualSummary;
          keyHighlights = summaryResult.keyHighlights;
          relevanceScore = summaryResult.relevanceScore;
          console.log(
            `✅ Context-aware summary generated for CV ${cvDocumentId}`,
          );
        } catch (summaryError) {
          console.warn(
            `⚠️ Summary generation failed, using generic:`,
            summaryError,
          );
          contextualSummary = cvProfile.professionalSummary;
          keyHighlights = cvProfile.skills.technical.slice(0, 5);
          relevanceScore = 50;
        }
      } else {
        // Use fallback summary
        contextualSummary = cvProfile.professionalSummary;
        keyHighlights = cvProfile.skills.technical.slice(0, 5);
        relevanceScore = 30; // Lower score for fallback
      }

      await prisma.aiOutput.create({
        data: {
          cvDocumentId,
          type: 'SUMMARY',
          outputJson: {
            contextualSummary,
            keyHighlights,
            relevanceScore,
          } as any,
          modelMeta: {
            provider: usedFallback ? 'fallback' : 'gemini',
            model: usedFallback
              ? 'basic-template'
              : process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
          },
        },
      });

      // 6. PHASE 3: Smart skill matching with AI
      let matchScore: number;
      let matchedSkills: string[];
      let missingSkills: string[];
      let matchExplanation: string | undefined;

      if (!usedFallback && jobDetails.requiredSkills.length > 0) {
        try {
          const smartMatch = await performSmartMatching(
            cvProfile.skills.technical,
            jobDetails.requiredSkills,
          );
          matchScore = smartMatch.overallMatchScore;
          matchedSkills = [
            ...smartMatch.exactMatches,
            ...smartMatch.similarMatches.map((m) => m.candidateSkill),
          ];
          missingSkills = smartMatch.missingCritical;
          matchExplanation = smartMatch.matchExplanation;
          console.log(`✅ Smart matching completed: ${matchScore}% match`);
        } catch (matchError) {
          console.warn(`⚠️ Smart matching failed, using basic:`, matchError);
          // Fallback to basic exact matching
          const candidateSkillSet = new Set(
            cvProfile.skills.technical.map(norm),
          );
          const jobSkillsNorm = jobDetails.requiredSkills.map(norm);
          matchedSkills = jobSkillsNorm.filter((s) => candidateSkillSet.has(s));
          missingSkills = jobSkillsNorm.filter(
            (s) => !candidateSkillSet.has(s),
          );
          matchScore =
            jobSkillsNorm.length > 0
              ? Math.round((matchedSkills.length / jobSkillsNorm.length) * 100)
              : 0;
        }
      } else {
        // Basic matching for fallback mode
        const candidateSkillSet = new Set(cvProfile.skills.technical.map(norm));
        const jobSkillsNorm = jobDetails.requiredSkills.map(norm);
        matchedSkills = jobSkillsNorm.filter((s) => candidateSkillSet.has(s));
        missingSkills = jobSkillsNorm.filter((s) => !candidateSkillSet.has(s));
        matchScore =
          jobSkillsNorm.length > 0
            ? Math.round((matchedSkills.length / jobSkillsNorm.length) * 100)
            : 0;
      }

      // Store match result with AI explanation
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
          score: matchScore,
          matchedSkills,
          missingSkills,
          aiExplanation: matchExplanation,
        },
        update: {
          score: matchScore,
          matchedSkills,
          missingSkills,
          aiExplanation: matchExplanation,
        },
      });

      // 7. Mark as done
      await prisma.cvDocument.update({
        where: { id: cvDocumentId },
        data: { status: 'AI_DONE' },
      });

      return { ok: true };
    } catch (err) {
      // Robust error handling with classified reason
      const failReason = classifyFailReason(err);
      const errorMessage = err instanceof Error ? err.message : String(err);

      console.error(
        `❌ CV processing failed for ${cvDocumentId}:`,
        errorMessage,
      );

      // === NON-AI FAILURE (tetap FAILED) ===
      await prisma.cvDocument.update({
        where: { id: cvDocumentId },
        data: {
          status: 'FAILED',
          errorMessage,
          failReason,
        },
      });

      throw err;
    }
  },
  { connection: getConnection() },
);

console.log('✅ Worker started. Waiting for jobs in queue: cv-processing');
