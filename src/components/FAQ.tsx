"use client";

import { useState } from "react";
import { Faq } from "@/data/FAQ";

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) =>
    setOpenIndex((prev) => (prev === i ? null : i));

  return (
    <section id="faq" className="bg-[#0A0A0A] py-20 sm:py-28">
      <div className="mx-auto w-full max-w-3xl px-6">

        {/* Header */}
        <div className="mb-12">
          <span className="text-sm font-semibold uppercase tracking-wider text-lime">
            FAQ
          </span>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight
            text-[#F7F6F1] sm:text-5xl">
            Questions, answered.
          </h2>
        </div>

        {/* Accordion */}
        <div className="divide-y divide-[#1a1a1a]">
          {Faq.map((q, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i}>
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="flex w-full items-start justify-between gap-6
                    py-5 text-left"
                >
                  <span
                    className={`font-display text-base font-semibold leading-snug
                      transition-colors ${isOpen ? "text-lime" : "text-[#F7F6F1]"}`}
                  >
                    {q.question}
                  </span>
                  <span
                    className={`mt-0.5 flex-shrink-0 text-xl font-light leading-none
                      transition-transform duration-200
                      ${isOpen ? "rotate-45 text-lime" : "text-[#6B6F76]"}`}
                    aria-hidden="true"
                  >
                    +
                  </span>
                </button>

                {/* Answer — CSS max-height transition */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out
                    ${isOpen ? "max-h-96 pb-5 opacity-100" : "max-h-0 opacity-0"}`}
                >
                  <p className="text-[15px] leading-relaxed text-[#a3a3a3]">
                    {q.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
