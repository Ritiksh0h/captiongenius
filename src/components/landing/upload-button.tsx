"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { ImageIcon, Check, Loader2 } from "lucide-react";
import { compressFile } from "@/lib/fileCompressor";
import { toast } from "sonner";

/**
 * Convert HEIC/HEIF → JPEG using the browser's native image decoder (Canvas API).
 *
 * Why Canvas instead of heic2any:
 *   heic2any bundles libheif.wasm which only supports a subset of HEIC profiles.
 *   Newer iPhones use profiles it can't parse → ERR_LIBHEIF format not supported.
 *
 * The Canvas approach delegates decoding to the browser's own codec:
 *   • Safari / Chrome on macOS/iOS → native HEIC support → always works
 *   • Chrome/Firefox on Windows/Linux → no native HEIC → img.onerror fires,
 *     we show a clear message asking the user to convert first
 *
 * In practice, HEIC files originate from Apple devices where Safari or
 * Chrome-on-Mac are the browsers in use, so this covers the real-world case.
 */
async function normalizeHeic(file: File): Promise<File> {
  const isHeic =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.(heic|heif)$/i.test(file.name);

  if (!isHeic) return file;

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas unavailable — please try a JPEG or PNG instead."));
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) {
            reject(new Error("HEIC conversion failed — try exporting as JPEG from the Photos app."));
            return;
          }
          const newName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
          resolve(new File([blob], newName, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.9
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(
        "Your browser can't open this HEIC file. " +
        "On iPhone: tap the photo → Share → Save as JPEG. " +
        "On Mac: open in Preview → Export as JPEG."
      ));
    };

    img.src = url;
  });
}

export function UploadButton({ full = false }: { full?: boolean }) {
  const inputRef          = useRef<HTMLInputElement>(null);
  const router            = useRouter();
  const { data: session } = useSession();
  const [fileName,    setFileName]    = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsUploading(true);

    try {
      // 1. Convert HEIC → JPEG if needed (uses native browser decoder)
      const normalized = await normalizeHeic(file);

      // 2. Compress — skip gracefully if the codec can't load the image
      let fileToUpload: File | Blob = normalized;
      try {
        fileToUpload = await compressFile(normalized);
      } catch {
        console.warn("[upload-button] Compression skipped — uploading as-is");
      }

      // 3. Upload
      const formData = new FormData();
      formData.append("image", fileToUpload, normalized.name);

      const res = await fetch("/api/upload-image", { method: "POST", body: formData });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Upload failed (${res.status})`);
      }

      const data = await res.json();
      // Keep isUploading=true through the page transition
      router.push(`/generate-caption/${data.uniqueFolderName}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed. Please try again.";
      console.error("[upload-button]", err);
      toast.error(msg);
      setFileName(null);
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleClick() {
    if (!session) {
      signIn("google");
      return;
    }
    inputRef.current?.click();
  }

  return (
    <div className={full ? "w-full" : ""}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="sr-only"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={isUploading}
        className={`group inline-flex items-center justify-center gap-2 rounded-full
          bg-lime px-7 py-3.5 font-display text-base font-bold text-lime-foreground
          shadow-lg shadow-lime/20 transition-transform hover:scale-[1.03] active:scale-95
          disabled:opacity-80 disabled:cursor-not-allowed ${full ? "w-full" : ""}`}
      >
        {isUploading ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            Uploading…
          </>
        ) : fileName ? (
          <>
            <Check className="size-5" />
            {fileName.length > 18 ? fileName.slice(0, 18) + "…" : fileName}
          </>
        ) : (
          <>
            <ImageIcon className="size-5" />
            {session ? "Upload a photo" : "Sign in to start"}
          </>
        )}
      </button>
    </div>
  );
}
