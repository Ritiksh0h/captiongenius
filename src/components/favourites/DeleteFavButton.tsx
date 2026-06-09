"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function DeleteFavButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/favourites/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Removed from favourites");
        router.refresh();
      }
    } catch {
      toast.error("Could not remove favourite");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="rounded-md border border-[#1a1a1a] p-1.5 text-[#6B6F76]
        opacity-0 group-hover:opacity-100 transition-all
        hover:border-[#FF5A3C]/40 hover:text-[#FF5A3C]
        disabled:opacity-30"
      aria-label="Remove from favourites"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
