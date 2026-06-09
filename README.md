# CaptionGenius

> **Your photo. Five perfect captions. Three seconds.**

CaptionGenius turns any uploaded photo into five ready-to-post social media captions — tailored by platform, tone, style, and language. Powered by Groq's free AI APIs. No writing block. No generic output.

---

## Screenshots

### Landing page — Hero
![Hero section showing the dark ink background with lime green headline "Your photo. Five perfect captions. Three seconds." and an animated demo card showing a coffee photo with a live-generated caption](docs/screenshots/hero.png)

The hero features a live-cycling demo card that auto-types captions in different tones — no signup required to see the engine work.

### Interactive tone explorer
![Caption explorer showing a brunch food photo with five tone pills: Funny, Storytelling, Brand, Emotional, Bold — and a live caption below](docs/screenshots/explorer.png)

Tap any tone pill and the caption rewrites itself instantly. This is the actual Groq model running live.

### Style showcase
![Range showcase on dark background showing 4 photo cards: Español, Influencer, Storytelling, Corporate — each with a different caption style and hashtags](docs/screenshots/range.png)

### Pricing
![Pricing section with three cards: Free ($0/forever), Plus ($9.99/mo, highlighted), Pro ($29.99/mo)](docs/screenshots/pricing.png)

### FAQ
![FAQ accordion section on black background with 8 questions, lime "FAQ" label at top](docs/screenshots/faq.png)

### Caption Studio
![Caption studio split layout: left panel shows a golden retriever photo with thumbnail strip, right panel shows dark configure form with platform pills, caption style chips, tone, length selectors](docs/screenshots/studio.png)

Two-panel dark interface. Photo on the left, configuration on the right. Groq vision auto-describes the photo on arrival.

### Mobile
![Mobile view showing full-width hero text with sticky "Sign in to start" button at bottom](docs/screenshots/mobile-hero.png)

---

## How It Works

```
User uploads photo(s)  →  stored in /public/uploads/{folderId}/
        ↓
Groq Llama 4 Scout vision describes each image  (cached in SQLite — one call per image)
  "A golden retriever mid-run across a sunlit park"
        ↓
User picks: platform · style(s) · tone · length · language · hashtags on/off
        ↓
Groq Llama 3.3 70B generates 5 captions per image as JSON
        ↓
Edit captions inline · Copy · Bookmark to Favourites · Regenerate
```

**Why split vision and caption generation?**
The vision call happens once per image and is cached forever. Switching tone from Playful to Sophisticated on the same photo costs nothing extra — the description is already in the DB.

---

## Features

### Caption Studio (v2)

**Batch generation**
- Upload multiple photos — click Generate once to get 5 captions for every photo
- Tabbed output: click each photo tab to view its captions
- One monthly credit consumed per batch, not per photo

**Inline editing**
- Hover any caption → pencil icon appears
- Click to open an auto-resizing textarea
- ⌘↵ to save · Esc to cancel
- Saved captions show an "edited" badge; Copy and Copy All use the edited text

**Favourites**
- Bookmark any caption with the bookmark icon
- Bookmarks persist in the database across sessions
- Click again to unbookmark (DB record deleted)
- `/favourites` page shows all saved captions with platform, tone, hashtag context

### Configuration Options

| Option | Choices |
|---|---|
| **Platform** | Instagram, Twitter/X, LinkedIn, TikTok, Facebook, Pinterest |
| **Caption style** | 32 styles — Witty, Storytelling, Bold, Nostalgic, Sarcastic, Luxury, Cinematic, Pun... |
| **Tone** | Playful, Inspirational, Witty, Sophisticated, Bold, Romantic, Adventurous |
| **Length** | Snappy (< 15 words), Standard (20–40 words), Extended (60–100 words) |
| **Language** | Any — type the language name |
| **Hashtags** | Toggle on/off — 5–8 tags per caption |

Style selection is plan-gated: Free = 1, Plus = 3, Pro = 5.

### Output
- 5 genuinely distinct captions (different angle + structure, not clones)
- Per-caption copy, edit, and bookmark buttons (appear on hover)
- Copy all 5 numbered at once
- Regenerate — new results each time

### Dashboard (`/dashboard`)
- Monthly usage bar (lime → amber → coral)
- Last 6 generation cards with copy-all
- Manage billing → Stripe customer portal for paid users

### History (`/history`)
- Last 20 generations with full caption text
- Per-caption copy button on hover

### Favourites (`/favourites`)
- All bookmarked captions
- Platform + tone badge, hashtags, source image description
- Delete individual favourites

### Admin (`/admin`)
- Overview: total users, generations, plan breakdown
- Users table: search + inline role management

---

## Pricing

| Plan | Monthly generations | Price |
|---|---|---|
| **Free** | 5 | $0 — no card |
| **Plus** | 50 | $9.99 / month |
| **Pro** | 200 | $29.99 / month |

- Counter resets automatically on the 1st of each month
- All plans get all platforms, tones, languages, and hashtag support
- Stripe billing fully integrated — checkout, webhooks, customer portal

