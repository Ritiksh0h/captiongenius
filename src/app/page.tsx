import { Hero } from "@/components/landing/hero";
import { CaptionExplorer } from "@/components/landing/caption-explorer";
import { RangeShowcase } from "@/components/landing/range-showcase";
import { Pricing } from "@/components/landing/pricing";
import { StickyMobileCta } from "@/components/landing/sticky-mobile-cta";
import FAQSection from "@/components/FAQ";

export default function Page() {
  return (
    <main className="pb-20 md:pb-0">
      <Hero />
      <CaptionExplorer />
      <RangeShowcase />
      <Pricing />
      <FAQSection />
      <footer className="border-t border-border bg-background py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-lime text-ink">
              <span className="font-display text-sm font-extrabold">C</span>
            </span>
            <span className="font-display font-bold text-foreground">
              CaptionGenius
            </span>
          </div>
          <p>© 2026 CaptionGenius. Captions that don&apos;t sound like a robot.</p>
        </div>
      </footer>
      <StickyMobileCta />
    </main>
  );
}
