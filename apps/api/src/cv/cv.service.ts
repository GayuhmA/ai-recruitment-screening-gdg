import { Injectable } from '@nestjs/common';
import { prisma } from '../lib/db';
import { getPresignedDownloadUrl } from '../lib/s3';

@Injectable()
export class CvService {
  async getDownloadUrl(cvId: string): Promise<{ url: string; filename: string } | null> {
    // Get CV document from database
    const cvDoc = await prisma.cvDocument.findUnique({
      where: { id: cvId },
      include: {
        application: {
          include: {
            candidate: true,
          },
        },
      },
    });

    if (!cvDoc) {
      return null;
    }

    // Generate presigned URL (expires in 1 hour)
    const presignedUrl = await getPresignedDownloadUrl(cvDoc.storageKey, 3600);

    // Generate friendly filename
    const candidateName = cvDoc.application.candidate.fullName
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase();
    const timestamp = new Date(cvDoc.createdAt).toISOString().split('T')[0];
    const filename = `cv_${candidateName}_${timestamp}.pdf`;

    return {
      url: presignedUrl,
      filename,
    };
  }
}
