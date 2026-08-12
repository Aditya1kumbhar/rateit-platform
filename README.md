# RateIT — Hyperlocal Verified Review Platform (Pune V1)

![RateIT Banner](https://img.shields.io/badge/RateIT-Pune%20V1-4B0082?style=for-the-badge&logo=next.js)
![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

RateIT is a hyper-focused, trustworthy review ecosystem designed specifically for student & young professional hubs in **Pune** (Kothrud, FC Road, Viman Nagar, Hinjewadi). RateIT addresses the rampant problem of paid, fake, and unverified reviews on platforms like Google Maps and Justdial by introducing **Check-In Verification**, **EXIF GPS Metadata Extraction**, **Anti-Fraud Heuristics**, and **Trust Tiers**.

---

## 🚀 Key Upgrades & V1 Feature Highlights

### 🎯 1. Hyperlocal Pune Seed Engine (`lib/mock.ts`)
- Specialized data model for student priorities: **Coaching Classes (IIT-JEE, MPSC, UPSC)**, **PG Hostels**, **Cafés**, and **Local Services**.
- Enriched mock datasets featuring actual Pune locations (*FC Road, Karve Nagar, Wakad, Hinjewadi Phase 1*).
- Consistent place mapping with unique identifiers across landing pages, categories, search, and detail views.

### 🛡️ 2. Verified Reviews & Anti-Fraud Infrastructure (`lib/fraud-heuristics.ts` & `lib/trust-score.ts`)
- **Check-In Verification**: Compares user GPS coordinates against business geofences (lat/lng radius check).
- **EXIF Metadata Parsing (`lib/exif.ts`)**: Validates uploaded photo timestamps and GPS coordinates directly from photo headers to prevent stock photo spam.
- **Trust Tiers**: Categorizes reviewers into `UNVERIFIED`, `COMMUNITY`, `VERIFIED_VISITOR`, and `TRUSTED_RESIDENT` based on historical rating density and verification history.
- **Fraud Heuristics Engine**:
  - Burst detection (flagging sudden rating spikes).
  - Suspicious text repetition & sentiment anomaly flags.
  - Device/IP rate-limiting (`lib/ratelimit.ts`).

### ⚖️ 3. Indian Legal Compliance (IT Act Section 79)
- **Safe Harbour Provision Compliance**: Standardized terms of service, privacy policy, and grievance officer pages (`/terms`, `/privacy`, `/moderation-policy`, `/grievance`).
- **Grievance Officer Portal**: Official contact info and turnaround SLA (36 hours) for takedown notices as required under the *Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021*.

### 📱 4. Dynamic UI & Seamless Navigation
- **Dynamic Category Mapping (`app/category/[slug]/page.tsx`)**: Decodes URL parameters cleanly (e.g., `Cafés` → `CAFE`) and filters places dynamically.
- **Interactive Discover Grid (`app/discover/page.tsx`)**: Fully clickable cards with real-time category filtering and sorting (Highest Rated, Most Reviews, A-Z).
- **Detailed Place Views (`app/item/[id]/page.tsx`)**: Dynamically renders place info, photo galleries, operational hours, verified badge tags, and place-specific user reviews.
- **Enhanced Rating Modal (`components/enhanced-rate-modal.tsx`)**: Interactive 5-star rating system with photo upload triggers, verification badges, tag chips, and real API connectivity (`POST /api/reviews`).
- **Hydration Safety**: Fully compliant with Next.js SSR hydration rules (`suppressHydrationWarning`).

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | Next.js 14 (App Router), React 18 |
| **Language** | TypeScript (Strict mode) |
| **Styling & UI** | Tailwind CSS, shadcn/ui, Lucide Icons, Lenis Smooth Scroll |
| **Database & ORM** | PostgreSQL, Prisma ORM, Supabase |
| **Authentication** | Custom Session Handler (`lib/userAuth.ts`), NextAuth / Supabase Auth ready |
| **Testing** | Playwright (E2E Integration Tests) |
| **Code Review** | CodeRabbit AI Integration |

---

## 📊 Database Schema Overview (`prisma/schema.prisma`)

```prisma
enum Category {
  COACHING
  PG_HOSTEL
  CAFE
  RESTAURANT
  LOCAL_SERVICE
}

enum TrustTier {
  UNVERIFIED
  COMMUNITY
  VERIFIED_VISITOR
  TRUSTED_RESIDENT
}

model Place {
  id          String   @id @default(cuid())
  name        String
  category    Category
  address     String
  lat         Float
  lng         Float
  avgRating   Float    @default(0)
  reviewCount Int      @default(0)
  reviews     Review[]
}

model Review {
  id              String    @id @default(cuid())
  rating          Int
  text            String
  checkinVerified Boolean   @default(false)
  trustTier       TrustTier @default(UNVERIFIED)
  placeId         String
  place           Place     @relation(fields: [placeId], references: [id])
}
```

---

## 💻 Getting Started Locally

### Prerequisites
- Node.js 18.x or higher
- npm / pnpm / yarn

### 1. Clone & Install
```bash
git clone https://github.com/Aditya1kumbhar/rateit-platform.git
cd rateit-platform
npm install
```

### 2. Set Up Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rateit"
NEXT_PUBLIC_SUPABASE_URL="https://your-supabase-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

### 3. Run Prisma Migrations & Seed
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

Run E2E tests using Playwright:
```bash
npx playwright test
```

---

## 📄 License & Legal Notice

Distributed under the MIT License. RateIT complies with the Indian Information Technology Act, 2000 & Intermediary Guidelines Rules 2021.

---

*Built with ❤️ for Pune students and residents.*
