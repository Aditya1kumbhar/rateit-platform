import { CONFIG } from "../personalization-config"
import { calculateBayesianRating, rescaleRatingToNormalized } from "../bayesian"

export interface PlaceForScoring {
  id: string
  name: string
  category: string
  latitude: number
  longitude: number
  avgRating: number
  reviewCount: number
  distanceKm: number
  latestReviewDate?: Date | string | null
  avgReviewerTrust?: number | null
}

export interface ScoredPlaceResult {
  place: PlaceForScoring
  score: number
  breakdown: {
    affinityMatch: number
    quality: number
    proximity: number
    freshness: number
    trust: number
    effectiveAffinityWeight: number
    effectiveQualityWeight: number
  }
}

/**
 * P3.3 Scoring Formula:
 * score = 0.35*affinityMatch + 0.25*quality + 0.20*proximity + 0.10*freshness + 0.10*trust
 *
 * Cold start blend factor (0..1):
 * Multiplies the affinityMatch term by coldStartBlend and redistributes that weight to quality.
 */
export function scoreFeedPlace(
  place: PlaceForScoring,
  userCategoryAffinity: number, // 0..1 float
  coldStartBlend: number,       // 0..1 float (events / 20)
  globalMean: number = CONFIG.defaultGlobalMean,
  referenceDate: Date = new Date()
): ScoredPlaceResult {
  const w = CONFIG.feedWeights

  // 1. Affinity Match (0 if none)
  const affinityMatch = Math.max(0, Math.min(1.0, userCategoryAffinity))

  // 2. Bayesian Quality rescaled to 0..1
  const bayesianRating = calculateBayesianRating(place.reviewCount, place.avgRating, globalMean)
  const quality = rescaleRatingToNormalized(bayesianRating)

  // 3. Proximity: 1 / (1 + distanceKm)
  const proximity = 1 / (1 + Math.max(0, place.distanceKm))

  // 4. Freshness: 0.5 ^ (days since latest review / 14), 0 if no reviews
  let freshness = 0
  if (place.latestReviewDate) {
    const reviewTime = new Date(place.latestReviewDate).getTime()
    const daysSince = Math.max(0, (referenceDate.getTime() - reviewTime) / (1000 * 60 * 60 * 24))
    freshness = Math.pow(0.5, daysSince / CONFIG.feedRecentReviewsDays)
  }

  // 5. Trust: average trust score of its reviewers / 100
  const trustScore = place.avgReviewerTrust !== null && place.avgReviewerTrust !== undefined
    ? place.avgReviewerTrust
    : 50.0
  const trust = Math.max(0, Math.min(1.0, trustScore / 100.0))

  // Cold start weight redistribution:
  // effectiveAffinityWeight = 0.35 * coldStartBlend
  // effectiveQualityWeight = 0.25 + 0.35 * (1 - coldStartBlend)
  const effectiveAffinityWeight = w.affinityMatch * coldStartBlend
  const effectiveQualityWeight = w.quality + (w.affinityMatch * (1 - coldStartBlend))

  const score =
    effectiveAffinityWeight * affinityMatch +
    effectiveQualityWeight * quality +
    w.proximity * proximity +
    w.freshness * freshness +
    w.trust * trust

  return {
    place,
    score: Math.round(score * 10000) / 10000,
    breakdown: {
      affinityMatch,
      quality,
      proximity,
      freshness,
      trust,
      effectiveAffinityWeight,
      effectiveQualityWeight,
    },
  }
}

