# PROJECT_STATE.md: RateIT Hyperlocal Verified Review Platform (Pune V1)

## 1. Architectural Blueprint
- **Platform:** RateIT — Hyperlocal Verified Review Platform for Pune (FC Road, Kothrud, Viman Nagar, Hinjewadi).
- **Core Value Proposition:** Eliminating fake/paid review spam for students, young professionals, and locals through multi-tier verification (GPS check-in, EXIF photo location verification, anti-fraud heuristics engine, Bayesian shrinkage rating, and Indian IT Act 2021 compliance).
- **Core Technology Stack:**
  - **Framework:** Next.js 14.2 (App Router) + React 18
  - **Language:** TypeScript 5.x (Strict typing, no `any` leaks)
  - **Styling & Motion:** Tailwind CSS, Radix UI primitives, Lucide icons, Sonner toasts, Lenis smooth scroll
  - **Database & ORM:** PostgreSQL via Prisma ORM 5.x (`pg_trgm` extension for trigram similarity)
  - **Auth & Backend Services:** Supabase Auth / SSR, Upstash Redis Rate Limiting, Cloudflare Turnstile bot verification
  - **Testing & Verification:** Vitest (31 unit/integration tests passing), Playwright e2e

## 2. Directory & Component Registry
### App Layer (`app/`)
- `layout.tsx` & `globals.css`: Root layout, theme providers, global styles, Lenis integration.
- `page.tsx`: Landing page highlighting trust tiers, Pune local spots, category explorer, and live verified reviews.
- `api/`: Backend Next.js route handlers:
  - `api/reviews/`: Review submission, GPS check-in verification, EXIF coordinate matching, anti-fraud evaluation, Bayesian recomputation.
  - `api/reviews/[id]/`: Author-only edit, author/admin delete with BOLA authorization, Bayesian recomputation.
  - `api/reviews/[id]/reply/`: Business replies restricted to users with APPROVED business claims.
  - `api/reviews/[id]/flag/`: User flagging, auto-hide on 3 distinct flags (`Visibility.HIDDEN`).
  - `api/reviews/[id]/helpful/`: Helpful vote toggling, author trust score feedback loop (+1 per helpful vote).
  - `api/feed/`: Personalized discover feed ($0.35\cdot\text{affinity} + 0.25\cdot\text{quality} + 0.20\cdot\text{proximity} + 0.10\cdot\text{freshness} + 0.10\cdot\text{trust}$, cold start blend, MMR diversity, 15% exploration slots, `feed_impression` logging).
  - `api/search/`: Postgres `pg_trgm` similarity + tag matching, hybrid scoring formula, zero-result category fallback.
  - `api/search/suggest/`: Autocomplete place names and trending `SearchLog` queries (min 2 chars, rate limited).
  - `api/places/`: Hyperlocal listings query, admin place creation with rate limiting.
  - `api/places/[id]/similar/`: Interaction-volume gated recommendations ($<500$: Bayesian category picks; $\ge 500$: co-interaction cosine similarity with 1-hr in-memory cache).
  - `api/events/`: Batched telemetry ingest (max 25), salted SHA-256 IP/device hashing, DPDP consent enforcement.
  - `api/admin/moderation/`: Admin-only actions (`hide`, `unhide`, `ban_user`, `dismiss_flag`), audit logging in `ModerationAction`, -10 trust penalty on upheld flags.
  - `api/grievance/`: Indian IT Act 2021 Grievance appeal ticket filing and queue.
  - `api/profile/`: User profile management, DPDP 2023 consent withdrawal and personal data/event erasure (`DELETE`).
  - `api/lists/` & `api/lists/[id]/`: User saved lists with strict owner authorization.
- `category/[slug]/`: Server Component querying Prisma category places with `category-client.tsx`.
- `discover/`: Server Component querying Prisma places with `discover-client.tsx` and live `/api/feed` integration.
- `item/[id]/`: Place profile with live reviews, reviewer trust badges, business replies, and similar places cards with `item-client.tsx`.
- `grievance/`: Official Grievance Officer desk with `grievance-form.tsx`.
- `privacy/`, `terms/`, `moderation-policy/`: Indian IT Act 2000 & 2021 compliance documents.

