import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/server-auth"
import { eventBatchSchema } from "@/lib/validation"
import { eventsRateLimit, enforceRateLimit, rateLimitResponse, getIpFromRequest } from "@/lib/ratelimit"
import { hashWithSalt, applyEventToUserInterest } from "@/lib/interest"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const ip = getIpFromRequest(request)
    const auth = await getAuthenticatedUser()

    const identifier = auth ? `events:user:${auth.user.id}` : `events:ip:${ip}`
    const rl = await enforceRateLimit(eventsRateLimit, identifier)
    if (!rl.success) {
      return rateLimitResponse(rl)
    }

    const body = await request.json()
    const input = eventBatchSchema.safeParse(body)
    if (!input.success) {
      return NextResponse.json(
        { success: false, error: "Invalid events payload", details: input.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { sessionId, events } = input.data

    // P1.8 DPDP Privacy & Consent check:
    // Event tracking runs with userId ONLY for users whose User.consentGiven is true.
    // Non-consented users produce only anonymous records with userId = null.
    const isConsentedUser = Boolean(auth && auth.user.consentGiven)
    const effectiveUserId = isConsentedUser ? auth!.user.id : null

    const ipHash = hashWithSalt(ip, "ip")

    // Process events asynchronously
    const eventWrites = events.map(async (ev) => {
      const deviceHash = hashWithSalt(ev.deviceHash || "web-browser", "device")

      let category = ev.category

      // If category not provided directly but placeId is given, resolve category
      if (!category && ev.placeId) {
        const place = await prisma.place.findUnique({
          where: { id: ev.placeId },
          select: { category: true },
        })
        category = (place?.category as any) || null
      }

      // Write event log
      const createdEvent = await prisma.userEvent.create({
        data: {
          userId: effectiveUserId,
          sessionId,
          type: ev.type,
          placeId: ev.placeId ?? null,
          category: category ?? null,
          query: ev.query ?? null,
          dwellMs: ev.dwellMs ?? null,
          ipHash,
          deviceHash,
        },
      })

      // If consented user, update interest profile
      if (effectiveUserId && category) {
        await applyEventToUserInterest(effectiveUserId, category, ev.type, ev.dwellMs)
      }

      // If search_query event, update SearchLog for trending / autocomplete
      if (ev.type === "search_query" && ev.query && ev.query.trim().length >= 2) {
        const normalized = ev.query.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        await prisma.searchLog.upsert({
          where: {
            normalized_city: {
              normalized,
              city: "Pune",
            },
          },
          update: {
            count: { increment: 1 },
            lastSeen: new Date(),
          },
          create: {
            query: ev.query.trim(),
            normalized,
            city: "Pune",
            resultCount: 1,
            count: 1,
          },
        }).catch(() => {})
      }

      return createdEvent.id
    })

    const results = await Promise.all(eventWrites)

    return NextResponse.json({
      success: true,
      processed: results.length,
      consented: isConsentedUser,
    }, { status: 202 })
  } catch (error) {
    console.error("POST /api/events error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

