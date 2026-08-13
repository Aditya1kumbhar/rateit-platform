import { type NextRequest, NextResponse } from "next/server"

import { runFraudChecks } from "@/lib/fraud-heuristics"
import { isWithinGeofence } from "@/lib/geolocation"
import { prisma } from "@/lib/prisma"
import { getIpFromRequest, isRateLimitConfigured, submitReviewRateLimit } from "@/lib/ratelimit"
import { getAuthenticatedUser } from "@/lib/server-auth"
import { computeTrustScore } from "@/lib/trust-score"
import { reviewSchema } from "@/lib/validation"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const authenticated = await getAuthenticatedUser()
    if (!authenticated) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    if (!isRateLimitConfigured) {
      if (process.env.NODE_ENV === "production") {
        console.error("Review submission blocked because Upstash is not configured")
        return NextResponse.json({ success: false, error: "Service temporarily unavailable" }, { status: 503 })
      }
    } else if (submitReviewRateLimit) {
      const ip = getIpFromRequest(request)
      const { success, limit, remaining, reset } = await submitReviewRateLimit.limit(ip)

      if (!success) {
        return NextResponse.json(
          { success: false, error: "Too many review submissions. Please try again later." },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": remaining.toString(),
              "X-RateLimit-Reset": reset.toString(),
            },
          },
        )
      }
    }

    const input = reviewSchema.safeParse(await request.json())
    if (!input.success) {
      return NextResponse.json(
        { success: false, error: "Invalid review data", details: input.error.flatten().fieldErrors },
        { status: 400 },
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

      const fraudResult = runFraudChecks({
        reviewText: input.data.text ?? "",
        existingUserReviewTexts: recentReviews.map((review) => review.text ?? ""),
        userReviewTimestamps: recentReviews.map((review) => review.createdAt),
        accountCreatedAt: user.accountAge,
        totalReviewCount: recentReviews.length,
      })

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

      const review = await tx.review.create({
        data: {
          userId: user.id,
          placeId: place.id,
          rating: input.data.rating,
          text: input.data.text,
          tags: input.data.tags,
          photoUrls: input.data.photoUrls,
          visibility: input.data.visibility,
          checkinLat: input.data.checkinLat ?? null,
          checkinLng: input.data.checkinLng ?? null,
          checkinVerified: checkin.verified,
          trustWeight: user.trustScore >= 70 ? 1 : user.trustScore >= 50 ? 0.8 : user.trustScore >= 30 ? 0.5 : 0.2,
          flagCount: fraudResult.isSuspicious ? 1 : 0,
          isHidden: fraudResult.riskScore > 80,
        },
      })

      const placeReviews = await tx.review.findMany({
        where: { placeId: place.id },
        select: { rating: true, trustWeight: true },
      })
      const reviewCount = placeReviews.length
      const avgRating = placeReviews.reduce((sum, item) => sum + item.rating, 0) / reviewCount
      const totalWeight = placeReviews.reduce((sum, item) => sum + item.trustWeight, 0)
      const weightedRating = totalWeight
        ? placeReviews.reduce((sum, item) => sum + item.rating * item.trustWeight, 0) / totalWeight
        : avgRating

      const trust = computeTrustScore(user, [
        ...recentReviews,
        {
          createdAt: review.createdAt,
          checkinVerified: review.checkinVerified,
          checkinLat: review.checkinLat,
          checkinLng: review.checkinLng,
          flagCount: review.flagCount,
        },
      ])

      await Promise.all([
        tx.place.update({ where: { id: place.id }, data: { avgRating, weightedRating, reviewCount } }),
        tx.user.update({ where: { id: user.id }, data: { trustScore: trust.score } }),
      ])

      return { review, checkinVerified: checkin.verified }
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
    })
  } catch (error) {
    console.error("Review submission failed", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
