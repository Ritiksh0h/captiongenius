import Image from "next/image";
import { RANGE_CARDS } from "@/lib/captions";

export function RangeShowcase() {
  return (
    <section id="styles" className="bg-ink py-20 text-white sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="mb-12 max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-wider text-lime">
            The range
          </span>
          <h2 className="mt-3 text-balance font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Speaks your language. All 30+ styles. Any language.
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-white/60">
            Same kind of photo, wildly different voice. This isn&apos;t a
            one-trick template generator.
          </p>
        </div>

        <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {RANGE_CARDS.map((card, i) => (
            <article
              key={card.badge}
              className={`flex w-[80vw] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border bg-white/[0.03] sm:w-auto ${
                card.accent ? "border-lime/60" : "border-white/10"
              } ${i % 2 === 1 ? "lg:mt-8" : ""}`}
            >
              <div className="relative aspect-square w-full">
                <Image
                  src={card.photo || "/placeholder.svg"}
                  alt={card.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 80vw, 300px"
                />
                <span
                  className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    card.accent
                      ? "bg-lime text-ink"
                      : "bg-ink/70 text-white backdrop-blur"
                  }`}
                >
                  {card.badge}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="text-pretty text-sm leading-relaxed text-white/90">
                  {card.caption}
                </p>
                <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1">
                  {card.hashtags.map((tag) => (
                    <span key={tag} className="text-xs font-medium text-lime/80">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
