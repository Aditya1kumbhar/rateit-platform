import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/server-auth"
import { profileSchema } from "@/lib/validation"

const profileInclude = {
  reviews: {
    include: { place: true },
    orderBy: { createdAt: "desc" as const },
  },
  lists: {
    orderBy: { createdAt: "desc" as const },
    include: { _count: { select: { items: true } } },
  },
}

export async function GET() {
  try {
    const authenticated = await getAuthenticatedUser()
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
        displayName: input.data.displayName,
        bio: input.data.bio,
        avatarUrl: input.data.avatarUrl,
        ...(input.data.consentGiven ? { consentGiven: true, consentDate: new Date() } : {}),
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Updating profile failed", error)
    return NextResponse.json({ error: "Unable to update profile" }, { status: 500 })
  }
}
