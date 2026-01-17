-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CvFailReason" ADD VALUE 'PDF_TEXT_EMPTY';
ALTER TYPE "CvFailReason" ADD VALUE 'AI_QUOTA_EXCEEDED';
ALTER TYPE "CvFailReason" ADD VALUE 'AI_RATE_LIMITED';
ALTER TYPE "CvFailReason" ADD VALUE 'AI_AUTH_FAILED';
