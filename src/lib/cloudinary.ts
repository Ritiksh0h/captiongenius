import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_API_SECRET,
  secure:      true,
});

export { cloudinary };

export async function uploadToCloudinary(params: {
  buffer:      Buffer;
  folder:      string;
  filename:    string;
  contentType: string;
}): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder:        `captiongenius/${params.folder}`,
        public_id:     params.filename.replace(/\.[^.]+$/, ""),
        resource_type: "image",
        overwrite:     false,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    uploadStream.end(params.buffer);
  });
}

export async function fetchFromCloudinaryAsBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Cloudinary fetch failed: ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}

export async function listCloudinaryFolder(folder: string): Promise<
  { publicId: string; url: string; createdAt: Date }[]
> {
  const result = await cloudinary.api.resources({
    type:          "upload",
    prefix:        `captiongenius/${folder}`,
    resource_type: "image",
    max_results:   500,
  });

  return (result.resources || []).map((r: any) => ({
    publicId:  r.public_id,
    url:       r.secure_url,
    createdAt: new Date(r.created_at),
  }));
}

export async function listUploadFolders(): Promise<string[]> {
  try {
    const result = await cloudinary.api.sub_folders("captiongenius/uploads");
    return (result.folders || []).map((f: any) => f.name as string);
  } catch {
    return [];
  }
}
