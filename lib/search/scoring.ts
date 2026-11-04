import { CONFIG } from "../personalization-config"
import { calculateBayesianRating, rescaleRatingToNormalized } from "../bayesian"
import { calculateTrigramSimilarity } from "./trigram"

export interface SearchPlaceCandidate {
  id: string
  name: string
  category: string
  address: string
  city?: string
  latitude: number
  longitude: number
  avgRating: number
  reviewCount: number
  distanceKm: number
  tags?: string[]
  description?: string | null
  priceRange?: string | null
  imageUrl?: string | null
}

export interface ScoredSearchResult {
  place: SearchPlaceCandidate
  score: number
  textRelevance: number
  quality: number
  proximity: number
  affinityMatch: number
  effectiveTextWeight: number
  effectiveAffinityWeight: number
}

/**
 * P4.2 Search Score Formula:
 * score = 0.40*textRelevance + 0.20*quality + 0.20*proximity + 0.20*affinityMatch
 *
 * Anonymous users (or cold start blend factor 0):
 * Zero personalization -> redistribute affinity weight (0.20) to textRelevance (0.60 * textRelevance).
 */
export function scoreSearchCandidate(
  place: SearchPlaceCandidate,
  query: string,
  categoryAffinity: number = 0,
  coldStartBlend: number = 0,
  isAnonymous: boolean = false,
  globalMean: number = CONFIG.defaultGlobalMean
): ScoredSearchResult {
  const w = CONFIG.searchWeights

  // 1. Text Relevance: max of place name similarity, category similarity, or tag similarity
  const nameSim = calculateTrigramSimilarity(query, place.name)
  const catSim = query.toUpperCase() === place.category ? 1.0 : calculateTrigramSimilarity(query, place.category)
  let tagSim = 0
  if (place.tags && place.tags.length > 0) {
    for (const tag of place.tags) {
      const s = calculateTrigramSimilarity(query, tag)
      if (s > tagSim) tagSim = s
    }
  }

  const textRelevance = Math.max(nameSim, catSim, tagSim)

  // 2. Quality: Bayesian average rating rescaled to 0..1
  const bayesian = calculateBayesianRating(place.reviewCount, place.avgRating, globalMean)
  const quality = rescaleRatingToNormalized(bayesian)

  // 3. Proximity: 1 / (1 + distanceKm)
  const proximity = 1 / (1 + Math.max(0, place.distanceKm))

  // 4. Affinity Match
  const affinityMatch = Math.max(0, Math.min(1.0, categoryAffinity))

  // Weights calculation:
  // Anonymous users or cold start users (blend factor 0):
  // Redistribute affinity weight to textRelevance
  const effectiveColdStart = isAnonymous ? 0 : coldStartBlend

  const effectiveAffinityWeight = Math.round(w.affinityMatch * effectiveColdStart * 100) / 100
  const effectiveTextWeight = Math.round((w.textRelevance + w.affinityMatch * (1 - effectiveColdStart)) * 100) / 100

  const score =
    effectiveTextWeight * textRelevance +
    w.quality * quality +
    w.proximity * proximity +
    effectiveAffinityWeight * affinityMatch

  return {
    place,
    score: Math.round(score * 10000) / 10000,
    textRelevance,
    quality,
    proximity,
    affinityMatch,
    effectiveTextWeight,
    effectiveAffinityWeight,
  }
}