### Core Logic & Libraries (`lib/`)
- `personalization-config.ts`: Central configuration for all weights, decay rates, rate limits, Bayesian hyperparameters, and fraud thresholds.
- `bayesian.ts`: Bayesian shrinkage rating formula $(v/(v+m))\cdot R + (m/(v+m))\cdot C$ with 1-hour in-memory cached global mean and atomic place recomputation.
- `geolocation.ts`: Distance calculation (Haversine formula), physical check-in radius enforcement.
- `exif.ts`: Client/server extraction of photo EXIF metadata (GPS latitude/longitude, timestamp) using `exifr`.
- `fraud-heuristics.ts`: Zero-ML anti-fraud engine (near-duplicate bigram Jaccard, young account burst on place, collusion network IP/device sharing, impossible travel $>50\text{km}$ in $<30\text{min}$).
- `trust-score.ts`: User trust tier calculation (`Community Member` $<40$, `Verified Visitor` $40..74$, `Trusted Resident` $\ge 75$), trust adjustments clamped to $[0, 100]$.
- `interest.ts`: Event affinity weights, 30-day half-life exponential decay, vector normalization, cold start blend factor ($\text{events}/20$).
- `track.ts`: Client telemetry helper with in-memory queue, 10s auto-flush, `navigator.sendBeacon` on pagehide, and 3s-120s dwell tracking.
- `ratelimit.ts`: Upstash Redis sliding-window rate limiters with RFC-compliant `Retry-After` 429 responses.
- `turnstile.ts`: Cloudflare Turnstile token validation via `challenges.cloudflare.com/turnstile/v0/siteverify`.
- `validation.ts`: Strict Zod validation schemas (`.strict()`) for all API requests.
- `prisma.ts`: Singleton PrismaClient instance with connection hygiene.
- `server-auth.ts`: Server-side user authentication validation (`getAuthenticatedUser`, `isAdmin`).
- `supabase/`: Supabase client and SSR utilities (`server.ts`, `client.ts`).

### Database (`prisma/`)
- `schema.prisma`: Data models for `User`, `Place`, `Review`, `BizReply`, `Flag`, `List`, `ListItem`, `BusinessClaim`, `ModerationAction`, `GrievanceAppeal`, `UserEvent`, `UserInterest`, `SearchLog`, `ReviewHelpful`.
- `seed.ts`: Realistic initial dataset for Pune hubs (FC Road, Kothrud, Hinjewadi) + 2 dedicated personalization verification users (Aarav with CAFE affinity, Meera with PG_HOSTEL affinity).
- `migrations/20261101150000_enable_pg_trgm/`: Migration enabling Postgres `pg_trgm` extension for fuzzy search.

## 3. Verified Status & Milestones
- [x] **P0 Foundation**: Standardized on npm, eliminated pnpm lockfiles, verified Prisma live DB wiring, killed mock storefront (pages read Prisma, `lib/mock.ts` only used by `prisma/seed.ts`), wired client/server EXIF extraction in review modal.
- [x] **P1 Security Hardening**: Authorization matrix enforced server-side (BOLA protected), Zod schemas with `.strict()`, Upstash sliding window rate limiting with `Retry-After`, Cloudflare Turnstile on submit & claim, strict security headers (CSP, HSTS, X-Frame-Options DENY), zero client secrets leak check (`scripts/check-client-secrets.sh`), moderation auto-hide on 3 flags, DPDP 2023 consent toggle and telemetry erasure.
- [x] **P2 Event & Interest System**: `UserEvent` and `UserInterest` tables, batched event ingest `/api/events`, `lib/track.ts` beacon tracking, 30-day half-life decay, cold-start blend factor.
- [x] **P3 Personalized Feed**: `GET /api/feed` with candidate generation (10km, top 3 categories, 14d reviews, 7d velocity), scoring formula, MMR diversity re-ranking, 15% exploration slots, `feed_impression` telemetry.
- [x] **P4 Personalized Search**: `GET /api/search` with trigram similarity, text + quality + proximity + affinity scoring, `/api/search/suggest` autocomplete with `SearchLog`, zero-result category fallback.
- [x] **P5 Trust & Ratings Math**: Bayesian ratings everywhere, young-account burst / collusion / impossible travel fraud heuristics, reviewer trust feedback loop (+1 helpful, -10 admin flag, -15 fraud), similar places endpoint `GET /api/places/:id/similar` volume-gated.
- [x] **P6 Apple-Grade UI & Emil Motion Overhaul**: Unified Obsidian Gold design system across all screens, universal persistent `Navbar` and liquid glass `BottomNav`, global `LenisProvider` smooth momentum scroll, dark styled Sonner `Toaster`, tactile pointer feedback (`apple-press` `active:scale-[0.97]`), translucent glass surfaces, optical tracking and `tabular-nums` typography, synchronized search query routing, and refreshed modals (`EnhancedRateModal`, `SaveToListsModal`).
- [x] **P7 Skeptical Review & Resilient Architecture Fixes**:
  - **Global Persistent Navigation & Modal Context (`components/ui-provider.tsx`)**: Extracted floating mobile `BottomNav`, rate modal, and search palette into root `UIProvider`. Navigation no longer flashes, unmounts/remounts, or disappears on legal/grievance/claim screens.
  - **Apple Command Palette (`components/command-palette.tsx`)**: Built native `⌘K` / `Ctrl+K` Spotlight-grade search dialog wired directly to `/api/search/suggest`, with keyboard navigation (Up/Down/Enter/Escape).
  - **Live Search Connection**: Wired `/api/search` into `discover-client.tsx` with trigram similarity, zero-result category fallback banner, and in-memory fallback.
  - **Mobile Safe Area & Touch Insets**: Handled iOS home indicator insets with `bottom-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))]` and `pb-28 md:pb-12` main clearance.
  - **Real List Persistence (`SaveToListsModal`)**: Wrote real `PUT /api/lists/[id]` database mutations with `placeId`, plus local cache for guest mode.
  - **Review Submission Validation**: Added optional `checkinVerified` and `consentGiven` fields to `reviewSchema.strict()` to prevent 400 rejection on review submit.
  - **Graceful Pune Highlights Fallback**: Seed and live place fallback in `page.tsx`, `discover/page.tsx`, `category/[slug]/page.tsx`, and `item/[id]/page.tsx` so all places and categories load reliably.
