import { type NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/server-auth"
import { businessClaimSchema } from "@/lib/validation"
import { generalApiRateLimit, enforceRateLimit, rateLimitResponse, getIpFromRequest } from "@/lib/ratelimit"
import { verifyTurnstileToken } from "@/lib/turnstile"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const input = businessClaimSchema.safeParse(body)
    if (!input.success) {
      return NextResponse.json(
        { success: false, error: "Invalid claim data", details: input.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    // P1.4: Turnstile verification on business claim
    const turnstileCheck = await verifyTurnstileToken(input.data.turnstileToken, ip)
    if (!turnstileCheck.success) {
      return NextResponse.json(
        { success: false, error: turnstileCheck.error || "Turnstile verification failed" },
        { status: 403 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      const place = await tx.place.findUnique({ where: { id: input.data.placeId } })
      if (!place) return { status: "not_found" as const }

      const activeClaim = await tx.businessClaim.findFirst({
        where: { placeId: place.id, status: { in: ["PENDING", "VERIFIED"] } },
      })
      if (activeClaim || place.claimStatus === "PENDING" || place.claimStatus === "VERIFIED") {
        return { status: "conflict" as const }
      }

      const canAutoVerify =
        input.data.type === "auto" &&
        Boolean(authenticated.user.phone) &&
        authenticated.user.phone === place.businessPhone

      if (canAutoVerify) {
        const [claim] = await Promise.all([
          tx.businessClaim.create({
            data: {
              placeId: place.id,
              userId: authenticated.user.id,
              phone: authenticated.user.phone,
              status: "VERIFIED",
            },
          }),
          tx.place.update({
            where: { id: place.id },
            data: {
              claimStatus: "VERIFIED",
              ownerPhone: authenticated.user.phone,
              isVerifiedBiz: true,
            },
          }),
        ])

        return { status: "verified" as const, claimId: claim.id }
      }

      if (input.data.type === "auto") {
        return { status: "phone_mismatch" as const }
      }

      const [claim] = await Promise.all([
        tx.businessClaim.create({
          data: {
            placeId: place.id,
            userId: authenticated.user.id,
            phone: authenticated.user.phone,
            documentUrl: input.data.documentUrl,
            status: "PENDING",
          },
        }),
        tx.place.update({ where: { id: place.id }, data: { claimStatus: "PENDING" } }),
      ])

      return { status: "pending" as const, claimId: claim.id }
    })

    if (result.status === "not_found") {
      return NextResponse.json({ success: false, error: "Place not found" }, { status: 404 })
    }
    if (result.status === "conflict") {
      return NextResponse.json({ success: false, error: "This business is already claimed or pending review" }, { status: 409 })
    }
    if (result.status === "phone_mismatch") {
      return NextResponse.json({ success: false, error: "Your verified phone does not match this business" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      claimId: result.claimId,
      status: result.status,
    })
  } catch (error) {
    console.error("Business claim failed", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
