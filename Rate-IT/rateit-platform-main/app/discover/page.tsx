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

// Mock data for discover page
const mockPlaces = [
  {
    id: 1,
    name: "The Daily Grind",
    category: "Coffee Shop",
    rating: 4.5,
    reviewCount: 234,
    location: "Downtown SF",
    price: "$$",
    tags: ["Cozy", "WiFi", "Good Coffee"],
    description: "A cozy coffee shop perfect for working and meetings.",
  },
  {
    id: 2,
    name: "Bella Vista Restaurant",
    category: "Restaurant",
    rating: 4.8,
    reviewCount: 456,
    location: "North Beach",
    price: "$$$",
    tags: ["Italian", "Romantic", "Great View"],
    description: "Authentic Italian cuisine with stunning city views.",
  },
  {
    id: 3,
    name: "Golden Gate Cinema",
    category: "Entertainment",
    rating: 4.6,
    reviewCount: 312,
    location: "Mission District",
    price: "$$",
    tags: ["IMAX", "Comfortable", "Latest Movies"],
    description: "Premium cinema experience with latest technology.",
  },
]

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("rating")
  const [activeTab, setActiveTab] = useState("discover")

  const [showRateModal, setShowRateModal] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [selectedItemForSave, setSelectedItemForSave] = useState<string>("")

  const categories = ["all", "Coffee Shop", "Restaurant", "Entertainment", "Fitness", "Bakery"]

  const filteredAndSortedPlaces = useMemo(() => {
    const filtered = mockPlaces.filter((place) => {
      const matchesSearch =
        place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "all" || place.category === selectedCategory
      return matchesSearch && matchesCategory
    })

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating
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
    <div className="min-h-screen bg-white pb-20">
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
        {/* Search and Filters */}
        <div className="space-y-6 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search places, restaurants, cafes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-gray-50 border-gray-200 text-black placeholder:text-gray-500 focus:border-gray-300 rounded-xl"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48 bg-gray-50 border-gray-200 text-black rounded-xl">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 rounded-xl">
                {categories.map((category) => (
                  <SelectItem key={category} value={category} className="text-black hover:bg-gray-50">
                    {category === "all" ? "All Categories" : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48 bg-gray-50 border-gray-200 text-black rounded-xl">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 rounded-xl">
                <SelectItem value="rating" className="text-black hover:bg-gray-50">
                  Highest Rated
                </SelectItem>
                <SelectItem value="reviews" className="text-black hover:bg-gray-50">
                  Most Reviews
                </SelectItem>
                <SelectItem value="name" className="text-black hover:bg-gray-50">
                  Name A-Z
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <p className="text-gray-600">{filteredAndSortedPlaces.length} places found</p>

          {filteredAndSortedPlaces.map((place) => (
            <Card key={place.id} className="calm-card border-0 hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex space-x-6">
                  <div className="w-24 h-24 bg-gray-800 rounded-xl flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-white text-xl mb-2">{place.name}</h3>
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                            <span className="font-medium text-white">{place.rating}</span>
                          </div>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-300">{place.reviewCount} reviews</span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-300">{place.price}</span>
                        </div>
                        <div className="flex items-center space-x-2 mb-3">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-300">{place.location}</span>
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
                    <p className="text-gray-300 mb-3">{place.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {place.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="bg-gray-700 text-gray-200 hover:bg-gray-600">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <BottomNav onRateClick={() => setShowRateModal(true)} />

      {/* Rate Modal */}
      {showRateModal && <EnhancedRateModal onClose={() => setShowRateModal(false)} />}

      {/* Save to Lists Modal */}
      {showSaveModal && (
        <SaveToListsModal
          itemName={selectedItemForSave}
          onClose={() => {
            setShowSaveModal(false)
            setSelectedItemForSave("")
          }}
        />
      )}
    </div>
  )
}
