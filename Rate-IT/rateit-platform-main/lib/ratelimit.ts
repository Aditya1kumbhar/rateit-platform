import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const hasValue = (value: string | undefined) => Boolean(value && !value.startsWith("your-"))

export const isRateLimitConfigured =
  hasValue(process.env.UPSTASH_REDIS_REST_URL) && hasValue(process.env.UPSTASH_REDIS_REST_TOKEN)

const redis = isRateLimitConfigured ? Redis.fromEnv() : null

// Keep optional services from being constructed with example environment values.
export const submitReviewRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "10 m"),
      analytics: true,
      prefix: "@upstash/ratelimit/rateit-submit",
    })
  : null

export const otpRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 h"),
      analytics: true,
      prefix: "@upstash/ratelimit/rateit-otp",
    })
  : null

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
