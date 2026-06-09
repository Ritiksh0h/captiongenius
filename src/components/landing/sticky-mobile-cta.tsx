import { UploadButton } from "./upload-button";

export function StickyMobileCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-ink/95 p-4 backdrop-blur md:hidden">
      <UploadButton full />
    </div>
  );
}
