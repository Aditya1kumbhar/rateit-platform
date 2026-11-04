# RateIT — Hyperlocal Verified Review Platform for Pune

> **Honest reviews backed by physical presence verification, EXIF spatial cross-checks, and Bayesian ranking.**  
> Built for students, young professionals, and locals navigating Pune hubs (FC Road, Kothrud, Viman Nagar, Hinjewadi).

---

![RateIT Banner](https://img.shields.io/badge/RateIT-Pune%20V1-orange?style=for-the-badge&logo=googlemaps)
![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Database](https://img.shields.io/badge/PostgreSQL-Prisma-2D3748?style=for-the-badge&logo=prisma)
![Indian Legal Compliance](https://img.shields.io/badge/IT%20Act%202000-Compliant-green?style=for-the-badge)
![DPDP 2023](https://img.shields.io/badge/DPDP%202023-Privacy%20Enforced-blue?style=for-the-badge)

---

## Architecture & Core Value Proposition

Public review systems suffer from coordinate spoofing, paid review rings, and extreme rating distortion from uncalibrated 5-star averages. RateIT provides a multi-signal verification and personalization engine designed specifically for local urban hubs.

### 1. Physical Geofence & Check-In Verification
When a user submits a review, their physical browser coordinates are evaluated against the place geofence using the Haversine formula:
$$\Delta\sigma = 2 \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
Reviews submitted within the physical radius (50m default) receive a `checkinVerified` cryptographic badge.

### 2. EXIF Photo Location Cross-Check
Review photos undergo client-side and server-side EXIF metadata extraction via `exifr`. Extracted GPS latitude/longitude and acquisition timestamps are cross-referenced with the target place coordinates and submission time:
- Photos matching the geofence within 100m are marked `photoVerified`.
- Photos lacking EXIF metadata are handled gracefully as `photo-unverified` without rejecting the user's submission.
- Coordinate mismatches (>100m or stale timestamps) trigger an `EXIF_MISMATCH` fraud warning.

### 3. Bayesian Average Rating Engine
To avoid distortion where a place with a single 5-star review outranks a place with hundreds of 4.8-star reviews, RateIT applies Bayesian shrinkage across all listings:
$$\text{Displayed Rating} = \left(\frac{v}{v + m}\right) \cdot R + \left(\frac{m}{v + m}\right) \cdot C$$
- $v$: Place review count
- $R$: Raw arithmetic mean of place reviews
- $m$: Prior weight constant ($m = 10$)
- $C$: Platform-wide global mean rating (cached in memory with 1-hour TTL)

Both raw `avgRating` and `bayesianRating` are persisted, ensuring honest review counts and robust ordering.

### 4. Mathematical Anti-Fraud Heuristics (Zero-ML)
1. **Young-Account Burst on Place**: Detects $>8$ reviews submitted in 1 hour from accounts created $<7$ days ago.
2. **Collusion Networks**: Flags $\ge 3$ distinct accounts sharing the same salted SHA-256 IP or device fingerprint reviewing the same listing within 24 hours.
3. **Impossible Travel**: Detects check-in coordinates $>50\text{ km}$ apart within 30 minutes.
4. **Near-Duplicate Text**: Evaluates character and word bigram Jaccard similarity across author review history.
5. **Pre-Moderation Routing**: Reviews triggering $\ge 2$ flags enter the admin pre-moderation queue (`Visibility.HIDDEN`).

### 5. Interest-Based Personalization & 30-Day Half-Life Decay
- **Affinity Vectors**: Maintained per category ($W(\text{review\_submit})=5$, $W(\text{place\_save})=3$, $W(\text{list\_add})=3$, $W(\text{search\_click})=2$, $W(\text{dwell})=1/10\text{s}$, $W(\text{browse})=0.5$).
- **Exponential Decay**:
  $$\text{Effective Affinity} = \text{Stored Affinity} \times 0.5^{(\Delta t / 30)}$$
- **Cold-Start Blending**: Users with $<20$ events have personalization blended linearly ($\text{events}/20$), with weight safely redistributed to Bayesian quality.
- **MMR Diversity & Exploration**: Top 10 results enforce a cap of $\le 2$ items per category with $0.85$ decay per subsequent pick. Slots 5, 11, and 17 are reserved for high-quality exploratory places.

---

## Verified Categories (Pune Focus)

- **Coaching Institutes**: FC Road, Kothrud, Karve Road engineering/civil service hubs.
- **PGs & Hostels**: Student accommodations in Kothrud, Viman Nagar, Hinjewadi Phase 1-3.
- **Cafes & Study Spaces**: High-density youth workspaces.
- **Local Services**: Verified local repair, laundry, and student essentials.

---

## Security & Compliance Architecture

- **Zero-Trust Input Validation**: All route handlers enforce strict Zod schemas (`.strict()`) rejecting unknown attributes.
- **BOLA / IDOR Verification**: Multi-tenant authorization matrix guarantees owners can only mutate their own reviews, lists, or claims.
- **Rate Limiting**: Sliding window rate limits via Upstash Redis returning RFC-compliant `Retry-After` headers.
- **Bot Mitigation**: Cloudflare Turnstile verification server-side gate on review submission and business claims.
- **Indian IT Act 2000 & 2021 Rules**: Public Grievance Officer desk (`/grievance`) with audit-logged resolution flows.
- **DPDP Act 2023 Compliance**: Personal telemetry requires explicit consent (`User.consentGiven`). Unconsented events record zero personal identifiers. Profile settings support one-click consent withdrawal and complete telemetry erasure.

---

## Local Development & Setup

### Prerequisites
- Node.js 18+ (Standardized on **npm**)
- PostgreSQL database (Supabase or local Postgres)

### Step 1: Clone & Install
```bash
git clone https://github.com/Aditya1kumbhar/rateit-platform.git
cd rateit-platform
npm install
```

### Step 2: Configure Environment
Copy `.env.example` to `.env.local` and set required variables:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rateit?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/rateit?schema=public"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
EVENT_HASH_SALT="high-entropy-random-salt-string"
```

### Step 3: Database Migration & Seeding
```bash
npx prisma migrate dev --name init
npm run db:seed
```

### Step 4: Run Tests
```bash
# Unit & Integration Tests (Vitest)
npm run test:unit

# Client Bundle Secrets Leak Check
npm run check:secrets
```

### Step 5: Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
