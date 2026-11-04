import { prisma } from "../prisma"
import { haversineDistance } from "../geolocation"
import { CONFIG } from "../personalization-config"
import { PlaceForScoring } from "./scoring"

export interface CandidateGenerationResult {
  candidates: PlaceForScoring[]
  globalMean: number
  explorationCandidates: PlaceForScoring[]
}

/**
 * P3.2 Candidate Generation
 * Union of 4 sources, deduplicated by place:
 * (a) places within 10 km of the user
 * (b) top places in the user's top-3 affinity categories city-wide
 * (c) places with reviews in the last 14 days
 * (d) trending: highest 7-day review velocity in the city
 */
export async function generateFeedCandidates(
  userLat: number,
  userLng: number,
  userTopCategories: string[] = []
): Promise<CandidateGenerationResult> {
  const now = new Date()
  const fourteenDaysAgo = new Date(now.getTime() - CONFIG.feedRecentReviewsDays * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - CONFIG.feedTrendingDays * 24 * 60 * 60 * 1000)

  // 1. Fetch places with reviews for computation of review velocity & latest review date
  const allPlaces = await prisma.place.findMany({
    include: {
      reviews: {
        where: { isHidden: false },
        select: {
          publishDate: true,
          rating: true,
          trustWeight: true,
          user: { select: { trustScore: true } },
        },
        orderBy: { publishDate: "desc" },
      },
    },
  })

  if (allPlaces.length === 0) {
    return {
      candidates: [],
      globalMean: CONFIG.defaultGlobalMean,
      explorationCandidates: [],
    }
  }

  // Calculate city global mean rating across all places
  let totalRatingSum = 0
  let totalRatedCount = 0
  for (const p of allPlaces) {
    if (p.reviewCount > 0 && p.avgRating > 0) {
      totalRatingSum += p.avgRating * p.reviewCount
      totalRatedCount += p.reviewCount
    }
  }
  const globalMean = totalRatedCount > 0 ? totalRatingSum / totalRatedCount : CONFIG.defaultGlobalMean

  // Map enriched metadata
  const enrichedMap = new Map<string, PlaceForScoring & { velocity7d: number }>()

  for (const place of allPlaces) {
    const distMeters = haversineDistance(userLat, userLng, place.latitude, place.longitude)
    const distanceKm = Math.round((distMeters / 1000) * 10) / 10

    const latestReviewDate = place.reviews.length > 0 ? place.reviews[0].publishDate : null

    const recent7DayCount = place.reviews.filter((r) => new Date(r.publishDate) >= sevenDaysAgo).length

    // Average reviewer trust score
    let reviewerTrustAvg: number | null = null
    if (place.reviews.length > 0) {
      const trustSum = place.reviews.reduce((acc, r) => acc + (r.user?.trustScore ?? 50), 0)
      reviewerTrustAvg = trustSum / place.reviews.length
    }

    enrichedMap.set(place.id, {
      id: place.id,
      name: place.name,
      category: place.category,
      latitude: place.latitude,
      longitude: place.longitude,
      avgRating: place.avgRating,
      reviewCount: place.reviewCount,
      distanceKm,
      latestReviewDate,
      avgReviewerTrust: reviewerTrustAvg,
      velocity7d: recent7DayCount,
    })
  }

  const candidateIds = new Set<string>()

  // (a) places within 10 km
  for (const [id, item] of enrichedMap.entries()) {
    if (item.distanceKm <= CONFIG.feedRadiusKm) {
      candidateIds.add(id)
    }
  }

  // (b) top places in user's top-3 affinity categories city-wide
  const top3AffinityCats = userTopCategories.slice(0, 3)
  if (top3AffinityCats.length > 0) {
    const affinityMatches = Array.from(enrichedMap.values())
      .filter((p) => top3AffinityCats.includes(p.category))
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 20)

    for (const match of affinityMatches) {
      candidateIds.add(match.id)
    }
  }

  // (c) places with reviews in last 14 days
  for (const [id, item] of enrichedMap.entries()) {
    if (item.latestReviewDate && new Date(item.latestReviewDate) >= fourteenDaysAgo) {
      candidateIds.add(id)
    }
  }

  // (d) trending: highest 7-day review velocity in the city (top 15)
  const trending = Array.from(enrichedMap.values())
    .sort((a, b) => b.velocity7d - a.velocity7d)
    .slice(0, 15)

  for (const item of trending) {
    candidateIds.add(item.id)
  }

  // Fallback: if candidates set is small (e.g. cold start with few places in 10km), include top rated city-wide places
  if (candidateIds.size < 10) {
    const highestRated = Array.from(enrichedMap.values())
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 20)
    for (const item of highestRated) {
      candidateIds.add(item.id)
    }
  }

  const finalCandidates: PlaceForScoring[] = []
  const explorationPool: PlaceForScoring[] = []

  for (const id of candidateIds) {
    const item = enrichedMap.get(id)
    if (item) {
      finalCandidates.push(item)
    }
  }

  // Exploration pool: all places in DB with reviewCount < 10
  for (const item of enrichedMap.values()) {
    if (item.reviewCount < CONFIG.explorationMaxReviews) {
      explorationPool.push(item)
    }
  }

  return {
    candidates: finalCandidates,
    globalMean,
    explorationCandidates: explorationPool,
  }
}
