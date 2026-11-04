import { prisma } from "@/lib/prisma"
import { DiscoverClient } from "./discover-client"
import { PUNE_SEED_PLACES } from "@/lib/mock"

export const dynamic = "force-dynamic"

export default async function DiscoverPage() {
  let places: any[] = []
  try {
    places = await prisma.place.findMany({
      orderBy: { avgRating: "desc" },
      take: 50,
    })
  } catch (error) {
    console.error("DiscoverPage: Unable to fetch places from DB, using seed fallback", error)
  }

  if (!places || places.length === 0) {
    places = PUNE_SEED_PLACES.map((p) => ({
      ...p,
      avgRating: p.avgRating,
      reviewCount: p.reviewCount,
    }))
  }

  return <DiscoverClient initialPlaces={places} />
}
