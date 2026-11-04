import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { NextResponse } from "next/server"
import { CONFIG } from "./personalization-config"

const hasValue = (value: string | undefined) => Boolean(value && !value.startsWith("your-"))

export const isRateLimitConfigured =
  hasValue(process.env.UPSTASH_REDIS_REST_URL) && hasValue(process.env.UPSTASH_REDIS_REST_TOKEN)

const redis = isRateLimitConfigured ? Redis.fromEnv() : null

function createLimiter(points: number, duration: `${number} ${"ms" | "s" | "m" | "h" | "d"}`, prefix: string) {
  if (!redis) return null
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(points, duration),
    analytics: true,
    prefix: `@upstash/ratelimit/${prefix}`,
  })
}

// Rate limiters configured according to task specifications
export const submitReviewRateLimit = createLimiter(
  CONFIG.rateLimits.reviewSubmit.points,
  CONFIG.rateLimits.reviewSubmit.duration,
  "rateit-submit"
)

export const authRateLimit = createLimiter(
  CONFIG.rateLimits.authAttempts.points,
  CONFIG.rateLimits.authAttempts.duration,
  "rateit-auth"
)

export const eventsRateLimit = createLimiter(
  CONFIG.rateLimits.eventsIngest.points,
  CONFIG.rateLimits.eventsIngest.duration,
  "rateit-events"
)

export const searchRateLimit = createLimiter(
  CONFIG.rateLimits.search.points,
  CONFIG.rateLimits.search.duration,
  "rateit-search"
)

export const feedRateLimit = createLimiter(
  CONFIG.rateLimits.feed.points,
  CONFIG.rateLimits.feed.duration,
  "rateit-feed"
)

export const generalApiRateLimit = createLimiter(
  CONFIG.rateLimits.generalApi.points,
  CONFIG.rateLimits.generalApi.duration,
  "rateit-general"
)

// Legacy alias for compatibility
export const otpRateLimit = authRateLimit

// Helper to get client IP for rate limiting in Next.js App Router
export function getIpFromRequest(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }
  
  const realIp = request.headers.get("x-real-ip")
  if (realIp) {
    return realIp.trim()
  }
  
  return "127.0.0.1"
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  retryAfter: number
}

/**
 * Evaluates rate limit against Upstash Redis if configured.
 * In dev / test when Upstash is not configured, allows requests through.
 */
export async function enforceRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<RateLimitResult> {
  if (!limiter) {
    return {
      success: true,
      limit: 1000,
      remaining: 999,
      reset: Date.now() + 60000,
      retryAfter: 0,
    }
  }

  const { success, limit, remaining, reset } = await limiter.limit(identifier)
  const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000))

  return {
    success,
    limit,
    remaining,
    reset,
    retryAfter,
  }
}

/**
 * Creates standard 429 response with Retry-After and rate limit headers.
 */
export function rateLimitResponse(result: RateLimitResult, customMessage?: string): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: customMessage || "Too many requests. Please try again later.",
      retryAfter: result.retryAfter,
    },
    {
      status: 429,
      headers: {
        "Retry-After": result.retryAfter.toString(),
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.reset.toString(),
      },
    }
  )
}
