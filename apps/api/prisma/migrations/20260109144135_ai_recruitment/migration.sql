-- CreateEnum
CREATE TYPE "CvFailReason" AS ENUM ('AI_TIMEOUT', 'AI_FAILED', 'PDF_PARSE_FAILED', 'S3_UPLOAD_FAILED', 'DB_FAILED', 'UNKNOWN');

-- AlterTable
ALTER TABLE "CvDocument" ADD COLUMN     "failReason" "CvFailReason";
