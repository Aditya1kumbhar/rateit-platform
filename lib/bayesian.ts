import { CONFIG } from "./personalization-config"

/**
 * Bayesian Average Rating
 * Formula: displayed rating = (v / (v + m)) * R + (m / (v + m)) * C
 *
 * @param reviewCount v: review count for the place
 * @param placeMean R: average rating of the place (1..5)
 * @param globalMean C: global mean rating across all places in the city (default ~4.0)
 * @param priorWeight m: CONFIG weight (default 10)
 */
export function calculateBayesianRating(
  reviewCount: number,
  placeMean: number,
  globalMean: number = CONFIG.defaultGlobalMean,
  priorWeight: number = CONFIG.bayesianM
): number {
  if (reviewCount <= 0) {
    return globalMean
  }
  const v = reviewCount
  const R = placeMean
  const m = priorWeight
  const C = globalMean

  const rating = (v / (v + m)) * R + (m / (v + m)) * C
  return Math.round(rating * 100) / 100
}

/**
 * Rescales a 1..5 star rating to a 0..1 float for normalized mathematical scoring.
 * 1 star -> 0.0, 5 stars -> 1.0 (or clamped rating / 5)
 */
export function rescaleRatingToNormalized(rating: number): number {
  if (rating <= 0) return 0
  return Math.max(0, Math.min(1.0, rating / 5.0))
}

let cachedGlobalMean: { value: number; expiresAt: number } | null = null

/**
 * C = global mean (cached 1 hour in memory, or 4.0 if DB empty).
 */
export async function getGlobalMeanRating(prismaClient?: any): Promise<number> {
  const now = Date.now()
  if (cachedGlobalMean && cachedGlobalMean.expiresAt > now) {
    return cachedGlobalMean.value
  }

  try {
    if (prismaClient && typeof prismaClient.review?.aggregate === "function") {
      const agg = await prismaClient.review.aggregate({
        _avg: { rating: true },
        where: { isHidden: false },
      })
      if (agg._avg?.rating !== null && agg._avg?.rating !== undefined && !isNaN(agg._avg.rating)) {
        const val = Math.round(agg._avg.rating * 100) / 100
        cachedGlobalMean = {
          value: val,
          expiresAt: now + 60 * 60 * 1000, // 1 hour cache
        }
        return val
      }
    }
  } catch (err) {
    console.warn("Failed to fetch global mean rating, falling back to CONFIG default:", err)
  }

  return CONFIG.defaultGlobalMean
}

/**
 * Whenever a review is added/edited/deleted, recompute the place's Bayesian rating
 * and store both raw avgRating and bayesianRating on Place.
 */
export async function recomputePlaceRatings(
  tx: any,
  placeId: string
): Promise<{ avgRating: number; weightedRating: number; reviewCount: number; bayesianRating: number }> {
  const placeReviews = await tx.review.findMany({
    where: { placeId, isHidden: false },
    select: { rating: true, trustWeight: true },
  })
  const reviewCount = placeReviews.length
  const avgRating = reviewCount > 0
    ? placeReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviewCount
    : 0
  const totalWeight = placeReviews.reduce((sum: number, r: { trustWeight: number }) => sum + r.trustWeight, 0)
  const weightedRating = totalWeight > 0
    ? placeReviews.reduce((sum: number, r: { rating: number; trustWeight: number }) => sum + r.rating * r.trustWeight, 0) / totalWeight
    : avgRating

  const globalMean = await getGlobalMeanRating(tx)
  const bayesianRating = calculateBayesianRating(reviewCount, avgRating, globalMean)

  await tx.place.update({
    where: { id: placeId },
    data: {
      avgRating: Math.round(avgRating * 100) / 100,
      weightedRating: Math.round(weightedRating * 100) / 100,
      reviewCount,
      bayesianRating,
    },
  })

  return {
    avgRating: Math.round(avgRating * 100) / 100,
    weightedRating: Math.round(weightedRating * 100) / 100,
    reviewCount,
    bayesianRating,
  }
}
