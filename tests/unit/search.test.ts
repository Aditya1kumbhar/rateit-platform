import { describe, it, expect } from "vitest"
import { scoreSearchCandidate, SearchPlaceCandidate } from "@/lib/search/scoring"
import { calculateTrigramSimilarity } from "@/lib/search/trigram"

describe("P4.5 Personalized Search Unit Tests", () => {
  const cafePlace: SearchPlaceCandidate = {
    id: "place-1",
    name: "Vohuman Coffee House",
    category: "CAFE",
    address: "FC Road, Pune",
    latitude: 18.5204,
    longitude: 73.8567,
    avgRating: 4.6,
    reviewCount: 120,
    distanceKm: 0.8,
    tags: ["Coffee", "Chai", "Breakfast", "Bun Maska"],
  }

  const coachingPlace: SearchPlaceCandidate = {
    id: "place-2",
    name: "IIT JEE Coaching Academy",
    category: "COACHING",
    address: "FC Road, Pune",
    latitude: 18.5204,
    longitude: 73.8567,
    avgRating: 4.6,
    reviewCount: 120,
    distanceKm: 0.8,
    tags: ["JEE", "NEET", "Study"],
  }

  const pgPlace: SearchPlaceCandidate = {
    id: "place-3",
    name: "Green Villa PG",
    category: "PG_HOSTEL",
    address: "Kothrud, Pune",
    latitude: 18.5074,
    longitude: 73.8077,
    avgRating: 4.5,
    reviewCount: 60,
    distanceKm: 2.5,
    tags: ["Rooms", "WiFi"],
  }

  it("typo query ('cofee' against 'Coffee') yields high similarity > 0.2 and ranks coffee place in top", () => {
    const similarity = calculateTrigramSimilarity("cofee", "Coffee")
    expect(similarity).toBeGreaterThan(0.2)

    const candidates = [coachingPlace, cafePlace, pgPlace]

    const scored = candidates.map((p) => scoreSearchCandidate(p, "cofee", 0, 0, true))
    scored.sort((a, b) => b.score - a.score)

    expect(scored[0].place.id).toBe("place-1")
    expect(scored[0].place.name).toContain("Coffee")
  })

  it("two users with opposite affinities get measurably different orderings for the same generic query", () => {
    // Generic query: 'place' or 'best'
    const genericQuery = "place"

    // Candidate A is a Cafe, Candidate B is a PG hostel
    // Both have identical name similarity to "place"
    const candCafe: SearchPlaceCandidate = {
      ...cafePlace,
      name: "The Best Place",
      tags: [],
    }

    const candPg: SearchPlaceCandidate = {
      ...pgPlace,
      name: "The Best Place",
      tags: [],
      avgRating: 4.6,
      reviewCount: 120,
      distanceKm: 0.8, // equalize proximity and quality
    }

    // User 1 loves CAFES (affinity 1.0) and dislikes PGs (affinity 0.0)
    // User 2 loves PGS (affinity 1.0) and dislikes CAFES (affinity 0.0)
    const warmBlend = 1.0

    // User 1 scoring
    const u1Cafe = scoreSearchCandidate(candCafe, genericQuery, 1.0, warmBlend, false)
    const u1Pg = scoreSearchCandidate(candPg, genericQuery, 0.0, warmBlend, false)

    // User 2 scoring
    const u2Cafe = scoreSearchCandidate(candCafe, genericQuery, 0.0, warmBlend, false)
    const u2Pg = scoreSearchCandidate(candPg, genericQuery, 1.0, warmBlend, false)

    // User 1 orders Cafe > PG
    expect(u1Cafe.score).toBeGreaterThan(u1Pg.score)

    // User 2 orders PG > Cafe
    expect(u2Pg.score).toBeGreaterThan(u2Cafe.score)

    // The orderings are strictly inverted between User 1 and User 2
    expect(u1Cafe.score - u1Pg.score).toBeCloseTo(0.20, 2)
    expect(u2Pg.score - u2Cafe.score).toBeCloseTo(0.20, 2)
  })

  it("anonymous search score strictly equals cold-start search score", () => {
    const query = "coffee"

    // Anonymous search
    const anonScore = scoreSearchCandidate(cafePlace, query, 0, 0, true)

    // Cold-start search (user has 0 events, blend factor 0)
    const coldStartScore = scoreSearchCandidate(cafePlace, query, 0.8, 0, false)

    expect(anonScore.score).toBe(coldStartScore.score)
    expect(anonScore.effectiveTextWeight).toBe(0.60)
    expect(coldStartScore.effectiveTextWeight).toBe(0.60)
    expect(anonScore.effectiveAffinityWeight).toBe(0.0)
    expect(coldStartScore.effectiveAffinityWeight).toBe(0.0)
  })
})
