"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { protectAction } from "./arcjet";

/**
 * 🎬 Ingest Engine (AWS S3)
 * Handles high-performance video ingestion.
 */
export const ingestVideo = action({
  args: {
    fileName: v.string(),
    fileType: v.string(),
    fileBase64: v.string(), // Small videos or chunks
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // --- 🛡️ ARCJET PROTECTION ---
    await protectAction(identity.subject, undefined, args.fileName);

    console.log(`[*] Ingesting video: ${args.fileName}`);

    // --- STEP: RUN (S3 UPLOAD) ---
    // Decoupled from component logic for security and reliability.
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error("AWS credentials are not configured properly.");
    }

    const s3 = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const buffer = Buffer.from(args.fileBase64, "base64");
    const bucketName = process.env.AWS_S3_BUCKET_NAME || "bookflix-renders-production";

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: `uploads/${Date.now()}-${args.fileName}`,
      Body: buffer,
      ContentType: args.fileType,
    });

    try {
      await s3.send(command);
      console.log(`[+] Successfully uploaded ${args.fileName} to S3`);
      
      const s3Url = `https://${bucketName}.s3.amazonaws.com/uploads/${args.fileName}`;
      return { success: true, url: s3Url };
    } catch (error) {
      console.error("[!] S3 Upload Failed:", error);
      throw new Error("Failed to upload video to cinematic storage.");
    }
  },
});