- [x] **P8 Anti-Vibe Hardening & Launch Readiness**:
  - **Zero Purple/Indigo Gradients**: Purged all `via-indigo-600/8` and purple gradient stops from `app/page.tsx`, `components/`, and `lib/`.
  - **Zero Pill Buttons**: Replaced `rounded-full` buttons, search inputs, docks, and badges with Apple standard `rounded-xl`, `rounded-lg`, and `rounded-md` rectangular rounding.
  - **Zero Fake Reviews & Counters**: Deleted hardcoded `recentVerifiedReviews` mock array and `1,250+ reviews` / `48+ hubs` / `100% fraud-free` stats; wired authentic `GET /api/reviews` live counts with honest empty states and architectural specs (200m GPS radius, EXIF + GPS verification, Bayesian shrinkage rating).
  - **Zero Emojis**: Removed all emoji icons (`📍`, `🎓`, `🏠`, `☕`, `✨`, `🌐`, `🔒`, `📝`, `⚖️`, `🏪`, `📸`, `✅`, `⚠️`, `🎉`) across all screens; replaced with crisp Lucide SVG icons.
  - **Zero Em Dashes**: Cleaned all `—` punctuation marks across metadata, legal pages, modals, and library helpers into colons or hyphens.
  - **Crisp Non-Floaty Scroll**: Tuned `lib/lenis.ts` (`duration: 0.6`, `touchMultiplier: 1`) for immediate, responsive momentum without lag.
  - **Branding & Manifest**: Renamed package from `"my-v0-project"` to `"rateit"`.
  - **Favicon**: Created geometric gold SVG favicon (`app/icon.svg`) and legacy MS Windows icon resource (`public/favicon.ico`).
  - **Custom Domain & Metadata**: Configured `metadataBase` with `NEXT_PUBLIC_APP_URL` fallback to `https://rateit.in`, with clean canonical icons and metadata.
