"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { CaptionStudio } from "@/components/studio/caption-studio";
import Loading from "@/components/Loading";

type Props = { params: { id: string } };

export default function GenerateCaptionPage({ params: { id } }: Props) {
  const [photos,     setPhotos]     = useState<{ url: string; name: string }[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const router                      = useRouter();
  const { status }                  = useSession();

  useEffect(() => {
    if (!id) { router.push("/"); return; }

    fetch(`/api/image?folderId=${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Folder not found");
        return r.json();
      })
      .then((data) => {
        const images:    string[] = data.images    || [];
        const imageUrls: string[] = data.imageUrls || [];

        if (!images.length) throw new Error("No images found");

        // Use R2 public URLs for display; fall back to constructed URL if needed
        setPhotos(
          images.map((filename: string, i: number) => ({
            url:  imageUrls[i] || `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/uploads/${id}/${filename}`,
            name: filename,
          }))
        );
      })
      .catch(() => setError("Could not load images. Please upload again."))
      .finally(() => setIsLoading(false));
  }, [id, router]);

  if (isLoading || status === "loading") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loading
          sequence={["Loading your images…", 2000]}
          textColor="lime"
          value={50}
          progressColor="primary"
        />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center space-y-4 px-6">
          <p className="text-2xl text-[#F7F6F1] font-display font-bold">
            Sign in to generate captions
          </p>
          <p className="text-sm text-[#6B6F76]">
            Your photo is ready. Just sign in to continue.
          </p>
          <button
            onClick={() => signIn("google")}
            className="px-6 py-3 rounded-full bg-lime text-ink font-semibold
              hover:scale-[1.03] transition-transform"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <p className="text-xl text-[#F7F6F1]">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 rounded-full bg-lime text-ink font-semibold hover:scale-[1.03] transition-transform"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (!photos.length) return null;

  return (
    <CaptionStudio
      photoUrl={photos[0].url}
      folderId={id}
      onBack={() => router.push("/")}
      photos={photos}
    />
  );
}
