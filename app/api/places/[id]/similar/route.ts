import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generalApiRateLimit, enforceRateLimit, rateLimitResponse, getIpFromRequest } from "@/lib/ratelimit"
import { CONFIG } from "@/lib/personalization-config"

export const dynamic = "force-dynamic"

interface CachedSimilar {
  data: any[]
  type: "collaborative" | "category_picks"
  expiresAt: number
}

// 1-hour in-memory cache for similar places recommendations
const similarCache = new Map<string, CachedSimilar>()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ip = getIpFromRequest(request)
    const rl = await enforceRateLimit(generalApiRateLimit, `similar:${params.id}:ip:${ip}`)
    if (!rl.success) {
      return rateLimitResponse(rl)
    }

    const placeId = params.id

    // Check in-memory cache
    const cached = similarCache.get(placeId)
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({
        success: true,
        type: cached.type,
        count: cached.data.length,
        data: cached.data,
        cached: true,
      })
    }

    const targetPlace = await prisma.place.findUnique({
      where: { id: placeId },
      select: { id: true, category: true, name: true, city: true },
    })

    if (!targetPlace) {
      return NextResponse.json({ success: false, error: "Place not found" }, { status: 404 })
    }

    // P5.4 Interaction volume gate:
    // If total interactions across the platform < 500 (CONFIG), return same-category places ordered by Bayesian quality
    const totalInteractions = await prisma.userEvent.count({
      where: {
        type: { in: ["place_save", "review_submit"] },
      },
    })

    if (totalInteractions < CONFIG.collaborativeFilteringMinInteractions) {
      const categoryPicks = await prisma.place.findMany({
        where: {
          category: targetPlace.category,
          id: { not: targetPlace.id },
        },
        orderBy: [
          { bayesianRating: "desc" },
          { avgRating: "desc" },
          { reviewCount: "desc" },
        ],
        take: 6,
        select: {
          id: true,
          name: true,
          category: true,
          address: true,
          city: true,
          avgRating: true,
          bayesianRating: true,
          reviewCount: true,
          imageUrl: true,
          priceRange: true,
          tags: true,
        },
      })

      // Cache result for 1 hour
      similarCache.set(placeId, {
        data: categoryPicks,
        type: "category_picks",
        expiresAt: Date.now() + CONFIG.similarPlacesCacheTtlMs,
      })

      return NextResponse.json({
        success: true,
        type: "category_picks",
        count: categoryPicks.length,
        data: categoryPicks,
      })
    }

    // P5.4: Collaborative filtering once platform interactions >= 500
    // Co-interaction cosine similarity: users who saved/reviewed place A also saved/reviewed place B
    const targetInteractions = await prisma.userEvent.findMany({
      where: {
        placeId: targetPlace.id,
        type: { in: ["place_save", "review_submit"] },
        userId: { not: null },
      },
      select: { userId: true },
      distinct: ["userId"],
    })

    const targetUserIds = targetInteractions
      .map((ev) => ev.userId)
      .filter((uid): uid is string => uid !== null)

    let collaborativePlaceIds: string[] = []

    if (targetUserIds.length > 0) {
      // Find candidate places interacted by these same users
      const coEvents = await prisma.userEvent.findMany({
        where: {
          userId: { in: targetUserIds },
          placeId: { not: targetPlace.id },
          type: { in: ["place_save", "review_submit"] },
        },
        select: { userId: true, placeId: true },
      })

      // Count co-interactions per candidate place
      const placeUserCounts = new Map<string, Set<string>>()
      for (const ev of coEvents) {
        if (!ev.placeId || !ev.userId) continue
        if (!placeUserCounts.has(ev.placeId)) {
          placeUserCounts.set(ev.placeId, new Set())
        }
        placeUserCounts.get(ev.placeId)!.add(ev.userId)
      }

      // Compute cosine similarity: coCount / sqrt(|targetUsers| * |candidateUsers|)
      const similarities: { placeId: string; score: number }[] = []
      const normA = Math.sqrt(targetUserIds.length)

      for (const [candidateId, userSet] of placeUserCounts.entries()) {
        const coCount = userSet.size
        const normB = Math.sqrt(userSet.size)
        const cosine = coCount / (normA * normB)
        similarities.push({ placeId: candidateId, score: cosine })
      }

      similarities.sort((a, b) => b.score - a.score)
      collaborativePlaceIds = similarities.slice(0, 6).map((s) => s.placeId)
    }

    let results: any[] = []
    let resultType: "collaborative" | "category_picks" = "collaborative"

    if (collaborativePlaceIds.length > 0) {
      results = await prisma.place.findMany({
        where: { id: { in: collaborativePlaceIds } },
        select: {
          id: true,
          name: true,
          category: true,
          address: true,
          city: true,
          avgRating: true,
          bayesianRating: true,
          reviewCount: true,
          imageUrl: true,
          priceRange: true,
          tags: true,
        },
      })
      // Order to match similarity ranking
      results.sort(
        (a, b) =>
          collaborativePlaceIds.indexOf(a.id) - collaborativePlaceIds.indexOf(b.id)
      )
    }

    // Never fail open to an empty list unless the whole category is empty
    if (results.length === 0) {
      resultType = "category_picks"
      results = await prisma.place.findMany({
        where: {
          category: targetPlace.category,
          id: { not: targetPlace.id },
        },
        orderBy: [
          { bayesianRating: "desc" },
          { avgRating: "desc" },
          { reviewCount: "desc" },
        ],
        take: 6,
        select: {
          id: true,
          name: true,
          category: true,
          address: true,
          city: true,
          avgRating: true,
          bayesianRating: true,
          reviewCount: true,
          imageUrl: true,
          priceRange: true,
          tags: true,
        },
      })
    }

    // Cache result
    similarCache.set(placeId, {
      data: results,
      type: resultType,
      expiresAt: Date.now() + CONFIG.similarPlacesCacheTtlMs,
    })

    return NextResponse.json({
      success: true,
      type: resultType,
      count: results.length,
      data: results,
    })
  } catch (error) {
    console.error("GET /api/places/[id]/similar error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
