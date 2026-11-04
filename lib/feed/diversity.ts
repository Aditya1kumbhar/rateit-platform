import { CONFIG } from "../personalization-config"
import { ScoredPlaceResult } from "./scoring"

/**
 * P3.4 Diversity Re-ranking (MMR-style)
 * Greedily selects candidates so that:
 * 1. No category appears more than twice in the first 10 results.
 * 2. Penalizes each subsequent same-category pick by CONFIG factor 0.85 per prior pick of that category.
 */
export function applyDiversityReranking(scoredItems: ScoredPlaceResult[]): ScoredPlaceResult[] {
  const result: ScoredPlaceResult[] = []
  const remaining = [...scoredItems]
  const categoryCounts = new Map<string, number>()

  while (remaining.length > 0) {
    let bestIndex = -1
    let bestAdjustedScore = -Infinity

    for (let i = 0; i < remaining.length; i++) {
      const item = remaining[i]
      const cat = item.place.category
      const count = categoryCounts.get(cat) || 0

      // In top 10 results, strictly cap any category to max 2 occurrences
      if (result.length < 10 && count >= CONFIG.diversityMaxPerCategoryTop10) {
        // Skip this candidate for top 10 if there are alternative categories available
        const hasAlternativeCategory = remaining.some(
          (other) => (categoryCounts.get(other.place.category) || 0) < CONFIG.diversityMaxPerCategoryTop10
        )
        if (hasAlternativeCategory) {
          continue
        }
      }

      // Penalty factor: 0.85 ^ count
      const penalty = Math.pow(CONFIG.diversityPenaltyPerPriorPick, count)
      const adjustedScore = item.score * penalty

      if (adjustedScore > bestAdjustedScore) {
        bestAdjustedScore = adjustedScore
        bestIndex = i
      }
    }

    if (bestIndex === -1) {
      // If all remaining candidates were skipped by top 10 cap (e.g. only 1 category exists in DB), pick the first one
      bestIndex = 0
    }

    const selected = remaining.splice(bestIndex, 1)[0]
    result.push(selected)

    const currentCatCount = categoryCounts.get(selected.place.category) || 0
    categoryCounts.set(selected.place.category, currentCatCount + 1)
  }

  return result
}

/**
 * P3.5 Exploration Slots Insertion
 * 15% of feed slots (positions 5, 11, 17, then every 7th) are reserved for exploration:
 * high-quality places (quality >= 0.6) with fewer than 10 reviews.
 */
export function injectExplorationSlots(
  rankedFeed: ScoredPlaceResult[],
  explorationPool: ScoredPlaceResult[]
): { feed: ScoredPlaceResult[]; explorationSlots: number[] } {
  if (explorationPool.length === 0) {
    return { feed: rankedFeed, explorationSlots: [] }
  }

  const feed = [...rankedFeed]
  const explorationSlots: number[] = []
  const availableExploration = [...explorationPool]

  // Filter pool to ensure quality >= 0.6 and reviewCount < 10
  const eligible = availableExploration.filter(
    (item) => item.breakdown.quality >= CONFIG.explorationMinQuality && item.place.reviewCount < CONFIG.explorationMaxReviews
  )

  if (eligible.length === 0) {
    return { feed, explorationSlots: [] }
  }

  // Shuffle exploration items
  for (let i = eligible.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[eligible[i], eligible[j]] = [eligible[j], eligible[i]]
  }

  // Slots: positions 5, 11, 17 (0-indexed: 4, 10, 16), then every 7th (23, 30, ...)
  const targetIndices: number[] = [...CONFIG.explorationSlots]
  let nextSlot = targetIndices[targetIndices.length - 1] + CONFIG.explorationInterval
  while (nextSlot < feed.length + eligible.length) {
    targetIndices.push(nextSlot)
    nextSlot += CONFIG.explorationInterval
  }

  let explorationIdx = 0

  for (const slotIndex of targetIndices) {
    if (explorationIdx >= eligible.length) break
    if (slotIndex <= feed.length) {
      const explorationCandidate = eligible[explorationIdx]
      // Ensure exploration candidate isn't already in feed at a different position
      const existingIdx = feed.findIndex((f) => f.place.id === explorationCandidate.place.id)
      if (existingIdx !== -1) {
        feed.splice(existingIdx, 1)
      }

      feed.splice(slotIndex, 0, explorationCandidate)
      explorationSlots.push(slotIndex + 1) // 1-indexed for logging/reporting (5, 11, 17)
      explorationIdx++
    }
  }

  return { feed, explorationSlots }
}

