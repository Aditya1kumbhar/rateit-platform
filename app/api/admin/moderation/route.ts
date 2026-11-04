import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser, isAdmin } from "@/lib/server-auth"
import { moderationActionSchema } from "@/lib/validation"
import { CONFIG } from "@/lib/personalization-config"
import { adjustTrustScore } from "@/lib/trust-score"
import { recomputePlaceRatings } from "@/lib/bayesian"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const authenticated = await getAuthenticatedUser()
    if (!authenticated || !isAdmin(authenticated.authUser)) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required" }, { status: 403 })
    }

    // Return hidden reviews, flagged reviews, and recent moderation audit logs
    const [hiddenReviews, recentFlags, auditLogs, pendingGrievances] = await Promise.all([
      prisma.review.findMany({
        where: { isHidden: true },
        include: {
          place: { select: { id: true, name: true, category: true } },
          user: { select: { id: true, displayName: true, trustScore: true } },
          flags: true,
        },
        orderBy: { flagCount: "desc" },
        take: 50,
      }),
      prisma.flag.findMany({
        include: {
          review: { select: { id: true, text: true, rating: true, isHidden: true } },
          user: { select: { id: true, displayName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.moderationAction.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.grievanceAppeal.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" },
        take: 50,
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        hiddenReviews,
        recentFlags,
        auditLogs,
        pendingGrievances,
      },
    })
  } catch (error) {
    console.error("GET /api/admin/moderation error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authenticated = await getAuthenticatedUser()
    if (!authenticated) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // P1.1: Moderation actions are strictly admin-only
    if (!isAdmin(authenticated.authUser)) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const input = moderationActionSchema.safeParse(body)
    if (!input.success) {
      return NextResponse.json(
        { success: false, error: "Invalid moderation action", details: input.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { action, targetType, targetId, reason } = input.data

    const result = await prisma.$transaction(async (tx) => {
      // 1. Audit log in ModerationAction table
      const audit = await tx.moderationAction.create({
        data: {
          actorId: authenticated.user.id,
          action,
          targetType,
          targetId,
          reason,
        },
      })

      // 2. Perform action based on type
      if (targetType === "review") {
        if (action === "hide") {
          const review = await tx.review.update({
            where: { id: targetId },
            data: { visibility: "HIDDEN", isHidden: true },
          })
          // Author penalty: flag upheld decrements trust by 10, clamped at 0..100
          const author = await tx.user.findUnique({ where: { id: review.userId } })
          if (author) {
            const updatedScore = adjustTrustScore(author.trustScore, -CONFIG.flagUpheldTrustDecrement)
            await tx.user.update({
              where: { id: review.userId },
              data: { trustScore: updatedScore },
            })
          }
          await recomputePlaceRatings(tx, review.placeId)
        } else if (action === "unhide") {
          const updatedReview = await tx.review.update({
            where: { id: targetId },
            data: { visibility: "PUBLIC", isHidden: false, flagCount: 0 },
          })
          // Clear flags
          await tx.flag.deleteMany({ where: { reviewId: targetId } })
          await recomputePlaceRatings(tx, updatedReview.placeId)
        } else if (action === "dismiss_flag") {
          await tx.flag.deleteMany({ where: { reviewId: targetId } })
          await tx.review.update({
            where: { id: targetId },
            data: { flagCount: 0 },
          })
        }
      } else if (targetType === "user") {
        if (action === "ban_user") {
          await tx.user.update({
            where: { id: targetId },
            data: { isBanned: true, banReason: reason, trustScore: 0 },
          })
          // Hide all reviews by banned user
          await tx.review.updateMany({
            where: { userId: targetId },
            data: { isHidden: true, visibility: "HIDDEN" },
          })
        }
      } else if (targetType === "grievance") {
        await tx.grievanceAppeal.update({
          where: { id: targetId },
          data: {
            status: action === "dismiss_flag" ? "REJECTED" : "RESOLVED",
            resolution: reason,
          },
        })
      }

      return audit
    })

    return NextResponse.json({
      success: true,
      message: `Moderation action '${action}' recorded and executed successfully`,
      data: result,
    })
  } catch (error) {
    console.error("POST /api/admin/moderation error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
