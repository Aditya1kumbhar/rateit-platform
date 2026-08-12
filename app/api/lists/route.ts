import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/server-auth"
import { createListSchema } from "@/lib/validation"

export async function GET() {
  try {
    const authenticated = await getAuthenticatedUser()
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const lists = await prisma.list.findMany({
      where: { userId: authenticated.user.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { items: true } } },
    })

    return NextResponse.json(
      lists.map(({ _count, ...list }) => ({ ...list, itemCount: _count.items })),
    )
  } catch (error) {
    console.error("Fetching lists failed", error)
    return NextResponse.json({ error: "Unable to fetch lists" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authenticated = await getAuthenticatedUser()
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const input = createListSchema.safeParse(await request.json())
    if (!input.success) {
      return NextResponse.json(
        { error: "Invalid list data", details: input.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const placeIds = [...new Set(input.data.placeIds)]
    if (placeIds.length) {
      const placeCount = await prisma.place.count({ where: { id: { in: placeIds } } })
      if (placeCount !== placeIds.length) {
        return NextResponse.json({ error: "One or more places do not exist" }, { status: 400 })
      }
    }

    const list = await prisma.list.create({
      data: {
        userId: authenticated.user.id,
        name: input.data.name,
        description: input.data.description,
        isPrivate: input.data.isPrivate,
        iconName: input.data.iconName,
        items: placeIds.length ? { create: placeIds.map((placeId) => ({ placeId })) } : undefined,
      },
      include: { _count: { select: { items: true } } },
    })

    const { _count, ...listData } = list
    return NextResponse.json({ ...listData, itemCount: _count.items }, { status: 201 })
  } catch (error) {
    console.error("Creating list failed", error)
    return NextResponse.json({ error: "Unable to create list" }, { status: 500 })
  }
}
