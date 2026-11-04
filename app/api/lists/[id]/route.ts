import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/server-auth"
import { updateListSchema } from "@/lib/validation"
import { generalApiRateLimit, enforceRateLimit, rateLimitResponse, getIpFromRequest } from "@/lib/ratelimit"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const list = await prisma.list.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            place: {
              select: {
                id: true,
                name: true,
                category: true,
                address: true,
                avgRating: true,
                reviewCount: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    })

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 })
    }

    if (list.isPrivate) {
      const authenticated = await getAuthenticatedUser()
      if (!authenticated || authenticated.user.id !== list.userId) {
        return NextResponse.json({ error: "Forbidden: Private list" }, { status: 403 })
      }
    }

    return NextResponse.json(list)
  } catch (error) {
    console.error("GET /api/lists/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const list = await prisma.list.findUnique({
      where: { id: params.id },
    })

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 })
    }

    // P1.1 BOLA check: List mutations are owner-only
    if (list.userId !== authenticated.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this list" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const input = updateListSchema.safeParse(body)
    if (!input.success) {
      return NextResponse.json(
        { error: "Invalid list data", details: input.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (input.data.placeIds) {
        const placeIds = [...new Set(input.data.placeIds)]
        // Delete existing items and replace with new ones
        await tx.listItem.deleteMany({ where: { listId: list.id } })
        if (placeIds.length) {
          await tx.listItem.createMany({
            data: placeIds.map((placeId) => ({ listId: list.id, placeId })),
          })
        }
      }

      return tx.list.update({
        where: { id: list.id },
        data: {
          ...(input.data.name !== undefined ? { name: input.data.name } : {}),
          ...(input.data.description !== undefined ? { description: input.data.description } : {}),
          ...(input.data.isPrivate !== undefined ? { isPrivate: input.data.isPrivate } : {}),
          ...(input.data.iconName !== undefined ? { iconName: input.data.iconName } : {}),
        },
        include: { _count: { select: { items: true } } },
      })
    })

    const { _count, ...data } = updated
    return NextResponse.json({ ...data, itemCount: _count.items })
  } catch (error) {
    console.error("PUT /api/lists/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const list = await prisma.list.findUnique({
      where: { id: params.id },
    })

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 })
    }

    // P1.1 BOLA check: List deletion is owner-only
    if (list.userId !== authenticated.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this list" },
        { status: 403 }
      )
    }

    await prisma.list.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true, message: "List deleted successfully" })
  } catch (error) {
    console.error("DELETE /api/lists/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

