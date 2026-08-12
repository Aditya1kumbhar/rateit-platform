import { type Prisma } from "@prisma/client"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { isAdmin } from "@/lib/server-auth"
import { createClient } from "@/lib/supabase/server"
import { createPlaceSchema, placesQuerySchema } from "@/lib/validation"

const publicPlaceSelect = {
  id: true,
  name: true,
  category: true,
  description: true,
  address: true,
  city: true,
  latitude: true,
  longitude: true,
  avgRating: true,
  weightedRating: true,
  reviewCount: true,
  geofenceRadius: true,
  isVerifiedBiz: true,
  claimStatus: true,
  tags: true,
  priceRange: true,
  imageUrl: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PlaceSelect

export async function GET(request: Request) {
  const parsedUrl = new URL(request.url)
  const input = placesQuerySchema.safeParse(Object.fromEntries(parsedUrl.searchParams))

  if (!input.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: input.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  try {
    const { search, category, sortBy, take, skip } = input.data
    const where: Prisma.PlaceWhereInput = {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(category && category !== "all" ? { category } : {}),
    }

    const orderBy: Prisma.PlaceOrderByWithRelationInput =
      sortBy === "name" ? { name: "asc" } : sortBy === "reviews" ? { reviewCount: "desc" } : { avgRating: "desc" }

    const [places, total] = await prisma.$transaction([
      prisma.place.findMany({ where, orderBy, take, skip, select: publicPlaceSelect }),
      prisma.place.count({ where }),
    ])

    return NextResponse.json({ data: places, pagination: { total, take, skip } })
  } catch (error) {
    console.error("Fetching places failed", error)
    return NextResponse.json({ error: "Unable to fetch places" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user || !isAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const input = createPlaceSchema.safeParse(await request.json())
    if (!input.success) {
      return NextResponse.json(
        { error: "Invalid place data", details: input.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const place = await prisma.place.create({
      data: input.data,
      select: publicPlaceSelect,
    })

    return NextResponse.json(place, { status: 201 })
  } catch (error) {
    console.error("Creating place failed", error)
    return NextResponse.json({ error: "Unable to create place" }, { status: 500 })
  }
}