- [x] **P9 Live Supabase PostgreSQL Connection & Seed**:
  - Wired live Supabase credentials (`DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `EVENT_HASH_SALT`) into `.env.local` and `.env`.
  - Applied URL-encoding to special password characters (`@` -> `%40`, `#` -> `%23`).
  - Executed `npx prisma db push --accept-data-loss` to provision all 14 tables in production Postgres.
  - Enabled PostgreSQL `pg_trgm` extension and created GIN trigram index `idx_place_name_trgm` on `Place(name)` for accelerated fuzzy search.
  - Configured ts-node CommonJS module compiler options in `tsconfig.json` and executed `npm run db:seed` to populate Pune hubs (FC Road, Kothrud, Viman Nagar, Hinjewadi), live places, verified reviews, and Aarav/Meera test users.
  - Verified live queries: `/api/places` (11 places), `/api/reviews` (5 verified reviews), `/api/search?q=Vaishali` (trigram match score `0.8445`), and `/api/feed` (personalized ranking with Haversine distance).
- [x] **P10 Supabase OAuth & Review Submit Resilience**:
  - Implemented `/auth/callback` PKCE exchange route with open-redirect protection.
  - Added Next.js session refresh `middleware.ts` via `@supabase/ssr` to maintain active user sessions.
  - Added Google & GitHub OAuth sign-in buttons with official SVGs in `app/login/page.tsx`.
  - Fixed PostgreSQL `phone` unique constraint collision (`P2002`) by sanitizing empty strings `""` to `NULL`.
  - Hardened `getAuthenticatedUser()` in `lib/server-auth.ts` with graceful profile linking and display name/avatar extraction.
  - Enhanced `enhanced-rate-modal.tsx` with intelligent 401 handling and gentle sign-in redirects.
- [x] **P11 PostgreSQL RLS Hardening & Emil UI Modal Harmonization**:
  - Enabled Row Level Security (`rowsecurity: true`) across all 15 public tables (`User`, `Place`, `Review`, `BizReply`, `BusinessClaim`, `Flag`, `List`, `ListItem`, `ModerationAction`, `GrievanceAppeal`, `UserEvent`, `UserInterest`, `SearchLog`, `ReviewHelpful`, `_prisma_migrations`) in Supabase PostgreSQL, clearing all Supabase Security Advisor warnings.
  - Added permissive policies for service role access in `prisma/migrations/20261102_enable_rls.sql` to maintain zero-latency Prisma operations.
  - Upgraded `components/enhanced-rate-modal.tsx` with Apple WWDC fluid interface physics: `animate-in zoom-in-95 ease-out duration-150`, GPU-composited `transform: scaleX(...)` progress bar (eliminating layout reflows), and minimum 44px touch targets with `apple-press`.
  - Harmonized `components/command-palette.tsx` and `components/save-to-lists-modal.tsx` with Obsidian Gold surfaces (`#161617`, `#1d1d1f`, `#2997ff`, hairline `border-white/[0.08]`, top edge highlight `border-t-white/[0.14]`).
  - Diagnosed and resolved Python marine chat backend (`Tarang`) LLM model cascade: added `gemini-3.5-flash` rock-solid fallback to eliminate Google API 503/read timeouts; verified all 81 pytest tests pass in 63.92s.
- [x] **P12 Apple Semantic Palette & WWDC Fluid Motion Overhaul (Plan v2)**:
  - **RGB Semantic Token Architecture**: Defined space-separated RGB channel variables in `app/globals.css` and mapped them in `tailwind.config.ts` via `rgb(var(--color) / <alpha-value>)` to enable Tailwind v3 slash-opacity (`bg-accent/10`, `border-accent-link/30`, `bg-surface-2/80`).
  - **Total Legacy Purge**: Replaced 510+ instances of legacy `slate-*` and `amber-*` classes across all 14 screens and components with semantic tokens (`surface`, `surface-2`, `surface-3`, `fg`, `fg-muted`, `fg-subtle`, `accent`, `accent-link`, `accent-tint`, `star`, `success`, `hairline`).
  - **Instant Command Palette (`⌘K`)**: Raycast-standard instant 0ms open and close, eliminating all artificial zoom/fade entry delays.
  - **Apple Form & Surface Foundations**: Replaced pill cards with fill-contrast on black (`bg-surface rounded-modal` / `rounded-card`), minimal hairline borders (`border-hairline`), and fully rounded pills (`rounded-full`) on all primary CTAs, chip filters, and OAuth buttons.
  - **Typography & Motion Engineering**: SF Pro Display / SF Pro Text / Inter font stack, `font-semibold tracking-[-0.022em]` on large titles, body regular at 1.47 line height. Tactile 160ms `.apple-press` press physics (`active:scale-[0.97]`).
  - **Motion Accessibility & Touch Isolation**: Gated color hovers with `future: { hoverOnlyWhenSupported: true }` in Tailwind v3. Exempted `.animate-spin` and `[data-spinner]` in reduced-motion media query, included `::before`/`::after`, and integrated `window.matchMedia("(prefers-reduced-motion: reduce)")` guard in `lib/lenis.ts` to suspend smooth scroll.
  - **Unified Component & Screen Coverage**: Refactored `layout.tsx`, `page.tsx`, `discover-client.tsx`, `item-client.tsx`, `item/[id]/page.tsx`, `category-client.tsx`, `categories/page.tsx`, `lists/page.tsx`, `profile/page.tsx`, `business/claim/[placeId]/page.tsx`, `grievance/page.tsx`, `grievance/grievance-form.tsx`, `moderation-policy/page.tsx`, `privacy/page.tsx`, `terms/page.tsx`, `login/page.tsx`, `navbar.tsx`, `bottom-nav.tsx`, `command-palette.tsx`, `save-to-lists-modal.tsx`, and `enhanced-rate-modal.tsx`.
- [x] **Verification**:
  - `npx tsc --noEmit`: 0 TypeScript compiler errors.
  - `npm run check:secrets`: 0 sensitive variables in `.next/static`.
  - `npm run test`: 7/7 suites passed, 31/31 unit & API tests passed in 118ms.
  - `npm run build`: Production Next.js 14 build passes cleanly with 0 type or webpack errors across all 16 routes.


