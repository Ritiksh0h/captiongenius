# CaptionGenius

> **Your photo. Five perfect captions. Three seconds.**

CaptionGenius turns any uploaded photo into five ready-to-post social media captions — tailored by platform, tone, style, and language. Powered by Groq's free AI APIs. No writing block. No generic output.

---

## Screenshots

### Landing page — Hero
![Hero section showing the dark ink background with lime green headline "Your photo. Five perfect captions. Three seconds." and an animated demo card showing a coffee photo with a live-generated caption](docs/screenshots/hero.png)

The hero features a live-cycling demo card that auto-types captions in different tones (Funny → Emotional → Brand → Bold) every few seconds — no signup required to see the engine work.

### Interactive tone explorer
![Caption explorer showing a brunch food photo with five tone pills: Funny, Storytelling, Brand, Emotional, Bold — and a live caption below](docs/screenshots/explorer.png)

Tap any tone pill and the caption rewrites itself instantly. This is the actual Groq model running live — not a static example.

### Style showcase
![Range showcase on dark background showing 4 photo cards: Español, Influencer, Storytelling, Corporate — each with a different caption style and hashtags](docs/screenshots/range.png)

Four photos. Four wildly different voices. Español, Influencer, Storytelling, Corporate — same AI, different output.

### Pricing
![Pricing section with three cards: Free ($0/forever), Plus ($9.99/mo, highlighted), Pro ($29.99/mo)](docs/screenshots/pricing.png)

### FAQ
![FAQ accordion section on black background with 8 questions, all collapsed, lime "FAQ" label at top](docs/screenshots/faq.png)

### Caption Studio
![Caption studio split layout: left panel shows a golden retriever photo with thumbnail strip, right panel shows configure form with platform pills, caption style chips, tone, length selectors](docs/screenshots/studio.png)

The studio is a two-panel layout — photo on the left, configuration form on the right. The image is auto-described by Groq vision the moment you arrive, pre-filling the description field.

### Mobile
![Mobile view showing full-width hero text "Your photo. Five perfect captions. Three seconds." in lime and white, with sticky "Sign in to start" button at bottom](docs/screenshots/mobile-hero.png)

Fully responsive. Sticky upload CTA at the bottom of every page on mobile.

---

## How It Works

```
User uploads photo  →  stored in /public/uploads/{folderId}/
        ↓
Groq Llama 4 Scout vision describes the image  (cached in SQLite forever)
  "A golden retriever mid-run across a sunlit park"
        ↓
User picks: platform · style · tone · length · language · hashtags
        ↓
Groq Llama 3.3 70B generates exactly 5 captions as JSON
        ↓
Copy · Copy all · Download .txt · Regenerate
```

**Why two separate AI calls?**  
The vision call happens once per image and is cached. Switching tone from Playful to Sophisticated on the same photo costs nothing extra — the description is already in the DB and the new captions generate in ~2 seconds.

---

## Features

### Caption Studio
- Upload single or multiple images (JPEG, PNG, WebP, **HEIC** — auto-converted)
- Groq vision auto-describes the photo on arrival and pre-fills the field
- Re-describe button at any time
- 300ms debounce prevents stale races when switching between photos
- Amber "type manually" warning if vision is temporarily unavailable — generation still works

### Configuration
| Option | Choices |
|---|---|
| **Platform** | Instagram, Twitter/X, LinkedIn, TikTok, Facebook, Pinterest |
| **Caption style** | 32 styles — Witty, Storytelling, Bold, Nostalgic, Sarcastic, Luxury, Cinematic, Pun, Confessional, Hot take... |
| **Tone** | Playful, Inspirational, Witty, Sophisticated, Bold, Romantic, Adventurous |
| **Length** | Snappy (< 15 words), Standard (20–40 words), Extended (60–100 words) |
| **Language** | Any — type the language name |
| **Hashtags** | Toggle on/off — 5–8 tags per caption |

Style selection is limited per plan: Free = 1, Plus = 3, Pro = 5.

### Output
- 5 genuinely distinct captions (different angle + structure, not clones)
- Per-caption copy button
- Copy all 5 (numbered)
- Regenerate — new results each time

### Dashboard (`/dashboard`)
- Monthly usage bar (lime → amber → coral as limit approaches)
- Last 6 generation cards with tone/platform badges and copy-all
- Manage billing → Stripe customer portal for paid users

### History (`/history`)
- Last 20 generations with full caption text
- Per-caption copy button on hover
- Timestamps and platform/tone/length metadata

### Admin (`/admin`)
- Overview: total users, total generations, plan breakdown
- Users table with search and inline role dropdown
- Role changes take effect immediately via PATCH API

---

## Pricing

| Plan | Monthly generations | Price |
|---|---|---|
| **Free** | 5 | $0 — no card |
| **Plus** | 50 | $9.99 / month |
| **Pro** | 200 | $29.99 / month |

- Monthly counter resets automatically on the 1st
- All plans get all features — no style/tone/language restrictions
- Limits enforced server-side; can't be bypassed client-side
- Stripe billing integrated — checkout, webhooks, customer portal all wired

---

## Tech Stack

