import { describe, it, expect } from "vitest"
import { scoreFeedPlace, PlaceForScoring } from "@/lib/feed/scoring"
import { scoreSearchCandidate, SearchPlaceCandidate } from "@/lib/search/scoring"
import { computeColdStartBlendFactor } from "@/lib/interest"
import { CONFIG } from "@/lib/personalization-config"

describe("Seeded Personalization Proof & Verification", () => {
  const referenceDate = new Date("2026-11-01T12:00:00Z")

  const cafePlace: PlaceForScoring = {
    id: "cafe-fc-road",
    name: "FC Road Cafe Culture",
    category: "CAFE",
    latitude: 18.5204,
    longitude: 73.8567,
    avgRating: 4.4,
    reviewCount: 35,
    distanceKm: 2.0,
    latestReviewDate: new Date("2026-10-31T12:00:00Z"),
    avgReviewerTrust: 80,
  }

  const pgPlace: PlaceForScoring = {
    id: "pg-kothrud",
    name: "Kothrud Scholars PG",
    category: "PG_HOSTEL",
    latitude: 18.5074,
    longitude: 73.8077,
    avgRating: 4.4,
    reviewCount: 35,
    distanceKm: 2.0,
    latestReviewDate: new Date("2026-10-31T12:00:00Z"),
    avgReviewerTrust: 80,
  }

  it("User 1 (high CAFE affinity) ranks CAFE over PG_HOSTEL", () => {
    // User 1 has 25 tracked events (warm, blend = 1.0), affinity for CAFE = 1.0, PG = 0.0
    const userCafeBlend = computeColdStartBlendFactor(25)
    expect(userCafeBlend).toBe(1.0)

    const cafeScore = scoreFeedPlace(cafePlace, 1.0, userCafeBlend, 4.0, referenceDate)
    const pgScore = scoreFeedPlace(pgPlace, 0.0, userCafeBlend, 4.0, referenceDate)

    expect(cafeScore.score).toBeGreaterThan(pgScore.score)
    expect(cafeScore.score - pgScore.score).toBeCloseTo(CONFIG.feedWeights.affinityMatch, 2)
  })

  it("User 2 (high PG_HOSTEL affinity) ranks PG_HOSTEL over CAFE", () => {
    // User 2 has 25 tracked events (warm, blend = 1.0), affinity for PG = 1.0, CAFE = 0.0
    const userPgBlend = computeColdStartBlendFactor(25)
    expect(userPgBlend).toBe(1.0)

    const cafeScore = scoreFeedPlace(cafePlace, 0.0, userPgBlend, 4.0, referenceDate)
    const pgScore = scoreFeedPlace(pgPlace, 1.0, userPgBlend, 4.0, referenceDate)

    expect(pgScore.score).toBeGreaterThan(cafeScore.score)
    expect(pgScore.score - cafeScore.score).toBeCloseTo(CONFIG.feedWeights.affinityMatch, 2)
  })

  it("Anonymous user feed ordering equals cold-start user ordering (affinity weight redistributed to quality)", () => {
    const anonymousBlend = 0.0
    const coldStartBlend = computeColdStartBlendFactor(0)
    expect(coldStartBlend).toBe(0.0)

    // For both identical-stat places, anonymous and cold-start give exactly identical scores
    const anonCafe = scoreFeedPlace(cafePlace, 0.0, anonymousBlend, 4.0, referenceDate)
    const coldCafe = scoreFeedPlace(cafePlace, 1.0, coldStartBlend, 4.0, referenceDate)

    expect(anonCafe.score).toBe(coldCafe.score)
  })

  it("Personalized search scoring differentiates users with opposite affinities for generic queries", () => {
    const searchCandidateCafe: SearchPlaceCandidate = {
      id: "search-cafe",
      name: "Best Place Cafe",
      category: "CAFE",
      address: "FC Road, Pune",
      latitude: 18.5204,
      longitude: 73.8567,
      avgRating: 4.5,
      reviewCount: 40,
      distanceKm: 1.5,
    }

    const searchCandidatePg: SearchPlaceCandidate = {
      id: "search-pg",
      name: "Best Place PG Hostel",
      category: "PG_HOSTEL",
      address: "Kothrud, Pune",
      latitude: 18.5074,
      longitude: 73.8077,
      avgRating: 4.5,
      reviewCount: 40,
      distanceKm: 1.5,
    }

    const user1Blend = 1.0 // warm
    const user2Blend = 1.0 // warm

    // User 1 (Cafe lover)
    const u1Cafe = scoreSearchCandidate(searchCandidateCafe, "best place", 1.0, user1Blend)
    const u1Pg = scoreSearchCandidate(searchCandidatePg, "best place", 0.0, user1Blend)
    expect(u1Cafe.score).toBeGreaterThan(u1Pg.score)

    // User 2 (PG lover)
    const u2Cafe = scoreSearchCandidate(searchCandidateCafe, "best place", 0.0, user2Blend)
    const u2Pg = scoreSearchCandidate(searchCandidatePg, "best place", 1.0, user2Blend)
    expect(u2Pg.score).toBeGreaterThan(u2Cafe.score)
  })

  it("Cold-start blend factor ramps linearly between 0 and 20 events", () => {
    expect(computeColdStartBlendFactor(0)).toBe(0.0)
    expect(computeColdStartBlendFactor(5)).toBe(0.25)
    expect(computeColdStartBlendFactor(10)).toBe(0.5)
    expect(computeColdStartBlendFactor(15)).toBe(0.75)
    expect(computeColdStartBlendFactor(20)).toBe(1.0)
    expect(computeColdStartBlendFactor(100)).toBe(1.0)
  })
})
