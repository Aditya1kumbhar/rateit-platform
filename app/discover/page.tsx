"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Search, Star, MapPin, Heart, Plus } from "lucide-react"
import Link from "next/link"

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
    image: "/placeholder.svg?height=200&width=300",
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
    image: "/placeholder.svg?height=200&width=300",
    tags: ["Italian", "Romantic", "Great View"],
    description: "Authentic Italian cuisine with stunning city views.",
  },
  {
    id: 3,
    name: "Tech Hub Coworking",
    category: "Workspace",
    rating: 4.2,
    reviewCount: 89,
    location: "SOMA",
    price: "$",
    image: "/placeholder.svg?height=200&width=300",
    tags: ["Modern", "Fast WiFi", "24/7"],
    description: "Modern coworking space with all amenities.",
  },
  {
    id: 4,
    name: "Golden Gate Cinema",
    category: "Entertainment",
    rating: 4.6,
    reviewCount: 312,
    location: "Mission District",
    price: "$$",
    image: "/placeholder.svg?height=200&width=300",
    tags: ["IMAX", "Comfortable", "Latest Movies"],
    description: "Premium cinema experience with latest technology.",
  },
  {
    id: 5,
    name: "Fitness First Gym",
    category: "Fitness",
    rating: 4.3,
    reviewCount: 178,
    location: "Castro",
    price: "$$",
    image: "/placeholder.svg?height=200&width=300",
    tags: ["Modern Equipment", "Classes", "Pool"],
    description: "Full-service gym with pool and group classes.",
  },
  {
    id: 6,
    name: "Artisan Bakery",
    category: "Bakery",
    rating: 4.7,
    reviewCount: 203,
    location: "Hayes Valley",
    price: "$$",
    image: "/placeholder.svg?height=200&width=300",
    tags: ["Fresh Bread", "Pastries", "Organic"],
    description: "Fresh artisan bread and pastries made daily.",
  },
]

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("rating")
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<any>(null)

  const categories = ["all", "Coffee Shop", "Restaurant", "Workspace", "Entertainment", "Fitness", "Bakery"]

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

  const handleSaveToList = (place: any) => {
    setSelectedPlace(place)
    setShowSaveModal(true)
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-[#2E2E2E]">Discover</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search places, restaurants, cafes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex space-x-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="reviews">Most Reviews</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <p className="text-gray-600">{filteredAndSortedPlaces.length} places found</p>

          {filteredAndSortedPlaces.map((place) => (
            <Card key={place.id} className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex space-x-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-[#2E2E2E] text-lg">{place.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="ml-1 font-medium">{place.rating}</span>
                          </div>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-600">{place.reviewCount} reviews</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-600">{place.price}</span>
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 text-sm">{place.location}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSaveToList(place)}
                        className="text-gray-400 hover:text-[#FF6B6B]"
                      >
                        <Heart className="h-5 w-5" />
                      </Button>
                    </div>
                    <p className="text-gray-600 text-sm mt-2">{place.description}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {place.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
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

      {/* Save to List Modal */}
      {showSaveModal && <SaveToListModal place={selectedPlace} onClose={() => setShowSaveModal(false)} />}
    </div>
  )
}

function SaveToListModal({ place, onClose }: { place: any; onClose: () => void }) {
  const [selectedLists, setSelectedLists] = useState<string[]>([])
  const [newListName, setNewListName] = useState("")
  const [showNewListInput, setShowNewListInput] = useState(false)

  const userLists = ["My Favorite Restaurants", "Best Coffee Shops", "Weekend Spots"]

  const toggleList = (listName: string) => {
    setSelectedLists((prev) => (prev.includes(listName) ? prev.filter((l) => l !== listName) : [...prev, listName]))
  }

  const handleSave = () => {
    // Here you would save to the selected lists
    console.log("Saving", place.name, "to lists:", selectedLists)
    if (newListName) {
      console.log("Creating new list:", newListName)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#2E2E2E]">Save to List</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <span className="text-xl">×</span>
            </Button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Saving: <strong>{place?.name}</strong>
            </p>
          </div>

          <div className="space-y-2 mb-4">
            {userLists.map((listName) => (
              <div key={listName} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={listName}
                  checked={selectedLists.includes(listName)}
                  onChange={() => toggleList(listName)}
                  className="rounded"
                />
                <label htmlFor={listName} className="text-sm text-[#2E2E2E]">
                  {listName}
                </label>
              </div>
            ))}
          </div>

          {showNewListInput ? (
            <div className="mb-4">
              <Input
                placeholder="New list name"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="mb-2"
              />
              <Button variant="outline" size="sm" onClick={() => setShowNewListInput(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowNewListInput(true)} className="mb-4 w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create New List
            </Button>
          )}

          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-[#4B0082] hover:bg-[#3A0066]">
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
