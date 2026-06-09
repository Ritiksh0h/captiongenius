import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

if (process.env.NODE_ENV !== "production") {
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    console.warn("[r2] R2 credentials not set — file operations will fail");
  }
}

export const r2 = new S3Client({
  region:   "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME || "captiongenius-uploads";

/** Upload a file buffer to R2, return its public URL */
export async function uploadToR2(params: {
  key:         string;   // e.g. "uploads/abc123/photo.jpg"
  body:        Buffer;
  contentType: string;
}): Promise<string> {
  await r2.send(
    new PutObjectCommand({
      Bucket:      BUCKET,
      Key:         params.key,
      Body:        params.body,
      ContentType: params.contentType,
    })
  );
  return `${process.env.R2_PUBLIC_URL}/${params.key}`;
}

/** Fetch a file from R2's public URL as a Buffer (for Groq vision base64) */
export async function fetchFromR2AsBuffer(key: string): Promise<Buffer> {
  const url = `${process.env.R2_PUBLIC_URL}/${key}`;
  const res  = await fetch(url);
  if (!res.ok) throw new Error(`R2 fetch failed: ${res.status} for ${key}`);
  return Buffer.from(await res.arrayBuffer());
}

/** Delete a single object from R2 */
export async function deleteFromR2(key: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/** List all object keys under a prefix */
export async function listR2Objects(prefix: string): Promise<string[]> {
  const res = await r2.send(
    new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix })
  );
  return (res.Contents ?? []).map((o) => o.Key!).filter(Boolean);
}
