"use node";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

/**
 * 📦 Sovereign Storage Utility (Cloudflare R2 / S3)
 * Handles production-grade media uploads for the cinematic pipeline.
 */
const s3Client = new S3Client({
  region: "auto", // R2 uses 'auto'
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});
const BUCKET_NAME = "bookflix-renders-production";
export async function uploadToStorage(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  prefix: string = "assets"
): Promise<string> {
  const key = `${prefix}/${Date.now()}-${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });
  try {
    await s3Client.send(command);
    
    // Construct the public/CDN URL
    // If using a custom domain, this would be updated.
    const baseUrl = process.env.R2_PUBLIC_URL || `https://${BUCKET_NAME}.s3.amazonaws.com`;
    return `${baseUrl}/${key}`;
  } catch (error) {
    console.error("❌ Storage: Upload Failed", error);
    throw new Error(`Failed to upload ${fileName} to sovereign storage.`);
  }
}