---

## Tech Stack

| Layer | What |
|---|---|
| **Framework** | Next.js 14 App Router |
| **Styling** | Tailwind CSS v3 — custom `lime` / `ink` / `coral` tokens |
| **AI — vision** | Groq `meta-llama/llama-4-scout-17b-16e-instruct` |
| **AI — captions** | Groq `llama-3.3-70b-versatile` → `llama-3.1-70b-versatile` → `llama-3.1-8b-instant` |
| **Database** | SQLite via `better-sqlite3` + Drizzle ORM (WAL mode) |
| **Auth** | NextAuth v4, Google OAuth, JWT sessions |
| **Payments** | Stripe Checkout + webhooks + customer portal |
| **Animations** | Framer Motion |
| **Toasts** | Sonner |
| **HEIC support** | Browser Canvas API — native decoder, no WASM |

---

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/upload-image` | POST | Saves file(s) to disk, returns `folderId` |
| `/api/image` | GET | Lists filenames in a `folderId` |
| `/api/describe-image` | POST | Cache-first Groq vision call |
| `/api/generate-caption` | POST | Auth-gated, quota-checked; supports batch (`imageDescriptions[]`) |
| `/api/user/usage` | GET | `{ used, limit, remaining, role }` |
| `/api/favourites` | GET/POST | Fetch all / save a favourite |
| `/api/favourites/[id]` | DELETE | Remove a favourite (ownership-checked) |
| `/api/checkout` | POST | Creates Stripe Checkout session |
| `/api/webhooks/stripe` | POST | Handles subscription lifecycle |
| `/api/billing/portal` | POST | Opens Stripe customer portal |
| `/api/admin/stats` | GET | Admin-only aggregate stats |
| `/api/admin/users/[id]` | PATCH | Admin role change |

---

## Database Schema

```
User              id, email, role, captionsUsed, resetDate, stripeCustomerId, stripeSubscriptionId
Generation        id, userId, folderId, imageCount, captions (JSON), formData (JSON), createdAt
ImageDescription  (folderId + filename) PK, description, model, createdAt   ← vision cache
Favourite         id, userId, captionText, hashtags, platform, tone, imageDesc, createdAt
Account           NextAuth OAuth accounts
Session           NextAuth JWT sessions
VerificationToken NextAuth email tokens
```

---

## Local Setup

```bash
# 1. Install
npm install

# 2. Copy env and fill in values
cp .env.example .env
```

**Required env vars:**
```env
GROQ_API_KEY=          # console.groq.com — free, no card, handles vision + captions
NEXTAUTH_SECRET=       # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=      # console.cloud.google.com → APIs → OAuth 2.0
GOOGLE_CLIENT_SECRET=
DATABASE_URL=./dev.db
```

**Optional (Stripe billing):**
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
│   ├── page.tsx                    # Landing (Hero, Explorer, Styles, Pricing, FAQ)
│   ├── generate-caption/[id]/      # Caption studio
│   ├── dashboard/                  # User dashboard
│   ├── history/                    # Generation history
│   ├── favourites/                 # Bookmarked captions
│   ├── admin/                      # Admin overview + users
│   ├── studio/                     # Demo page (sample photos)
│   └── api/                        # All API routes
├── components/
│   ├── landing/                    # Hero, CaptionExplorer, RangeShowcase, Pricing, FAQ
│   ├── studio/                     # CaptionStudio, ConfigForm, CaptionResultCard, ScrambleLoader
│   ├── dashboard/                  # DashboardClient
│   ├── admin/                      # AdminUsersClient
│   ├── history/                    # CopyButton
│   └── favourites/                 # DeleteFavButton
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

## Changelog

### v2
- **Batch generation** — generate captions for all uploaded photos in one click (one credit per batch)
- **Inline editing** — edit any caption in-place with auto-resizing textarea; ⌘↵ to save
- **Favourites** — bookmark captions to `/favourites`; persisted in DB, deletable
- **Studio redesign** — dark `#0d0d0d` cards, muted borders, glow on active pills, ring thumbnails

### v1
- Groq vision + caption generation
- Google OAuth, JWT sessions
- SQLite + Drizzle ORM
- Stripe billing (Checkout, webhooks, customer portal)
- Admin dashboard (stats, user role management)
- History page, FAQ, dark landing page

---

## Roadmap

| Feature | Status |
|---|---|
| Stripe billing | ✅ Done |
| Admin dashboard | ✅ Done |
| Batch generation | ✅ Done |
| Inline caption editing | ✅ Done |
| Favourites | ✅ Done |
| Multi-instance / Postgres | Planned |
| S3 / R2 image storage (for Vercel) | Planned |
| Social share buttons (Web Share API) | Planned |
| Image cleanup cron (24h TTL) | Planned |

---

*CaptionGenius — Built with Next.js 14, Drizzle ORM, Groq, Stripe, and Tailwind CSS.*
