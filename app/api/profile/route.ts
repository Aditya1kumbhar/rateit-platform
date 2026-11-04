import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/server-auth"
import { profileSchema } from "@/lib/validation"
import { generalApiRateLimit, enforceRateLimit, rateLimitResponse, getIpFromRequest } from "@/lib/ratelimit"

export const dynamic = "force-dynamic"

const profileInclude = {
  reviews: {
    where: { isHidden: false },
    include: { place: true },
    orderBy: { createdAt: "desc" as const },
  },
  lists: {
    orderBy: { createdAt: "desc" as const },
    include: { _count: { select: { items: true } } },
  },
}

export async function GET(request: NextRequest) {
  try {
    const authenticated = await getAuthenticatedUser()
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const ip = getIpFromRequest(request)
    const rl = await enforceRateLimit(generalApiRateLimit, `user:${authenticated.user.id}:ip:${ip}`)
    if (!rl.success) {
      return rateLimitResponse(rl)
    }

    const user = await prisma.user.findUnique({
      where: { id: authenticated.user.id },
      include: profileInclude,
    })
    if (!user) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      phone: user.phone,
      displayName: user.displayName ?? "RateIT User",
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      trustScore: user.trustScore,
      phoneVerified: user.phoneVerified,
      consentGiven: user.consentGiven,
      createdAt: user.createdAt,
      reviewsCount: user.reviews.length,
      listsCount: user.lists.length,
      reviews: user.reviews,
      lists: user.lists.map(({ _count, ...list }) => ({ ...list, itemCount: _count.items })),
    })
  } catch (error) {
    console.error("Fetching profile failed", error)
    return NextResponse.json({ error: "Unable to fetch profile" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authenticated = await getAuthenticatedUser()
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const ip = getIpFromRequest(request)
    const rl = await enforceRateLimit(generalApiRateLimit, `user:${authenticated.user.id}:ip:${ip}`)
    if (!rl.success) {
      return rateLimitResponse(rl)
    }

    const input = profileSchema.safeParse(await request.json())
    if (!input.success) {
      return NextResponse.json(
        { error: "Invalid profile data", details: input.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: authenticated.user.id },
      data: {
        ...(input.data.displayName !== undefined ? { displayName: input.data.displayName } : {}),
        ...(input.data.bio !== undefined ? { bio: input.data.bio } : {}),
        ...(input.data.avatarUrl !== undefined ? { avatarUrl: input.data.avatarUrl } : {}),
        ...(input.data.consentGiven ? { consentGiven: true, consentDate: new Date() } : {}),
      },
      select: {
        id: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        consentGiven: true,
        consentDate: true,
        trustScore: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Updating profile failed", error)
    return NextResponse.json({ error: "Unable to update profile" }, { status: 500 })
  }
}

/**
 * P1.8 / DPDP: Consent withdrawal endpoint
 * Sets user.consentGiven = false and deletes all raw UserEvents for this user.
 */
export async function DELETE(request: NextRequest) {
  try {
    const authenticated = await getAuthenticatedUser()
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const ip = getIpFromRequest(request)
    const rl = await enforceRateLimit(generalApiRateLimit, `user:${authenticated.user.id}:ip:${ip}`)
    if (!rl.success) {
      return rateLimitResponse(rl)
    }

    await prisma.$transaction([
      // 1. Withdraw consent
      prisma.user.update({
        where: { id: authenticated.user.id },
        data: {
          consentGiven: false,
          consentDate: null,
          dataEraseReq: new Date(),
        },
      }),
      // 2. Delete all tracked raw user events
      prisma.userEvent.deleteMany({
        where: { userId: authenticated.user.id },
      }),
      // 3. Delete user interest profile
      prisma.userInterest.deleteMany({
        where: { userId: authenticated.user.id },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: "Consent withdrawn successfully. All raw tracked personal activity data has been permanently deleted under DPDP 2023.",
    })
  } catch (error) {
    console.error("Consent withdrawal failed", error)
    return NextResponse.json({ error: "Unable to withdraw consent" }, { status: 500 })
  }
}
