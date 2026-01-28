import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";

export const s3 = new S3Client({
    region: process.env.S3_REGION!,
    endpoint: process.env.S3_ENDPOINT!,
    forcePathStyle,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || process.env.S3_SECRET_KEY!,
    },
});

export async function putCvObject(fileBuffer: Buffer, mimeType: string) {
    const key = `cvs/${new Date().toISOString().slice(0, 10)}/${randomUUID()}`;
    await s3.send(
        new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
        })
    );
    return key;
}

export async function getObjectBuffer(key: string): Promise<Buffer> {
    try {
        const response = await s3.send(
            new GetObjectCommand({
                Bucket: process.env.S3_BUCKET!,
                Key: key,
            })
        );

        if (!response.Body) {
            throw new Error("S3 object body is empty");
        }

        // Convert ReadableStream to Buffer
        const chunks: Uint8Array[] = [];
        for await (const chunk of response.Body as any) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);
    } catch (err) {
        throw new Error(`S3 download failed: ${err instanceof Error ? err.message : String(err)}`);
    }
}

/**
 * Generate a presigned URL for downloading a CV from S3
 * @param key S3 object key
 * @param expiresIn URL expiration in seconds (default: 1 hour)
 * @returns Presigned download URL
 */
export async function getPresignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
        const command = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET!,
            Key: key,
        });
        
        const url = await getSignedUrl(s3, command, { expiresIn });
        return url;
    } catch (err) {
        throw new Error(`Failed to generate presigned URL: ${err instanceof Error ? err.message : String(err)}`);
    }
}
