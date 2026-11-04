import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/server-auth"
import { bizReplySchema } from "@/lib/validation"
import { generalApiRateLimit, enforceRateLimit, rateLimitResponse, getIpFromRequest } from "@/lib/ratelimit"

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
      include: { place: true, bizReply: true },
    })

    if (!review) {
      return NextResponse.json({ success: false, error: "Review not found" }, { status: 404 })
    }

    if (review.bizReply) {
      return NextResponse.json(
        { success: false, error: "A business reply has already been posted for this review" },
        { status: 409 }
      )
    }

    // P1.1 BOLA check: A business reply is allowed ONLY from a user with an APPROVED (VERIFIED) BusinessClaim for that place
    const approvedClaim = await prisma.businessClaim.findFirst({
      where: {
        placeId: review.placeId,
        userId: authenticated.user.id,
        status: "VERIFIED",
      },
    })

    if (!approvedClaim) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Only verified business owners with an approved claim can reply to reviews for this place",
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const input = bizReplySchema.safeParse(body)
    if (!input.success) {
      return NextResponse.json(
        { success: false, error: "Invalid reply data", details: input.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const reply = await prisma.bizReply.create({
      data: {
        reviewId: review.id,
        text: input.data.text,
      },
    })

    return NextResponse.json({ success: true, data: reply }, { status: 201 })
  } catch (error) {
    console.error("POST /api/reviews/[id]/reply error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

