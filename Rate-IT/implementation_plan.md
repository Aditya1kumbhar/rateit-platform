# Comprehensive Backend Security & Stabilization Plan

The recent audit revealed several critical vulnerabilities and architectural flaws in the backend, primarily stemming from incomplete mock implementations, insecure identity management, and missing database transactions.

This plan addresses all issues to make the application secure, production-ready, and fully integrated with Prisma and Supabase.

## User Review Required

> [!WARNING]
> This plan will fundamentally alter how the database schema and authentication work. 
> - I will modify `prisma/schema.prisma` to make `phone` optional, add `email`, and create a `BusinessClaim` model.
> - I will drop the mock `/api/auth` route completely in favor of pure Supabase server-side session authentication.
> - **Are you okay with generating the initial Prisma migration (`prisma/migrations`) after these schema changes?** (Note: Since we are using Supabase pooler, we may need to temporarily use the direct DB connection for the migration).

## Proposed Changes

---

### 1. Database Schema & Migrations (`prisma/schema.prisma`)
- Make `phone` optional and add `email String? @unique` to `User`.
- Change `photoUrls` in `Review` to have `@default([])`.
- Create a `BusinessClaim` model to track manual and auto claim requests securely.
- Create a `ListItem` model to normalize the relationship between `List` and `Place`.
- Generate the initial migration (`npx prisma migrate dev --name init`).

### 2. API Routes: Security & Transactions

#### [MODIFY] `app/api/reviews/route.ts`
- **Auth**: Extract `userId` strictly from the server-side Supabase session (`supabase.auth.getUser()`).
- **Validation**: Implement Zod to validate rating range, text length, and GPS coordinates.
- **Transactions**: Use `$transaction` to atomically insert the review, recalculate `Place.avgRating` and `reviewCount`, and execute the `computeTrustScore` engine to update the user's trust profile simultaneously.

#### [MODIFY] `app/api/business/claim/route.ts`
- **Auth**: Require an authenticated Supabase user.
- **Logic**: Insert a `BusinessClaim` record instead of immediately updating the `Place` status (unless auto-verified via a matching phone number).

#### [MODIFY] `app/api/places/route.ts`
- **GET**: Implement pagination (`take`, `skip`). Use Prisma's `select` to expose only public fields (hide `ownerPhone` and `businessPhone`).
- **POST**: Require admin/moderator role in the Supabase session to create places.

#### [MODIFY] `app/api/profile/route.ts` & `app/api/lists/route.ts`
- Look up users exclusively by their Supabase `id`, avoiding phone/email conflicts.
- Implement strict Zod validation for inputs.

#### [DELETE] `app/api/auth/route.ts`
- Remove this insecure mock route entirely. The app will rely purely on Supabase auth hooks or middleware for identity.

#### [MODIFY] `app/api/seed/route.ts` & `prisma/seed.ts`
- Remove the HTTP seed route or guard it with a strict development-only check + secret token.
- Update `prisma/seed.ts` to be non-destructive (upsert instead of delete all) and include `photoUrls: []`.

### 3. Frontend Integration

#### [MODIFY] `components/enhanced-rate-modal.tsx`
- Replace `setTimeout` mock success with an actual `fetch('/api/reviews', { method: 'POST' })` call.

#### [MODIFY] `app/business/claim/[placeId]/page.tsx`
- Connect the form to actually send the payload to `/api/business/claim`.

#### [MODIFY] `lib/userAuth.ts`
- Remove the `localStorage` fallback. Rely exclusively on the Supabase session (`supabase.auth.getSession()`).

### 4. Configuration & CI

#### [MODIFY] `next.config.mjs`
- Remove `ignoreDuringBuilds` for ESLint and TypeScript to ensure CI blocks on errors.

#### [MODIFY] `lib/ratelimit.ts`
- Add environment validation. If Upstash variables are empty, fail-close or log a critical warning in production.

## Verification Plan

### Automated Tests
- Run `npx tsc --noEmit` and `npx eslint .` to guarantee the codebase is build-clean.
- Execute Playwright tests to ensure the UI flows don't crash with the real API integrations.

### Manual Verification
- Attempt to submit a review without logging in (should fail 401).
- Submit a valid review and verify the transaction correctly updates the place rating.
- Fetch `/api/places` and confirm sensitive fields are hidden.
