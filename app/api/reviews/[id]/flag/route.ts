import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/server-auth"
import { flagReviewSchema } from "@/lib/validation"
import { generalApiRateLimit, enforceRateLimit, rateLimitResponse, getIpFromRequest } from "@/lib/ratelimit"
import { CONFIG } from "@/lib/personalization-config"

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
    })

    if (!review) {
      return NextResponse.json({ success: false, error: "Review not found" }, { status: 404 })
    }

    // A user cannot flag their own review
    if (review.userId === authenticated.user.id) {
      return NextResponse.json(
        { success: false, error: "You cannot flag your own review" },
        { status: 400 }
      )
    }

    const existingFlag = await prisma.flag.findUnique({
      where: {
        reviewId_userId: {
          reviewId: review.id,
          userId: authenticated.user.id,
        },
      },
    })

    if (existingFlag) {
      return NextResponse.json(
        { success: false, error: "You have already flagged this review" },
        { status: 409 }
      )
    }

    const body = await request.json()
    const input = flagReviewSchema.safeParse(body)
    if (!input.success) {
      return NextResponse.json(
        { success: false, error: "Invalid flag submission", details: input.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the Flag record
      const flag = await tx.flag.create({
        data: {
          reviewId: review.id,
          userId: authenticated.user.id,
          reason: input.data.reason,
          detail: input.data.detail,
        },
      })

      // 2. Count distinct user flags on this review
      const flagCount = await tx.flag.count({
        where: { reviewId: review.id },
      })

      // 3. Increment review flagCount
      const shouldAutoHide = flagCount >= CONFIG.flagsToAutoHide

      const updatedReview = await tx.review.update({
        where: { id: review.id },
        data: {
          flagCount,
          ...(shouldAutoHide
            ? {
                visibility: "HIDDEN",
                isHidden: true,
              }
            : {}),
        },
      })

      // 4. If auto-hidden, write an audit row in ModerationAction
      if (shouldAutoHide) {
        await tx.moderationAction.create({
          data: {
            actorId: "SYSTEM_AUTO_MODERATION",
            action: "hide",
            targetType: "review",
            targetId: review.id,
            reason: `Auto-hidden: Reached ${flagCount} distinct user flags (threshold: ${CONFIG.flagsToAutoHide})`,
          },
        })

        // Also decrement author trust score per P5.3
        await tx.user.update({
          where: { id: review.userId },
          data: {
            trustScore: {
              decrement: CONFIG.moderationTrustPenalty,
            },
          },
        })
      }

      return { flag, flagCount, autoHidden: shouldAutoHide }
    })

    return NextResponse.json({
      success: true,
      message: result.autoHidden
        ? "Review flagged and auto-hidden pending admin moderation."
        : "Review flagged successfully.",
      flagCount: result.flagCount,
      autoHidden: result.autoHidden,
    })
  } catch (error) {
    console.error("POST /api/reviews/[id]/flag error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