| Layer | What |
|---|---|
| **Framework** | Next.js 14 App Router |
| **Styling** | Tailwind CSS v3 — custom `lime` / `ink` / `coral` design tokens |
| **AI — vision** | Groq `meta-llama/llama-4-scout-17b-16e-instruct` |
| **AI — captions** | Groq `llama-3.3-70b-versatile` → `llama-3.1-70b-versatile` → `llama-3.1-8b-instant` (auto-fallback) |
| **Database** | SQLite via `better-sqlite3` + Drizzle ORM (WAL mode) |
| **Auth** | NextAuth v4, Google OAuth, JWT sessions |
| **Payments** | Stripe Checkout + webhooks + customer portal |
| **Animations** | Framer Motion |
| **Toasts** | Sonner |
| **HEIC support** | Browser Canvas API (native decoder — no WASM) |

---

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/upload-image` | POST | Saves file to disk, returns `folderId` |
| `/api/image` | GET | Lists filenames in a `folderId` |
| `/api/describe-image` | POST | Cache-first Groq vision call |
| `/api/generate-caption` | POST | Auth-gated, quota-checked generation |
| `/api/user/usage` | GET | `{ used, limit, remaining, role }` |
| `/api/checkout` | POST | Creates Stripe Checkout session |
| `/api/webhooks/stripe` | POST | Handles subscription events |
| `/api/billing/portal` | POST | Opens Stripe customer portal |
| `/api/admin/stats` | GET | Admin-only stats |
| `/api/admin/users/[id]` | PATCH | Admin role change |

---

## Database Schema

```
User              id, email, role, captionsUsed, resetDate, stripeCustomerId, stripeSubscriptionId
Generation        id, userId, folderId, captions (JSON), formData (JSON), createdAt
ImageDescription  (folderId + filename) PK, description, model, createdAt   ← description cache
Account           NextAuth OAuth accounts
Session           NextAuth JWT sessions
VerificationToken NextAuth email tokens
```

`ImageDescription` composite PK on `(folderId, filename)` — the same image is never described twice.

---

## Local Setup

```bash
# 1. Install
npm install

# 2. Copy env and fill in values
cp .env.example .env
```

**Minimum required env vars:**
```env
GROQ_API_KEY=          # console.groq.com — free, no card, handles vision + captions
NEXTAUTH_SECRET=       # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=      # console.cloud.google.com → APIs → OAuth 2.0
GOOGLE_CLIENT_SECRET=
DATABASE_URL=./dev.db
```

**Optional (needed for Stripe billing):**
```env
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PLUS_PRICE_ID=
STRIPE_PRO_PRICE_ID=
```

```bash
# 3. Create database
npm run db:push

# 4. Run
npm run dev   # → http://localhost:3000
```

**DB helpers:**
```bash
npm run db:push     # sync schema (safe, non-destructive)
npm run db:studio   # visual DB browser
```

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing (Hero, CaptionExplorer, RangeShowcase, Pricing, FAQ)
│   ├── generate-caption/[id]/      # Caption studio
│   ├── dashboard/                  # User dashboard
│   ├── history/                    # Generation history
│   ├── admin/                      # Admin overview + users
│   ├── studio/                     # Demo page (sample photos, no upload)
│   └── api/                        # All API routes
├── components/
│   ├── landing/                    # Hero, CaptionExplorer, RangeShowcase, Pricing, FAQ
│   ├── studio/                     # CaptionStudio, ConfigForm, CaptionResultCard, ScrambleLoader
│   ├── dashboard/                  # DashboardClient
│   ├── admin/                      # AdminUsersClient
│   └── history/                    # CopyButton
├── db/
│   ├── index.ts                    # Drizzle + better-sqlite3 client
│   └── schema.ts                   # Table definitions
└── lib/
    ├── ai.ts                       # describeImage() + generateCaptionsWithGroq()
    ├── auth.ts                     # NextAuth config + ADMIN_EMAILS
    ├── stripe.ts                   # Stripe client + price ID helpers
    └── captions.ts                 # CAPTION_STYLES, GEN_TONES, PLATFORMS, demo data
```

---

## Taking the Screenshots

The `docs/screenshots/` folder should contain these files. Run the dev server then capture with any screenshot tool:

| File | URL | Notes |
|---|---|---|
| `hero.png` | `/` | Desktop 1280×800, scroll to top |
| `explorer.png` | `/#explore` | Desktop |
| `range.png` | `/#styles` | Desktop |
| `pricing.png` | `/#pricing` | Desktop |
| `faq.png` | `/#faq` | Desktop |
| `studio.png` | `/studio` | Desktop 1280×600 |
| `mobile-hero.png` | `/` | Mobile 375×812 |

---

## Roadmap

| Feature | Status |
|---|---|
| Stripe billing — Checkout, webhooks, portal | ✅ Done |
| Admin dashboard — stats, user role management | ✅ Done |
| HEIC / iPhone photo support | ✅ Done |
| Caption style limits per plan | ✅ Done |
| Multi-image batch generation | Planned |
| Inline caption editing | Planned |
| Favourite captions (bookmarks) | Planned |
| S3 / R2 image storage (for serverless) | Planned |
| Postgres support (for multi-instance) | Planned |
| Image cleanup cron (24h TTL) | Planned |

---

## Known Limitations

**Local filesystem** — images go to `public/uploads/`. On ephemeral serverless hosts (Vercel, Railway) they vanish on redeploy. Switch to S3/R2 for production.

**SQLite** — fine for single-server. Multi-instance deployments need Postgres (Drizzle dialect swap, schema unchanged).

**Groq vision** — occasionally rate-limited on the free tier. Amber warning shown, users type manually, caption generation is unaffected.

---

*CaptionGenius — Built with Next.js 14, Drizzle ORM, Groq, Stripe, and Tailwind CSS.*
