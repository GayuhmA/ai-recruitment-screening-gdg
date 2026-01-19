-- AlterEnum
ALTER TYPE "AiOutputType" ADD VALUE 'CV_PROFILE';

-- AlterTable
ALTER TABLE "JobCandidateMatch" ADD COLUMN     "aiExplanation" TEXT;
