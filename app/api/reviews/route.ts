import { type NextRequest, NextResponse } from "next/server"

import { crossCheckExif, type ExifData } from "@/lib/exif"
import { runFraudChecks } from "@/lib/fraud-heuristics"
import { isWithinGeofence } from "@/lib/geolocation"
import { prisma } from "@/lib/prisma"
import { getIpFromRequest, isRateLimitConfigured, submitReviewRateLimit, generalApiRateLimit, enforceRateLimit, rateLimitResponse } from "@/lib/ratelimit"
import { getAuthenticatedUser } from "@/lib/server-auth"
import { computeTrustScore, adjustTrustScore } from "@/lib/trust-score"
import { reviewSchema } from "@/lib/validation"
import { verifyTurnstileToken } from "@/lib/turnstile"
import { hashWithSalt } from "@/lib/interest"
import { recomputePlaceRatings } from "@/lib/bayesian"
import { CONFIG } from "@/lib/personalization-config"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const authenticated = await getAuthenticatedUser()
    if (!authenticated) {
      return NextResponse.json({ success: false, error: "Please sign in to publish a review." }, { status: 401 })
    }

    const ip = getIpFromRequest(request)

    if (!isRateLimitConfigured) {
      if (process.env.NODE_ENV === "production") {
        console.error("Review submission blocked because Upstash is not configured")
        return NextResponse.json({ success: false, error: "Service temporarily unavailable" }, { status: 503 })
      }
    } else {
      const rl = await enforceRateLimit(submitReviewRateLimit, `user:${authenticated.user.id}:ip:${ip}`)
      if (!rl.success) {
        return rateLimitResponse(rl, "Too many review submissions. Please try again later.")
      }
    }

    const input = reviewSchema.safeParse(await request.json())
    if (!input.success) {
      return NextResponse.json(
        { success: false, error: "Invalid review data", details: input.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    // P1.4: Turnstile verification on review submit
    const turnstileCheck = await verifyTurnstileToken(input.data.turnstileToken, ip)
    if (!turnstileCheck.success) {
      return NextResponse.json(
        { success: false, error: turnstileCheck.error || "Turnstile verification failed" },
        { status: 403 }
      )
    }

    const { user } = authenticated
    const result = await prisma.$transaction(async (tx) => {
      const place = await tx.place.findUnique({ where: { id: input.data.placeId } })
      if (!place) return null

      const existingReview = await tx.review.findUnique({
        where: { userId_placeId: { userId: user.id, placeId: place.id } },
      })
      if (existingReview) return { alreadyReviewed: true as const }

      const recentReviews = await tx.review.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      })

      let exifWarnings: string[] = []
      let exifMatch = false
      if (input.data.photoExifData && input.data.photoExifData.length > 0) {
        for (const exif of input.data.photoExifData) {
          if (exif.hasGps && exif.latitude !== undefined && exif.longitude !== undefined) {
            const warnings = crossCheckExif(
              exif as ExifData,
              place.latitude,
              place.longitude,
              new Date(),
            )
            exifWarnings.push(...warnings)
            if (warnings.length === 0) {
              exifMatch = true
            }
          }
        }
      }

      // P5.2 (a) Young account burst on place
      const placeRecentReviews = await tx.review.findMany({
        where: { placeId: place.id },
        include: { user: { select: { accountAge: true } } },
        orderBy: { createdAt: "desc" },
        take: 30,
      })
      const burstOnPlace = placeRecentReviews.map((r) => ({
        accountAgeDays: Math.floor((Date.now() - new Date(r.user.accountAge).getTime()) / (1000 * 60 * 60 * 24)),
        createdAt: r.createdAt,
      }))

      // P5.2 (b) Collusion network on place (3+ accounts sharing IP/device hash in 24h)
      const placeEvents = await tx.userEvent.findMany({
        where: {
          placeId: place.id,
          type: "review_submit",
          createdAt: { gte: new Date(Date.now() - CONFIG.collusionWindowHours * 60 * 60 * 1000) },
        },
        select: { userId: true, ipHash: true, deviceHash: true, createdAt: true },
      })
      const userAgent = request.headers.get("user-agent") || "web-browser"
      const currentIpHash = hashWithSalt(ip, "ip")
      const currentDeviceHash = hashWithSalt(userAgent, "device")
      const collusionRecentReviews = [
        ...placeEvents.filter((e) => e.userId !== null).map((e) => ({
          userId: e.userId!,
          ipHash: e.ipHash,
          deviceHash: e.deviceHash,
          createdAt: e.createdAt,
        })),
        { userId: user.id, ipHash: currentIpHash, deviceHash: currentDeviceHash, createdAt: new Date() },
      ]

      // P5.2 (c) Impossible travel between places (>50km in <30 min)
      const impossibleTravelCheckins = recentReviews.map((r) => ({
        lat: r.checkinLat,
        lng: r.checkinLng,
        createdAt: r.createdAt,
      }))

      const fraudResult = runFraudChecks({
        reviewText: input.data.text ?? "",
        existingUserReviewTexts: recentReviews.map((review) => review.text ?? ""),
        userReviewTimestamps: recentReviews.map((review) => review.createdAt),
        accountCreatedAt: user.accountAge,
        totalReviewCount: recentReviews.length,
        exifWarnings,
        burstOnPlace,
        collusionRecentReviews,
        impossibleTravelCheckins,
        currentLat: input.data.checkinLat,
        currentLng: input.data.checkinLng,
      })

      // P5.3: impossible travel or collusion flag decrements trust by -15
      const hasSevereFraud = fraudResult.flags.some(
        (f) => f.type === "IMPOSSIBLE_TRAVEL" || f.type === "COLLUSION_NETWORK"
      )

      const hasCoordinates = input.data.checkinLat !== undefined && input.data.checkinLng !== undefined
      const checkin = hasCoordinates
        ? isWithinGeofence(
            input.data.checkinLat!,
            input.data.checkinLng!,
            place.latitude,
            place.longitude,
            place.geofenceRadius,
          )
        : { verified: false }

      // P5.2: Suspect reviews created in Visibility.PUBLIC but flagged; reviews with 2+ flags enter admin pre-moderation queue
      const enterPreModeration = fraudResult.flags.length >= 2 || fraudResult.riskScore > 80

      const review = await tx.review.create({
        data: {
          userId: user.id,
          placeId: place.id,
          rating: input.data.rating,
          text: input.data.text,
          tags: input.data.tags,
          photoUrls: input.data.photoUrls,
          photoExifData: input.data.photoExifData ? (input.data.photoExifData as any) : undefined,
          visibility: enterPreModeration ? "HIDDEN" : input.data.visibility,
          checkinLat: input.data.checkinLat ?? null,
          checkinLng: input.data.checkinLng ?? null,
          checkinVerified: checkin.verified,
          trustWeight: user.trustScore >= 70 ? 1 : user.trustScore >= 50 ? 0.8 : user.trustScore >= 30 ? 0.5 : 0.2,
          flagCount: fraudResult.flags.length,
          isHidden: enterPreModeration,
        },
      })

      // Log detected fraud flags into Flag table for admin moderation queue
      for (const flag of fraudResult.flags) {
        const flagReason =
          flag.type === "IMPOSSIBLE_TRAVEL" || flag.type === "EXIF_MISMATCH"
            ? "FAKE_REVIEW"
            : "SPAM"
        await tx.flag.create({
          data: {
            reviewId: review.id,
            userId: user.id,
            reason: flagReason,
            detail: `[${flag.severity}] ${flag.detail}`,
          },
        }).catch(() => {})
      }

      // Recompute place ratings (raw avgRating, weightedRating, reviewCount, and bayesianRating)
      await recomputePlaceRatings(tx, place.id)

      // Base trust score calculation
      let nextTrustScore = computeTrustScore(user, [
        ...recentReviews,
        {
          createdAt: review.createdAt,
          checkinVerified: review.checkinVerified,
          checkinLat: review.checkinLat,
          checkinLng: review.checkinLng,
          exifMatch,
          flagCount: review.flagCount,
        },
      ]).score

      if (hasSevereFraud) {
        nextTrustScore = adjustTrustScore(nextTrustScore, -CONFIG.fraudFlagTrustDecrement)
      }

      await tx.user.update({
        where: { id: user.id },
        data: { trustScore: nextTrustScore },
      })

      return { review, checkinVerified: checkin.verified, photoVerified: exifMatch }
    })

    if (!result) {
      return NextResponse.json({ success: false, error: "Place not found" }, { status: 404 })
    }
    if ("alreadyReviewed" in result) {
      return NextResponse.json({ success: false, error: "You have already reviewed this place" }, { status: 409 })
    }

    return NextResponse.json({
      success: true,
      reviewId: result.review.id,
      checkinVerified: result.checkinVerified,
      photoVerified: result.photoVerified,
    })
  } catch (error) {
    console.error("Review submission failed", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const ip = getIpFromRequest(request)
    const rl = await enforceRateLimit(generalApiRateLimit, `reviews:get:ip:${ip}`)
    if (!rl.success) {
      return rateLimitResponse(rl)
    }

    const { searchParams } = new URL(request.url)
    const take = Math.min(20, Math.max(1, parseInt(searchParams.get("take") || "6", 10)))
    const placeId = searchParams.get("placeId") || undefined
    const verifiedOnly = searchParams.get("verifiedOnly") !== "false"

    const where: any = {
      visibility: "PUBLIC",
      ...(placeId ? { placeId } : {}),
      ...(verifiedOnly ? { checkinVerified: true } : {}),
    }

    const [reviews, totalVerified, totalPlaces] = await Promise.all([
      prisma.review.findMany({
        where,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              trustScore: true,
            },
          },
          place: {
            select: {
              id: true,
              name: true,
              address: true,
              category: true,
            },
          },
        },
      }),
      prisma.review.count({ where: { visibility: "PUBLIC", checkinVerified: true } }),
      prisma.place.count(),
    ])

    return NextResponse.json({
      success: true,
      data: reviews.map((r) => ({
        id: r.id,
        user: r.user?.displayName || "Pune Resident",
        trustScore: r.user?.trustScore || 50,
        place: r.place?.name || "Pune Venue",
        hub: r.place?.address ? r.place.address.split(",")[0].trim() : "Pune",
        category: r.place?.category || "SPOT",
        rating: r.rating,
        text: r.text || "",
        checkinVerified: r.checkinVerified,
        createdAt: r.createdAt.toISOString(),
      })),
      meta: {
        totalVerifiedReviews: totalVerified,
        totalPlaces,
      },
    })
  } catch (error) {
    console.warn("GET /api/reviews fallback (database offline or initializing):", error)
    return NextResponse.json({
      success: true,
      data: [],
      meta: {
        totalVerifiedReviews: 0,
        totalPlaces: 0,
      },
    })
  }
}
