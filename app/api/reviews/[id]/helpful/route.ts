import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/server-auth"
import { generalApiRateLimit, enforceRateLimit, rateLimitResponse, getIpFromRequest } from "@/lib/ratelimit"
import { CONFIG } from "@/lib/personalization-config"
import { adjustTrustScore, calculateTrustTier } from "@/lib/trust-score"

export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authenticated = await getAuthenticatedUser()
    if (!authenticated) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const ip = getIpFromRequest(request)
    const rl = await enforceRateLimit(generalApiRateLimit, `user:${authenticated.user.id}:ip:${ip}`)
    if (!rl.success) {
      return rateLimitResponse(rl)
    }

    const review = await prisma.review.findUnique({
      where: { id: params.id },
      include: { user: true },
    })

    if (!review) {
      return NextResponse.json({ success: false, error: "Review not found" }, { status: 404 })
    }

    // Cannot vote helpful on own review
    if (review.userId === authenticated.user.id) {
      return NextResponse.json(
        { success: false, error: "You cannot mark your own review as helpful" },
        { status: 400 }
      )
    }

    // Toggle or record helpful vote
    const existing = await prisma.reviewHelpful.findUnique({
      where: {
        reviewId_userId: {
          reviewId: review.id,
          userId: authenticated.user.id,
        },
      },
    })

    if (existing) {
      // Remove helpful vote (unlike)
      await prisma.reviewHelpful.delete({
        where: { id: existing.id },
      })
      const count = await prisma.reviewHelpful.count({ where: { reviewId: review.id } })

      // P5.3: Decrement author trust by 1 on un-helpful, clamped to 0..100
      const currentAuthor = await prisma.user.findUnique({ where: { id: review.userId } })
      let newTrustScore = currentAuthor ? currentAuthor.trustScore : 50
      if (currentAuthor) {
        newTrustScore = adjustTrustScore(currentAuthor.trustScore, -CONFIG.helpfulVoteTrustIncrement)
        await prisma.user.update({
          where: { id: review.userId },
          data: { trustScore: newTrustScore },
        })
      }

      return NextResponse.json({
        success: true,
        helpful: false,
        count,
        authorTrustScore: newTrustScore,
        authorTrustTier: calculateTrustTier(newTrustScore),
      })
    }

    // Add helpful vote
    await prisma.reviewHelpful.create({
      data: {
        reviewId: review.id,
        userId: authenticated.user.id,
      },
    })

    const count = await prisma.reviewHelpful.count({ where: { reviewId: review.id } })

    // P5.3: Each helpful vote increments author trust by +1, clamped to 0..100
    const currentAuthor = await prisma.user.findUnique({ where: { id: review.userId } })
    let newTrustScore = currentAuthor ? currentAuthor.trustScore : 50
    if (currentAuthor) {
      newTrustScore = adjustTrustScore(currentAuthor.trustScore, CONFIG.helpfulVoteTrustIncrement)
      await prisma.user.update({
        where: { id: review.userId },
        data: { trustScore: newTrustScore },
      })
    }

    return NextResponse.json({
      success: true,
      helpful: true,
      count,
      authorTrustScore: newTrustScore,
      authorTrustTier: calculateTrustTier(newTrustScore),
    })
  } catch (error) {
    console.error("POST /api/reviews/[id]/helpful error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
