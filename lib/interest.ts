import crypto from "crypto"
import { prisma } from "./prisma"
import { CONFIG } from "./personalization-config"

/**
 * Creates SHA-256 salted hash of IP or device fingerprint.
 * Salt is loaded from EVENT_HASH_SALT env variable, with dev fallback.
 */
export function hashWithSalt(value: string | undefined | null, saltName: string = "default"): string {
  if (!value) {
    return "anonymous"
  }
  const salt = process.env.EVENT_HASH_SALT || "rateit-dev-default-salt-pune-2026"
  return crypto.createHash("sha256").update(`${salt}:${saltName}:${value}`).digest("hex")
}

/**
 * Computes lazy decay on read for stored affinity.
 * Formula: effective_affinity = stored * 0.5 ^ (days_since_update / 30)
 */
export function calculateDecayedAffinity(stored: number, lastUpdated: Date, now: Date = new Date()): number {
  if (stored <= 0) return 0
  const msDiff = Math.max(0, now.getTime() - lastUpdated.getTime())
  const daysDiff = msDiff / (1000 * 60 * 60 * 24)
  const halfLives = daysDiff / CONFIG.decayHalfLifeDays
  return stored * Math.pow(0.5, halfLives)
}

/**
 * Normalizes an affinity map to 0..1 by dividing each category by the maximum category value.
 */
export function normalizeAffinityVector(rawAffinities: Map<string, number>): Map<string, number> {
  const normalized = new Map<string, number>()
  if (rawAffinities.size === 0) return normalized

  let maxVal = 0
  for (const val of rawAffinities.values()) {
    if (val > maxVal) maxVal = val
  }

  if (maxVal <= 0) {
    for (const key of rawAffinities.keys()) {
      normalized.set(key, 0)
    }
    return normalized
  }

  for (const [category, val] of rawAffinities.entries()) {
    normalized.set(category, Math.round((val / maxVal) * 1000) / 1000)
  }

  return normalized
}

/**
 * Retrieves normalized, decayed category affinity map for a user.
 */
export async function getUserCategoryAffinities(userId: string | null | undefined): Promise<Map<string, number>> {
  if (!userId) {
    return new Map()
  }

  const interests = await prisma.userInterest.findMany({
    where: { userId },
  })

  const now = new Date()
  const rawMap = new Map<string, number>()

  for (const item of interests) {
    const decayed = calculateDecayedAffinity(item.affinity, item.updatedAt, now)
    if (decayed > 0.01) {
      rawMap.set(item.category, decayed)
    }
  }

  return normalizeAffinityVector(rawMap)
}

/**
 * Computes the cold-start blend factor from event count.
 * Blend factor = events / 20, clamped to 0..1.
 */
export function computeColdStartBlendFactor(eventCount: number): number {
  return Math.min(1.0, Math.max(0.0, eventCount / CONFIG.coldStartEventThreshold))
}

/**
 * Computes the cold-start blend factor for a user.
 * A user with fewer than 20 tracked events is in cold start.
 * Blend factor = events / 20.
 */
export async function getUserColdStartBlend(userId: string | null | undefined): Promise<number> {
  if (!userId) {
    return 0 // Anonymous users get 0 personalization (cold start)
  }

  const count = await prisma.userEvent.count({
    where: { userId },
  })

  return computeColdStartBlendFactor(count)
}

/**
 * Updates UserInterest table on an incoming event.
 * Update rule: affinity += W(type)
 * Special dwell rule: 1 point per full 10s (max 3 points per view).
 */
export async function applyEventToUserInterest(
  userId: string,
  category: string | undefined | null,
  eventType: string,
  dwellMs?: number | null
): Promise<void> {
  if (!category) return

  let weight = CONFIG.eventWeights[eventType] ?? 0

  if (eventType === "place_dwell" && dwellMs) {
    const full10sUnits = Math.floor(dwellMs / 10_000)
    weight = Math.min(CONFIG.maxDwellPointsPerView, full10sUnits * CONFIG.dwellAffinityPer10s)
  }

  if (weight <= 0) return

  const existing = await prisma.userInterest.findUnique({
    where: {
      userId_category: {
        userId,
        category,
      },
    },
  })

  const now = new Date()

  if (existing) {
    // Apply lazy decay before adding new weight so historical affinity correctly decays over time
    const decayedPrior = calculateDecayedAffinity(existing.affinity, existing.updatedAt, now)
    await prisma.userInterest.update({
      where: {
        userId_category: {
          userId,
          category,
        },
      },
      data: {
        affinity: decayedPrior + weight,
        updatedAt: now,
      },
    })
  } else {
    await prisma.userInterest.create({
      data: {
        userId,
        category,
        affinity: weight,
        updatedAt: now,
      },
    })
  }
}
