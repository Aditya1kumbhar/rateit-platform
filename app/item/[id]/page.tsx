import { prisma } from "@/lib/prisma"
import { ItemClient } from "./item-client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MapPin, Compass } from "lucide-react"

export const dynamic = "force-dynamic"

interface ItemPageProps {
  params: {
    id: string
  }
}

export default async function ItemDetailPage({ params }: ItemPageProps) {
  let place = null
  try {
    place = await prisma.place.findUnique({
      where: { id: params.id },
      include: {
        reviews: {
          where: { isHidden: false },
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                trustScore: true,
              },
            },
            bizReply: true,
          },
          orderBy: { publishDate: "desc" },
        },
      },
    })
  } catch (error) {
    console.error("ItemDetailPage: Failed to load place from DB:", error)
    place = null
  }

  if (!place) {
    const { PUNE_SEED_PLACES, PUNE_SEED_REVIEWS } = await import("@/lib/mock")
    const mockPlace = PUNE_SEED_PLACES.find((p) => p.id === params.id || p.name.toLowerCase() === decodeURIComponent(params.id).toLowerCase())
    if (mockPlace) {
      const placeReviews = PUNE_SEED_REVIEWS.slice(0, 3).map((r, i) => ({
        id: `seed_rev_${mockPlace.id}_${i}`,
        rating: r.rating,
        text: r.text,
        tags: r.tags,
        photoUrls: [],
        checkinVerified: r.checkinVerified,
        publishDate: new Date(Date.now() - i * 86400000),
        user: {
          id: `seed_user_${i}`,
          displayName: r.displayName,
          avatarUrl: null,
          trustScore: r.trustTier === "trusted" ? 85 : 60,
        },
        bizReply: null,
      }))

      place = {
        ...mockPlace,
        isVerifiedBiz: true,
        reviews: placeReviews,
      } as any
    }
  }

  if (!place) {
    return (
      <div className="container mx-auto px-4 py-20 flex items-center justify-center">
        <div className="text-center max-w-md p-8 rounded-modal bg-surface space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-accent-tint text-accent-link flex items-center justify-center mx-auto">
            <MapPin className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-semibold text-fg">Place not found</h2>
          <p className="text-fg-muted text-sm leading-relaxed">
            The spot you are looking for does not exist in our Pune database or may have been removed.
          </p>
          <Link href="/discover" className="block pt-2">
            <Button className="w-full bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl py-2.5 apple-press apple-focus">
              <Compass className="w-4 h-4 mr-2" />
              Discover Pune Places
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return <ItemClient place={place} />
}
