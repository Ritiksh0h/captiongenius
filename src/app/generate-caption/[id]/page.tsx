"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { CaptionStudio } from "@/components/studio/caption-studio";
import Loading from "@/components/Loading";

type Props = { params: { id: string } };

export default function GenerateCaptionPage({ params: { id } }: Props) {
  const [images, setImages]   = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const router                = useRouter();
  const { status }            = useSession();

  useEffect(() => {
    if (!id) { router.push("/"); return; }

    fetch(`/api/image?folderId=${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Folder not found");
        return r.json();
      })
      .then((data) => {
        if (!data.images?.length) throw new Error("No images found");
        setImages(data.images);
      })
      .catch(() => setError("Could not load images. Please upload again."))
      .finally(() => setIsLoading(false));
  }, [id, router]);

  // Show spinner while session or images are loading
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

  // Session resolved — show sign-in prompt for unauthenticated users
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

  if (!images.length) return null;

  return (
    <CaptionStudio
      photoUrl={`/uploads/${id}/${images[0]}`}
      folderId={id}
      onBack={() => router.push("/")}
      photos={images.map((img) => ({
        url: `/uploads/${id}/${img}`,
        name: img,
      }))}
    />
  );
}
