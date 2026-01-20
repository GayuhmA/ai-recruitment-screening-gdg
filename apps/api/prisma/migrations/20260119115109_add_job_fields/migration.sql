-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "department" TEXT,
ADD COLUMN     "employmentType" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'OPEN';

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "Job"("status");
