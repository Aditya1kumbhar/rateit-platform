import { prisma } from "@/lib/prisma"
import { Category } from "@prisma/client"
import { CategoryClient } from "./category-client"

export const dynamic = "force-dynamic"

const slugToCategory: Record<string, Category> = {
  "coaching-classes": "COACHING",
  "pgs-hostels": "PG_HOSTEL",
  "cafes": "CAFE",
  "restaurants": "RESTAURANT",
  "local-services": "LOCAL_SERVICE",
}

const slugToName: Record<string, string> = {
  "coaching-classes": "Coaching Classes",
  "pgs-hostels": "PGs & Hostels",
  "cafes": "Cafés",
  "restaurants": "Restaurants",
  "local-services": "Local Services",
}

interface CategoryPageProps {
  params: {
    slug: string
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const decodedSlug = decodeURIComponent(params.slug)
  const slug = decodedSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-")

  const categoryEnum = slugToCategory[slug]
  const categoryName = slugToName[slug] || (slug.charAt(0).toUpperCase() + slug.slice(1).replace("-", " "))

  let places: any[] = []
  if (categoryEnum) {
    try {
      places = await prisma.place.findMany({
        where: { category: categoryEnum },
        orderBy: { avgRating: "desc" },
        take: 50,
      })
    } catch (error) {
      console.error("Failed to load category places from DB, using seed fallback:", error)
    }

    if (!places || places.length === 0) {
      const { PUNE_SEED_PLACES } = await import("@/lib/mock")
      places = PUNE_SEED_PLACES.filter((p) => p.category === categoryEnum).map((p) => ({
        ...p,
        avgRating: p.avgRating,
        reviewCount: p.reviewCount,
      }))
    }
  }

  return <CategoryClient categoryName={categoryName} places={places} />
}
