"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Search, Star, MapPin, Heart, Filter, Home, User, Plus } from "lucide-react"
import Link from "next/link"
import { EnhancedRateModal } from "@/components/enhanced-rate-modal"
import { BottomNav } from "@/components/bottom-nav"
import { SaveToListsModal } from "@/components/save-to-lists-modal"
import { PUNE_SEED_PLACES } from "@/lib/mock"

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("rating")
  const [activeTab, setActiveTab] = useState("discover")

  const [showRateModal, setShowRateModal] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [selectedItemForSave, setSelectedItemForSave] = useState<string>("")

  // Dynamic categories based on data
  const categories = ["all", "COACHING", "PG_HOSTEL", "CAFE", "RESTAURANT", "LOCAL_SERVICE"]

  const filteredAndSortedPlaces = useMemo(() => {
    const filtered = PUNE_SEED_PLACES.filter((place) => {
      const normalizedSearch = searchQuery.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      const normalizedName = place.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      const normalizedDescription = place.description ? place.description.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : ""

      const matchesSearch =
        normalizedName.includes(normalizedSearch) ||
        normalizedDescription.includes(normalizedSearch)
      const matchesCategory = selectedCategory === "all" || place.category === selectedCategory
      return matchesSearch && matchesCategory
    })

    return filtered.sort((a, b) => {
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
  }, [searchQuery, selectedCategory, sortBy])

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-gray-600 hover:text-black">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-black">Discover</h1>
          </div>
          <Button variant="ghost" size="icon" className="text-gray-600 hover:text-black">
            <Filter className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            className="pl-10 h-12 bg-white border-gray-200 focus:border-gray-300 focus:ring-0 text-gray-800 placeholder:text-gray-400 rounded-xl"
            placeholder="Search places, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[140px] bg-white border-gray-200">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : cat.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] bg-white border-gray-200">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="reviews">Most Reviews</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <p className="text-gray-600">{filteredAndSortedPlaces.length} places found</p>

          {filteredAndSortedPlaces.map((place) => (
            <Link key={place.id} href={`/item/${place.id}`} className="block">
              <Card className="bg-white border border-gray-200 hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex space-x-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800 text-xl mb-2">{place.name}</h3>
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                              <span className="font-medium text-gray-800">{place.avgRating}</span>
                            </div>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-600">{place.reviewCount} reviews</span>
                            {place.priceRange && (
                              <>
                                <span className="text-gray-500">•</span>
                                <span className="text-gray-600">{place.priceRange}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mb-3">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">{place.address}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-red-400"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setSelectedItemForSave(place.name)
                            setShowSaveModal(true)
                          }}
                        >
                          <Heart className="h-5 w-5" />
                        </Button>
                      </div>
                      <p className="text-gray-600 mb-3">{place.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {place.tags?.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-200">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {filteredAndSortedPlaces.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-500">No places found matching your search.</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 z-40">
        <Button
          size="lg"
          onClick={() => setShowRateModal(true)}
          className="rounded-full shadow-lg bg-black hover:bg-gray-800 text-white border-0"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Place
        </Button>
      </div>

      {/* Modals */}
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
