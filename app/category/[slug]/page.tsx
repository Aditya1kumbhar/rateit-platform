"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Star, MapPin, Filter } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { EnhancedRateModal } from "@/components/enhanced-rate-modal"
import { BottomNav } from "@/components/bottom-nav"
import { SaveToListsModal } from "@/components/save-to-lists-modal"
import { PUNE_SEED_PLACES } from "@/lib/mock"

const slugToCategory: Record<string, string> = {
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

export default function CategoryPage() {
  const params = useParams()
  const rawSlug = params.slug as string
  const decodedSlug = decodeURIComponent(rawSlug)
  const slug = decodedSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-")

  const [sortBy, setSortBy] = useState("rating")
  const [showRateModal, setShowRateModal] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [selectedItemForSave, setSelectedItemForSave] = useState<string>("")

  const categoryEnum = slugToCategory[slug]
  const categoryName = slugToName[slug] || (slug.charAt(0).toUpperCase() + slug.slice(1).replace("-", " "))
  
  const items = PUNE_SEED_PLACES.filter((place) => place.category === categoryEnum)

  const sortedItems = [...items].sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return b.avgRating - a.avgRating
      case "reviews":
        return b.reviewCount - a.reviewCount
      case "name":
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-[#2E2E2E]">{categoryName}</h1>
          </div>
          <Button variant="ghost" size="icon">
            <Filter className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#2E2E2E] mb-2">Best {categoryName}</h2>
          <p className="text-gray-600">
            {items.length} places found
          </p>
        </div>

        <div className="flex space-x-2 mb-6">
          <Button variant={sortBy === "rating" ? "default" : "outline"} size="sm" onClick={() => setSortBy("rating")}>
            Highest Rated
          </Button>
          <Button variant={sortBy === "reviews" ? "default" : "outline"} size="sm" onClick={() => setSortBy("reviews")}>
            Most Reviews
          </Button>
          <Button variant={sortBy === "name" ? "default" : "outline"} size="sm" onClick={() => setSortBy("name")}>
            Name A-Z
          </Button>
        </div>

        <div className="space-y-4 pb-20">
          {sortedItems.map((item) => (
            <Link href={`/item/${item.id}`} key={item.id} className="block">
              <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex space-x-4">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-[#2E2E2E] text-lg">{item.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="ml-1 font-medium">{item.avgRating}</span>
                            </div>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600">{item.reviewCount} reviews</span>
                            {item.priceRange && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-600">{item.priceRange}</span>
                              </>
                            )}
                          </div>
                          {item.address && (
                            <div className="flex items-center space-x-1 mt-1">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600 text-sm">{item.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.tags?.slice(0, 3).map((tag, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {sortedItems.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-500">No places found in this category yet.</p>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-20 right-4 z-40">
        <Button
          size="lg"
          onClick={() => setShowRateModal(true)}
          className="rounded-full shadow-lg bg-black hover:bg-gray-800 text-white border-0"
        >
          <Star className="h-5 w-5 mr-2" />
          Rate a Place
        </Button>
      </div>

      <BottomNav onRateClick={() => setShowRateModal(true)} />

      {showRateModal && <EnhancedRateModal onClose={() => setShowRateModal(false)} />}
      
      {showSaveModal && (
        <SaveToListsModal
          onClose={() => setShowSaveModal(false)}
          itemName={selectedItemForSave}
        />
      )}
    </div>
  )
}
