import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser, isAdmin } from "@/lib/server-auth"
import { updateReviewSchema } from "@/lib/validation"
import { generalApiRateLimit, enforceRateLimit, rateLimitResponse, getIpFromRequest } from "@/lib/ratelimit"
import { recomputePlaceRatings } from "@/lib/bayesian"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const review = await prisma.review.findUnique({
      where: { id: params.id },
      include: {
        place: { select: { id: true, name: true, category: true, address: true } },
        user: { select: { id: true, displayName: true, avatarUrl: true, trustScore: true } },
        bizReply: true,
      },
    })

    if (!review || review.isHidden) {
      return NextResponse.json({ success: false, error: "Review not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: review })
  } catch (error) {
    console.error("GET /api/reviews/[id] error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
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

    // P1.1 BOLA check: A review can be edited only by its author
    if (review.userId !== authenticated.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not have permission to edit this review" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const input = updateReviewSchema.safeParse(body)
    if (!input.success) {
      return NextResponse.json(
        { success: false, error: "Invalid review update data", details: input.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const updated = await prisma.review.update({
      where: { id: params.id },
      data: {
        ...(input.data.rating !== undefined ? { rating: input.data.rating } : {}),
        ...(input.data.text !== undefined ? { text: input.data.text } : {}),
        ...(input.data.tags !== undefined ? { tags: input.data.tags } : {}),
        ...(input.data.visibility !== undefined ? { visibility: input.data.visibility } : {}),
        version: { increment: 1 },
        editedAt: new Date(),
      },
    })

    if (input.data.rating !== undefined) {
      await recomputePlaceRatings(prisma, review.placeId)
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error("PUT /api/reviews/[id] error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
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

    // P1.1 BOLA check: A review can be deleted only by its author or an admin
    const userIsAdmin = isAdmin(authenticated.authUser)
    if (review.userId !== authenticated.user.id && !userIsAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not have permission to delete this review" },
        { status: 403 }
      )
    }

    await prisma.review.delete({
      where: { id: params.id },
    })

    await recomputePlaceRatings(prisma, review.placeId)

    return NextResponse.json({ success: true, message: "Review deleted successfully" })
  } catch (error) {
    console.error("DELETE /api/reviews/[id] error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
