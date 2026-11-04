import { describe, it, expect } from "vitest"
import { scoreFeedPlace, PlaceForScoring } from "@/lib/feed/scoring"
import { applyDiversityReranking } from "@/lib/feed/diversity"
import { calculateDecayedAffinity } from "@/lib/interest"

describe("P3.6 Personalized Feed Reproducibility Tests", () => {
  const basePlace1: PlaceForScoring = {
    id: "place-cafe-1",
    name: "Good Luck Cafe",
    category: "CAFE",
    latitude: 18.5204,
    longitude: 73.8567,
    avgRating: 4.5,
    reviewCount: 50,
    distanceKm: 1.0,
    latestReviewDate: new Date("2026-10-30T10:00:00Z"),
    avgReviewerTrust: 80,
  }

  const basePlace2: PlaceForScoring = {
    id: "place-pg-1",
    name: "Sunrise PG",
    category: "PG_HOSTEL",
    latitude: 18.5204,
    longitude: 73.8567,
    avgRating: 4.5,
    reviewCount: 50,
    distanceKm: 1.0,
    latestReviewDate: new Date("2026-10-30T10:00:00Z"),
    avgReviewerTrust: 80,
  }

  const referenceDate = new Date("2026-11-01T12:00:00Z")

  it("(a) a high-affinity category outranks an identical low-affinity place for a warm user", () => {
    const warmUserBlend = 1.0 // 100% warm (>=20 events)
    const cafeAffinity = 1.0 // High affinity for CAFES
    const pgAffinity = 0.0 // Zero affinity for PG_HOSTELS

    const scoreCafe = scoreFeedPlace(basePlace1, cafeAffinity, warmUserBlend, 4.0, referenceDate)
    const scorePg = scoreFeedPlace(basePlace2, pgAffinity, warmUserBlend, 4.0, referenceDate)

    expect(scoreCafe.score).toBeGreaterThan(scorePg.score)
    // The exact difference corresponds to the affinity term: 0.35 * (1.0 - 0.0) = 0.35
    expect(scoreCafe.score - scorePg.score).toBeCloseTo(0.35, 2)
  })

  it("(b) a cold-start user gets the popularity/proximity order instead (affinity term zeroed out)", () => {
    const coldStartBlend = 0.0 // 0% warm (0 events)
    const cafeAffinity = 1.0
    const pgAffinity = 0.0

    const scoreCafe = scoreFeedPlace(basePlace1, cafeAffinity, coldStartBlend, 4.0, referenceDate)
    const scorePg = scoreFeedPlace(basePlace2, pgAffinity, coldStartBlend, 4.0, referenceDate)

    // For a cold start user with identical base stats, scores are identical because affinity weight is redistributed to quality
    expect(scoreCafe.score).toBe(scorePg.score)

    // Now test with place with higher quality/popularity
    const higherQualityPlace: PlaceForScoring = {
      ...basePlace2,
      id: "place-pg-popular",
      avgRating: 4.9,
      reviewCount: 150,
    }

    const scorePopular = scoreFeedPlace(higherQualityPlace, pgAffinity, coldStartBlend, 4.0, referenceDate)
    expect(scorePopular.score).toBeGreaterThan(scoreCafe.score)
  })

  it("(c) the diversity cap holds: no category appears more than twice in the first 10 results", () => {
    // Construct 15 items, 10 belonging to CAFE with high scores, 5 belonging to other categories
    const candidateResults = []

    for (let i = 1; i <= 10; i++) {
      candidateResults.push({
        place: {
          id: `cafe-${i}`,
          name: `Cafe ${i}`,
          category: "CAFE",
          latitude: 18.52,
          longitude: 73.85,
          avgRating: 4.8,
          reviewCount: 100,
          distanceKm: 1.0,
        },
        score: 0.90 - i * 0.01, // scores 0.89 down to 0.80
        breakdown: {} as any,
      })
    }

    for (let i = 1; i <= 4; i++) {
      candidateResults.push({
        place: {
          id: `pg-${i}`,
          name: `PG ${i}`,
          category: "PG_HOSTEL",
          latitude: 18.52,
          longitude: 73.85,
          avgRating: 4.2,
          reviewCount: 50,
          distanceKm: 1.0,
        },
        score: 0.70 - i * 0.01,
        breakdown: {} as any,
      })
    }

    for (let i = 1; i <= 4; i++) {
      candidateResults.push({
        place: {
          id: `coaching-${i}`,
          name: `Coaching ${i}`,
          category: "COACHING",
          latitude: 18.52,
          longitude: 73.85,
          avgRating: 4.0,
          reviewCount: 40,
          distanceKm: 1.0,
        },
        score: 0.65 - i * 0.01,
        breakdown: {} as any,
      })
    }

    for (let i = 1; i <= 2; i++) {
      candidateResults.push({
        place: {
          id: `restaurant-${i}`,
          name: `Restaurant ${i}`,
          category: "RESTAURANT",
          latitude: 18.52,
          longitude: 73.85,
          avgRating: 4.1,
          reviewCount: 45,
          distanceKm: 1.0,
        },
        score: 0.60 - i * 0.01,
        breakdown: {} as any,
      })
    }

    for (let i = 1; i <= 2; i++) {
      candidateResults.push({
        place: {
          id: `service-${i}`,
          name: `Local Service ${i}`,
          category: "LOCAL_SERVICE",
          latitude: 18.52,
          longitude: 73.85,
          avgRating: 4.3,
          reviewCount: 30,
          distanceKm: 1.0,
        },
        score: 0.58 - i * 0.01,
        breakdown: {} as any,
      })
    }

    const diversified = applyDiversityReranking(candidateResults)
    const top10 = diversified.slice(0, 10)

    const cafeCountInTop10 = top10.filter((item) => item.place.category === "CAFE").length

    // Under diversity rules, no category may appear more than twice in top 10
    expect(cafeCountInTop10).toBeLessThanOrEqual(2)
  })

  it("(d) decay halves an affinity after 30 days", () => {
    const initial = 12.0
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const effective = calculateDecayedAffinity(initial, thirtyDaysAgo, now)
    expect(effective).toBeCloseTo(6.0, 3)
  })
})
