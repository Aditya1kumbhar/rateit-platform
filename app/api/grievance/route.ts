import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/server-auth"
import { grievanceSchema } from "@/lib/validation"
import { generalApiRateLimit, enforceRateLimit, rateLimitResponse, getIpFromRequest } from "@/lib/ratelimit"
import { verifyTurnstileToken } from "@/lib/turnstile"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const ip = getIpFromRequest(request)
    const rl = await enforceRateLimit(generalApiRateLimit, `grievance:ip:${ip}`)
    if (!rl.success) {
      return rateLimitResponse(rl)
    }

    const body = await request.json()
    const input = grievanceSchema.safeParse(body)
    if (!input.success) {
      return NextResponse.json(
        { success: false, error: "Invalid grievance data", details: input.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    // Optional turnstile check if token provided
    if (input.data.turnstileToken) {
      const turnstileCheck = await verifyTurnstileToken(input.data.turnstileToken, ip)
      if (!turnstileCheck.success) {
        return NextResponse.json(
          { success: false, error: turnstileCheck.error || "Turnstile verification failed" },
          { status: 403 }
        )
      }
    }

    const auth = await getAuthenticatedUser()

    const item = await prisma.grievanceAppeal.create({
      data: {
        userId: auth?.user.id ?? null,
        name: input.data.name,
        email: input.data.email,
        phone: input.data.phone ?? null,
        reportType: input.data.reportType,
        targetReviewId: input.data.targetReviewId ?? null,
        description: input.data.description,
        status: "PENDING",
      },
    })

    return NextResponse.json({
      success: true,
      message: "Grievance submitted successfully. Formal acknowledgment will be issued within 24 hours.",
      referenceId: item.id,
      status: item.status,
    }, { status: 201 })
  } catch (error) {
    console.error("POST /api/grievance error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

