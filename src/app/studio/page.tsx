"use client";

import { useRouter } from "next/navigation";
import { CaptionStudio } from "@/components/studio/caption-studio";

export default function StudioPage() {
  const router = useRouter();

  return (
    <CaptionStudio
      photoUrl="/photo-dog.png"
      folderId="demo-folder"
      onBack={() => router.push("/")}
      photos={[
        { url: "/photo-dog.png", name: "golden-run.png" },
        { url: "/photo-coffee.png", name: "morning-brew.png" },
        { url: "/photo-dish.png", name: "brunch-plate.png" },
        { url: "/photo-travel.png", name: "cliff-view.png" },
      ]}
    />
  );
}
