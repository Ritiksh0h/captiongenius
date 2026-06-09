"use client";

import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { HeroDemoCard } from "./hero-demo-card";
import { UploadButton } from "./upload-button";

export function Hero() {
  const { data: session, status } = useSession();
  const pathname                  = usePathname();
  const [menuOpen, setMenuOpen]   = useState(false);

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      onClick={() => setMenuOpen(false)}
      className={`transition-colors hover:text-white ${
        pathname === href ? "text-white" : "text-white/70"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <section className="relative overflow-hidden bg-ink text-white">
      <div className="grain absolute inset-0 opacity-60" aria-hidden="true" />

      {/* ── Desktop nav ────────────────────────────────────────────────────── */}
      <header className="relative mx-auto flex w-full max-w-6xl items-center
        justify-between px-6 py-6">

        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-lime text-ink">
            <span className="font-display text-lg font-extrabold">C</span>
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            CaptionGenius
          </span>
        </div>

        {/* Desktop links */}
        <nav className="hidden items-center gap-8 text-sm md:flex">
          <a href="#explore" className="text-white/70 transition-colors hover:text-white">Try it</a>
          <a href="#styles"  className="text-white/70 transition-colors hover:text-white">Styles</a>
          <a href="#pricing" className="text-white/70 transition-colors hover:text-white">Pricing</a>
          <a href="#faq"     className="text-white/70 transition-colors hover:text-white">FAQ</a>
          {status === "authenticated" && (
            <>
              {navLink("/dashboard",  "Dashboard")}
              {navLink("/history",    "History")}
              {navLink("/favourites", "Favourites")}
            </>
          )}
        </nav>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-2">
          {status === "authenticated" && session?.user ? (
            <>
              {session.user.image && (
                <Link href="/dashboard">
                  <Image
                    src={session.user.image}
                    width={28}
                    height={28}
                    alt={session.user.name ?? ""}
                    className="rounded-full ring-1 ring-white/20 hover:ring-lime/50 transition-all"
                  />
                </Link>
              )}
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-full border border-white/15 px-4 py-2 text-sm
                  font-medium text-white/90 transition-colors hover:bg-white/10"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => signIn("google")}
              className="rounded-full border border-white/15 px-4 py-2 text-sm
                font-medium text-white/90 transition-colors hover:bg-white/10"
            >
              Sign in
            </button>
          )}
        </div>

        {/* Mobile: hamburger button */}
        <button
          type="button"
          className="flex md:hidden items-center justify-center size-9
            rounded-lg border border-white/15 text-white/80
            hover:bg-white/10 transition-colors"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="size-4" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="size-4" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </header>

      {/* ── Mobile drawer ─────────────────────────────────────────────────── */}
      {menuOpen && (
        <div className="relative mx-auto w-full max-w-6xl px-6 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 rounded-2xl border border-white/10
            bg-white/5 p-4 backdrop-blur">
            <a href="#explore" onClick={() => setMenuOpen(false)}
              className="px-3 py-2.5 text-sm text-white/80 hover:text-white
                rounded-xl hover:bg-white/10 transition-colors">
              Try it
            </a>
            <a href="#styles" onClick={() => setMenuOpen(false)}
              className="px-3 py-2.5 text-sm text-white/80 hover:text-white
                rounded-xl hover:bg-white/10 transition-colors">
              Styles
            </a>
            <a href="#pricing" onClick={() => setMenuOpen(false)}
              className="px-3 py-2.5 text-sm text-white/80 hover:text-white
                rounded-xl hover:bg-white/10 transition-colors">
              Pricing
            </a>
            <a href="#faq" onClick={() => setMenuOpen(false)}
              className="px-3 py-2.5 text-sm text-white/80 hover:text-white
                rounded-xl hover:bg-white/10 transition-colors">
              FAQ
            </a>
            {status === "authenticated" && (
              <>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)}
                  className={`px-3 py-2.5 text-sm rounded-xl hover:bg-white/10 transition-colors ${
                    pathname === "/dashboard" ? "text-white" : "text-white/80 hover:text-white"
                  }`}>
                  Dashboard
                </Link>
                <Link href="/history" onClick={() => setMenuOpen(false)}
                  className={`px-3 py-2.5 text-sm rounded-xl hover:bg-white/10 transition-colors ${
                    pathname === "/history" ? "text-white" : "text-white/80 hover:text-white"
                  }`}>
                  History
                </Link>
                <Link href="/favourites" onClick={() => setMenuOpen(false)}
                  className={`px-3 py-2.5 text-sm rounded-xl hover:bg-white/10 transition-colors ${
                    pathname === "/favourites" ? "text-white" : "text-white/80 hover:text-white"
                  }`}>
                  Favourites
                </Link>
              </>
            )}
            <div className="mt-2 pt-2 border-t border-white/10">
              {status === "authenticated" ? (
                <button type="button"
                  onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                  className="w-full px-3 py-2.5 text-sm text-white/80 hover:text-white
                    rounded-xl hover:bg-white/10 transition-colors text-left">
                  Sign out
                </button>
              ) : (
                <button type="button"
                  onClick={() => { setMenuOpen(false); signIn("google"); }}
                  className="w-full px-3 py-2.5 text-sm font-semibold text-lime
                    rounded-xl bg-lime/10 hover:bg-lime/20 transition-colors text-left">
                  Sign in with Google
                </button>
              )}
            </div>
          </nav>
        </div>
      )}

      {/* ── Hero body ─────────────────────────────────────────────────────── */}
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12
        px-6 pb-24 pt-10 lg:grid-cols-2 lg:gap-8 lg:pt-16">
        <div className="flex flex-col items-start">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full
            border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
            <span className="size-1.5 rounded-full bg-lime" />
            30+ caption styles · any language
          </span>
          <h1 className="text-balance font-display text-5xl font-extrabold
            leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
            Your photo.
            <br />
            Five perfect captions.
            <br />
            <span className="text-lime">Three seconds.</span>
          </h1>
          <p className="mt-6 max-w-md text-pretty text-lg leading-relaxed text-white/70">
            Upload any photo. Pick a vibe. Get captions that don&apos;t sound
            like a robot wrote them.
          </p>
          <div className="mt-8 hidden md:block">
            <UploadButton />
            <p className="mt-2 text-xs text-white/30 hidden lg:block">
              or drag a photo anywhere on this page
            </p>
          </div>
          <p className="mt-3 text-sm text-white/50">
            No card. 5 free captions every month.
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <HeroDemoCard />
        </div>
      </div>
    </section>
  );
}
