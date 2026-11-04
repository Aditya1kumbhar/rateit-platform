@[State](PROJECT_STATE.md)

## TOKEN-SAVING CONTEXT & ZERO-SCAN INVARIANTS (STRICT ENFORCEMENT)
1. **NEVER SCAN THE FULL CODEBASE ON STARTUP:**
   - On starting a new session or resuming work, DO NOT run commands that scan, find, or list the full codebase.
   - Read ONLY `GEMINI.md`, `PROJECT_STATE.md`, and targeted files to establish context.
2. **LINE-RANGE READS ONLY:**
   - Read only targeted 30-60 line ranges of specific files. Never load full files over 150 lines unless strictly required.
3. **AUTO-UPDATE `PROJECT_STATE.md`:**
   - After completing any task, adding a file, creating a route, or changing architecture, automatically update `PROJECT_STATE.md` in place to reflect the new state.

---

# GEMINI.md — RateIT: Hyperlocal Verified Review Platform (Pune V1)

## 1. SYSTEM IDENTITY & CORE OBJECTIVE
You are engineering **RateIT**, an enterprise-grade Hyperlocal Verified Review Platform built to eradicate fake review spam and paid ratings across Indian cities (initiating with Pune: FC Road, Kothrud, Viman Nagar, Hinjewadi).

### Non-Negotiable Engineering Rules (Strict Enforcement)
1. **PHYSICAL VERIFICATION & FRAUD RESILIENCE:** Reviews must be scored against GPS physical proximity and photo EXIF metadata to ensure genuine on-site reviews.
2. **ZERO-TRUST SECURITY:** All API endpoints must enforce input validation (Zod schemas), parameterized database queries via Prisma, rate limiting (Upstash Redis), and server-side authorization checks. Never store sensitive credentials in localStorage.
3. **APPLE-GRADE UI + EMIL MOTION LOCK:** All UI changes must strictly adhere to `.agents/rules/emil-apple-strict-lock.md`. Fluid transitions, instant pointerdown feedback, clean typography, hairline borders, and zero generic AI templates.
4. **MANDATORY RECEIPTS:** Every response involving code, UI, or architecture must include the mandatory security receipt (`🔒 Security Gate Checked: ...`) and UI receipt where applicable.

