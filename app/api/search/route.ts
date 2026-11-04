import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/server-auth"
import { searchQuerySchema } from "@/lib/validation"
import { searchRateLimit, enforceRateLimit, rateLimitResponse, getIpFromRequest } from "@/lib/ratelimit"
import { getUserCategoryAffinities, getUserColdStartBlend, hashWithSalt } from "@/lib/interest"
import { haversineDistance } from "@/lib/geolocation"
import { calculateTrigramSimilarity, findBestCategoryFallback } from "@/lib/search/trigram"
import { scoreSearchCandidate, SearchPlaceCandidate, ScoredSearchResult } from "@/lib/search/scoring"
import { CONFIG } from "@/lib/personalization-config"

export const dynamic = "force-dynamic"

const PUNE_CENTER_LAT = 18.5204
const PUNE_CENTER_LNG = 73.8567

export async function GET(request: NextRequest) {
  try {
    const ip = getIpFromRequest(request)
    const auth = await getAuthenticatedUser()

    const identifier = auth ? `search:user:${auth.user.id}` : `search:ip:${ip}`
    const rl = await enforceRateLimit(searchRateLimit, identifier)
    if (!rl.success) {
      return rateLimitResponse(rl)
    }

    const { searchParams } = new URL(request.url)
    const input = searchQuerySchema.safeParse({
      q: searchParams.get("q"),
      lat: searchParams.get("lat") || undefined,
      lng: searchParams.get("lng") || undefined,
    })

    if (!input.success) {
      return NextResponse.json(
        { success: false, error: "Invalid search query", details: input.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { q } = input.data
    const userLat = input.data.lat ?? PUNE_CENTER_LAT
    const userLng = input.data.lng ?? PUNE_CENTER_LNG

    const userAffinities = await getUserCategoryAffinities(auth?.user.id)
    const coldStartBlend = await getUserColdStartBlend(auth?.user.id)
    const isAnonymous = !auth

    // 1. Fetch all places to run trigram similarity & tag matching
    const allPlaces = await prisma.place.findMany()

    const candidates: (SearchPlaceCandidate & { textSim: number })[] = []

    for (const place of allPlaces) {
      const distMeters = haversineDistance(userLat, userLng, place.latitude, place.longitude)
      const distanceKm = Math.round((distMeters / 1000) * 10) / 10

      const nameSim = calculateTrigramSimilarity(q, place.name)
      const catMatch = place.category.toLowerCase().includes(q.toLowerCase())
      const catSim = catMatch ? 1.0 : calculateTrigramSimilarity(q, place.category)

      let tagSim = 0
      if (place.tags && place.tags.length > 0) {
        for (const tag of place.tags) {
          if (tag.toLowerCase().includes(q.toLowerCase())) {
            tagSim = Math.max(tagSim, 0.8)
          } else {
            tagSim = Math.max(tagSim, calculateTrigramSimilarity(q, tag))
          }
        }
      }

      const textSim = Math.max(nameSim, catSim, tagSim)

      // Candidate filter: trigram similarity > 0.2, OR category match, OR tag match
      if (textSim > CONFIG.searchMinTrigramSimilarity || catMatch || tagSim > 0.2) {
        candidates.push({
          id: place.id,
          name: place.name,
          category: place.category,
          address: place.address,
          city: place.city,
          latitude: place.latitude,
          longitude: place.longitude,
          avgRating: place.avgRating,
          reviewCount: place.reviewCount,
          distanceKm,
          tags: place.tags,
          description: place.description,
          priceRange: place.priceRange,
          imageUrl: place.imageUrl,
          textSim,
        })
      }
    }

    // 2. Zero-result handling (P4.4):
    // If no candidate passes 0.2 similarity, retry with highest-similarity category
    if (candidates.length === 0) {
      const fallbackCat = findBestCategoryFallback(q)
      const fallbackPlaces = allPlaces.filter((p) => p.category === fallbackCat)

      // Log zero-result query to SearchLog for what to seed next
      const normalizedQuery = q.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      await prisma.searchLog.upsert({
        where: {
          normalized_city: {
            normalized: normalizedQuery,
            city: "Pune",
          },
        },
        update: {
          count: { increment: 1 },
          lastSeen: new Date(),
        },
        create: {
          query: q.trim(),
          normalized: normalizedQuery,
          city: "Pune",
          resultCount: 0,
          count: 1,
        },
      }).catch(() => {})

      const fallbackScored = fallbackPlaces.map((place) => {
        const distMeters = haversineDistance(userLat, userLng, place.latitude, place.longitude)
        const distanceKm = Math.round((distMeters / 1000) * 10) / 10
        return {
          id: place.id,
          name: place.name,
          category: place.category,
          address: place.address,
          city: place.city,
          latitude: place.latitude,
          longitude: place.longitude,
          avgRating: place.avgRating,
          reviewCount: place.reviewCount,
          distanceKm,
          tags: place.tags,
          description: place.description,
          priceRange: place.priceRange,
          imageUrl: place.imageUrl,
          score: place.avgRating,
        }
      }).sort((a, b) => b.avgRating - a.avgRating)

      return NextResponse.json({
        success: true,
        count: fallbackScored.length,
        isFallback: true,
        matchedCategory: fallbackCat,
        message: `No exact matches for "${q}". Showing top rated places in ${fallbackCat?.replace("_", " ")}.`,
        data: fallbackScored,
      })
    }

    // 3. Search Scoring (P4.2)
    const scoredResults: ScoredSearchResult[] = candidates.map((candidate) => {
      const categoryAffinity = userAffinities.get(candidate.category) || 0
      return scoreSearchCandidate(
        candidate,
        q,
        categoryAffinity,
        coldStartBlend,
        isAnonymous
      )
    })

    // Sort descending by calculated score
    scoredResults.sort((a, b) => b.score - a.score)

    // 4. Log search_query event for analytics & autocomplete tracking
    const ipHash = hashWithSalt(ip, "ip")
    const deviceHash = hashWithSalt(request.headers.get("user-agent"), "device")

    prisma.userEvent.create({
      data: {
        userId: auth && auth.user.consentGiven ? auth.user.id : null,
        sessionId: "search_session_" + Date.now(),
        type: "search_query",
        query: q.trim(),
        ipHash,
        deviceHash,
      },
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      count: scoredResults.length,
      isFallback: false,
      data: scoredResults.map((r) => ({
        ...r.place,
        score: r.score,
        relevance: r.textRelevance,
      })),
    })
  } catch (error) {
    console.error("GET /api/search error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

