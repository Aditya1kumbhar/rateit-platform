import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/server-auth"
import { feedQuerySchema } from "@/lib/validation"
import { feedRateLimit, enforceRateLimit, rateLimitResponse, getIpFromRequest } from "@/lib/ratelimit"
import { getUserCategoryAffinities, getUserColdStartBlend, hashWithSalt } from "@/lib/interest"
import { generateFeedCandidates } from "@/lib/feed/candidates"
import { scoreFeedPlace, ScoredPlaceResult } from "@/lib/feed/scoring"
import { applyDiversityReranking, injectExplorationSlots } from "@/lib/feed/diversity"

export const dynamic = "force-dynamic"

// Pune Deccan / FC Road default coordinates
const PUNE_CENTER_LAT = 18.5204
const PUNE_CENTER_LNG = 73.8567

export async function GET(request: NextRequest) {
  try {
    const ip = getIpFromRequest(request)
    const auth = await getAuthenticatedUser()

    const identifier = auth ? `feed:user:${auth.user.id}` : `feed:ip:${ip}`
    const rl = await enforceRateLimit(feedRateLimit, identifier)
    if (!rl.success) {
      return rateLimitResponse(rl)
    }

    const { searchParams } = new URL(request.url)
    const queryParsed = feedQuerySchema.safeParse({
      lat: searchParams.get("lat") || undefined,
      lng: searchParams.get("lng") || undefined,
    })

    if (!queryParsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid coordinates", details: queryParsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const userLat = queryParsed.data.lat ?? PUNE_CENTER_LAT
    const userLng = queryParsed.data.lng ?? PUNE_CENTER_LNG

    // 1. Fetch user interest affinities & cold-start blend factor
    const userAffinities = await getUserCategoryAffinities(auth?.user.id)
    const coldStartBlend = await getUserColdStartBlend(auth?.user.id)

    // Top categories sorted by affinity
    const topCategories = Array.from(userAffinities.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat)

    // 2. Candidate generation
    const { candidates, globalMean, explorationCandidates } = await generateFeedCandidates(
      userLat,
      userLng,
      topCategories
    )

    if (candidates.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        explorationSlots: [],
        data: [],
      })
    }

    // 3. Scoring
    const scoredCandidates: ScoredPlaceResult[] = candidates.map((place) => {
      const affinity = userAffinities.get(place.category) || 0
      return scoreFeedPlace(place, affinity, coldStartBlend, globalMean)
    })

    // 4. Diversity re-ranking (MMR-style)
    const diversified = applyDiversityReranking(scoredCandidates)

    // 5. Exploration slots injection
    const scoredExplorationPool = explorationCandidates.map((place) => {
      const affinity = userAffinities.get(place.category) || 0
      return scoreFeedPlace(place, affinity, coldStartBlend, globalMean)
    })

    const { feed: finalFeed, explorationSlots } = injectExplorationSlots(diversified, scoredExplorationPool)

    // Fetch place full card details (tags, imageUrl, address, priceRange)
    const placeIds = finalFeed.map((item) => item.place.id)
    const fullPlaces = await prisma.place.findMany({
      where: { id: { in: placeIds } },
    })
    const fullPlaceMap = new Map(fullPlaces.map((p) => [p.id, p]))

    const finalOrderedCards = finalFeed.map((item, idx) => {
      const full = fullPlaceMap.get(item.place.id)
      return {
        id: item.place.id,
        name: item.place.name,
        category: item.place.category,
        description: full?.description ?? null,
        address: full?.address ?? "",
        city: full?.city ?? "Pune",
        latitude: item.place.latitude,
        longitude: item.place.longitude,
        avgRating: item.place.avgRating,
        reviewCount: item.place.reviewCount,
        distanceKm: item.place.distanceKm,
        priceRange: full?.priceRange ?? null,
        tags: full?.tags ?? [],
        imageUrl: full?.imageUrl ?? null,
        score: item.score,
        isExploration: explorationSlots.includes(idx + 1),
      }
    })

    // 6. Log feed_impression event asynchronously for quality measurement
    if (finalOrderedCards.length > 0) {
      const ipHash = hashWithSalt(ip, "ip")
      const deviceHash = hashWithSalt(request.headers.get("user-agent"), "device")

      prisma.userEvent.create({
        data: {
          userId: auth && auth.user.consentGiven ? auth.user.id : null,
          sessionId: "feed_session_" + Date.now(),
          type: "feed_impression",
          query: JSON.stringify({
            explorationSlots,
            topPlaceIds: finalOrderedCards.slice(0, 10).map((p) => p.id),
          }),
          ipHash,
          deviceHash,
        },
      }).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      count: finalOrderedCards.length,
      explorationSlots,
      data: finalOrderedCards,
    })
  } catch (error) {
    console.error("GET /api/feed error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

