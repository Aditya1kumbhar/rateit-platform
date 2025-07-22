"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, User, Star, Coffee, Film, GraduationCap, MapPin, Camera, Heart } from "lucide-react"
import Link from "next/link"

// Mock Data
const mockUserData = {
  ratings: [
    {
      id: 1,
      itemName: "The Daily Grind",
      category: "Coffee Shop",
      rating: 4.5,
      date: new Date("2025-01-15"),
      caption: "Great coffee and atmosphere!",
    },
    {
      id: 2,
      itemName: "Inception",
      category: "Movie",
      rating: 5,
      date: new Date("2025-01-14"),
      caption: "Mind-bending masterpiece",
    },
    {
      id: 3,
      itemName: "The Cozy Corner",
      category: "Restaurant",
      rating: 4.2,
      date: new Date("2025-01-13"),
      caption: "Perfect for date nights",
    },
    {
      id: 4,
      itemName: "Stanford University",
      category: "College",
      rating: 4.8,
      date: new Date("2025-01-12"),
      caption: "Excellent academics and campus",
    },
    {
      id: 5,
      itemName: "Blue Bottle Coffee",
      category: "Coffee Shop",
      rating: 4.0,
      date: new Date("2025-01-11"),
      caption: "Good but overpriced",
    },
    {
      id: 6,
      itemName: "Dune: Part Two",
      category: "Movie",
      rating: 4.7,
      date: new Date("2025-01-10"),
      caption: "Visually stunning sequel",
    },
    {
      id: 7,
      itemName: "Local Bistro",
      category: "Restaurant",
      rating: 3.8,
      date: new Date("2025-01-09"),
      caption: "Decent food, slow service",
    },
    {
      id: 8,
      itemName: "UC Berkeley",
      category: "College",
      rating: 4.5,
      date: new Date("2025-01-08"),
      caption: "Great research opportunities",
    },
  ],
  favorites: [
    { id: 1, itemName: "The Daily Grind", category: "Coffee Shop", dateAdded: new Date("2025-01-15") },
    { id: 2, itemName: "Inception", category: "Movie", dateAdded: new Date("2025-01-14") },
    { id: 3, itemName: "The Cozy Corner", category: "Restaurant", dateAdded: new Date("2025-01-13") },
    { id: 4, itemName: "Stanford University", category: "College", dateAdded: new Date("2025-01-12") },
    { id: 5, itemName: "Blue Bottle Coffee", category: "Coffee Shop", dateAdded: new Date("2025-01-10") },
    { id: 6, itemName: "Dune: Part Two", category: "Movie", dateAdded: new Date("2025-01-09") },
    { id: 7, itemName: "Local Bistro", category: "Restaurant", dateAdded: new Date("2025-01-08") },
    { id: 8, itemName: "Tartine Bakery", category: "Bakery", dateAdded: new Date("2025-01-07") },
    { id: 9, itemName: "The Matrix", category: "Movie", dateAdded: new Date("2025-01-06") },
    { id: 10, itemName: "Philz Coffee", category: "Coffee Shop", dateAdded: new Date("2025-01-05") },
    { id: 11, itemName: "MIT", category: "College", dateAdded: new Date("2025-01-04") },
    { id: 12, itemName: "Nopa Restaurant", category: "Restaurant", dateAdded: new Date("2025-01-03") },
    { id: 13, itemName: "Four Barrel Coffee", category: "Coffee Shop", dateAdded: new Date("2025-01-02") },
    { id: 14, itemName: "Oppenheimer", category: "Movie", dateAdded: new Date("2025-01-01") },
    { id: 15, itemName: "Harvard University", category: "College", dateAdded: new Date("2024-12-30") },
  ],
  lists: [
    { id: 1, name: "Best Coffee Shops in SF", itemCount: 8, dateCreated: new Date("2025-01-10"), isPrivate: false },
    { id: 2, name: "Must-Watch Movies 2024", itemCount: 12, dateCreated: new Date("2025-01-05"), isPrivate: false },
    { id: 3, name: "Top Universities", itemCount: 5, dateCreated: new Date("2024-12-28"), isPrivate: true },
    { id: 4, name: "Hidden Restaurant Gems", itemCount: 7, dateCreated: new Date("2024-12-20"), isPrivate: false },
    { id: 5, name: "Weekend Brunch Spots", itemCount: 6, dateCreated: new Date("2024-12-15"), isPrivate: true },
  ],
  badges: [
    { id: 1, name: "First Rating", description: "Posted your first rating", dateEarned: new Date("2024-12-01") },
    { id: 2, name: "Coffee Connoisseur", description: "Rated 10 coffee shops", dateEarned: new Date("2024-12-15") },
    { id: 3, name: "Movie Buff", description: "Rated 20 movies", dateEarned: new Date("2025-01-01") },
    { id: 4, name: "List Creator", description: "Created 5 custom lists", dateEarned: new Date("2025-01-05") },
    { id: 5, name: "Social Butterfly", description: "Got 50 likes on reviews", dateEarned: new Date("2025-01-08") },
    { id: 6, name: "Streak Master", description: "7-day rating streak", dateEarned: new Date("2025-01-12") },
    {
      id: 7,
      name: "Explorer",
      description: "Rated items in 5 different categories",
      dateEarned: new Date("2025-01-14"),
    },
  ],
}

// Helper function to calculate stats
const calculateStats = () => {
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const itemsRatedThisWeek = mockUserData.ratings.filter((rating) => rating.date >= oneWeekAgo).length
  const favoritesSaved = mockUserData.favorites.length
  const listsCreated = mockUserData.lists.length
  const badgesEarned = mockUserData.badges.length

  return {
    itemsRatedThisWeek,
    favoritesSaved,
    listsCreated,
    badgesEarned,
  }
}

export default function HomePage() {
  const [isGuest, setIsGuest] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  const trendingCategories = [
    { name: "Restaurants", icon: Coffee, image: "/placeholder.svg?height=200&width=300", count: "2.5k ratings" },
    { name: "Movies", icon: Film, image: "/placeholder.svg?height=200&width=300", count: "1.8k ratings" },
    { name: "Colleges", icon: GraduationCap, image: "/placeholder.svg?height=200&width=300", count: "950 ratings" },
  ]

  const trendingItems = [
    {
      name: "The Daily Grind",
      category: "Coffee Shop",
      rating: 4.5,
      reviews: 234,
      image: "/placeholder.svg?height=150&width=150",
    },
    {
      name: "The Midnight Hour",
      category: "Movie",
      rating: 4.2,
      reviews: 1205,
      image: "/placeholder.svg?height=150&width=150",
    },
    {
      name: "The Cozy Corner",
      category: "Restaurant",
      rating: 4.8,
      reviews: 89,
      image: "/placeholder.svg?height=150&width=150",
    },
  ]

  if (isGuest) {
    return <GuestDashboard />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4B0082] via-[#6B46C1] to-[#8B5CF6]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white">RateIt</h1>
            {showSearch ? (
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Search anything..."
                  className="w-64 bg-white/20 border-white/30 text-white placeholder:text-white/70"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSearch(false)}
                  className="text-white hover:bg-white/20"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSearch(true)}
                className="text-white hover:bg-white/20"
              >
                <Search className="h-5 w-5" />
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="text-white hover:bg-white/20">
              Log In
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Discover What People Are Saying. About Everything.
          </h2>
          <p className="text-xl text-white/80 mb-8">Ratings and honest opinions — all in your zone.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/categories">
              <Button
                size="lg"
                className="bg-[#FF6B6B] hover:bg-[#FF5252] text-white px-8 py-3 text-lg font-semibold rounded-full"
              >
                Explore Ratings
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setIsGuest(true)}
              className="text-white hover:bg-white/20 px-8 py-3 text-lg underline"
            >
              Continue as Guest
            </Button>
          </div>
        </div>
      </section>

      {/* Trending Categories */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-white mb-8">Trending Categories</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {trendingCategories.map((category, index) => (
            <Card
              key={index}
              className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 transition-all cursor-pointer"
            >
              <CardContent className="p-0">
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-lg"></div>
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <category.icon className="h-6 w-6 text-white" />
                    <h4 className="text-xl font-semibold text-white">{category.name}</h4>
                  </div>
                  <p className="text-white/70">{category.count}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Why Join Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-white mb-4">Why Join RateIt?</h3>
          <p className="text-white/80 text-lg">15,000+ ratings shared this week. What's your opinion?</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="flex items-start space-x-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <Camera className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="text-xl font-semibold text-white mb-2">Post Your Experiences</h4>
              <p className="text-white/70">Share your experiences with others.</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="text-xl font-semibold text-white mb-2">Get Local Recommendations Instantly</h4>
              <p className="text-white/70">Get instant recommendations for local spots.</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h4 className="text-2xl font-bold text-white mb-6">Ready to Share...</h4>
          <Button
            size="lg"
            className="bg-[#FF6B6B] hover:bg-[#FF5252] text-white px-12 py-4 text-lg font-semibold rounded-full"
          >
            Create Your Free Account →
          </Button>
        </div>
      </section>
    </div>
  )
}

function GuestDashboard() {
  const [showRateModal, setShowRateModal] = useState(false)

  // Calculate real stats from mock data
  const stats = calculateStats()

  const quickStats = [
    { label: "Items rated this week", value: stats.itemsRatedThisWeek.toString() },
    { label: "Favorites saved", value: stats.favoritesSaved.toString() },
    { label: "Lists created", value: stats.listsCreated.toString() },
    { label: "Badges earned", value: stats.badgesEarned.toString() },
  ]

  const categoryShortcuts = ["Restaurants", "Colleges", "Movies", "Cafes", "Books"]

  const suggestedActions = [
    { title: "The Daily Grind", subtitle: "Rate this cafe nearby", icon: Coffee },
    { title: "The Midnight Hour", subtitle: "Review your recent watch", icon: Film },
    { title: "Hidden Gems of the City", subtitle: "Create your top 5 local gems list", icon: Heart },
  ]

  // Update trending reviews to use mock data
  const trendingReviews = mockUserData.ratings.slice(0, 3).map((rating) => ({
    title: rating.itemName,
    rating: rating.rating,
    category: rating.caption,
    image: "/placeholder.svg?height=150&width=150",
  }))

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <div className="w-6 h-6 flex flex-col space-y-1">
                <div className="w-full h-0.5 bg-gray-600"></div>
                <div className="w-full h-0.5 bg-gray-600"></div>
                <div className="w-full h-0.5 bg-gray-600"></div>
              </div>
            </Button>
            <h1 className="text-xl font-bold text-[#2E2E2E]">RateIt</h1>
          </div>
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Welcome Message */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#2E2E2E]">Hey Aditya! Ready to rate something new?</h2>
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-sm text-gray-600">{stats.itemsRatedThisWeek}-day rating streak</span>
              <span className="text-orange-500">🔥</span>
            </div>
          </div>
          <Button
            onClick={() => setShowRateModal(true)}
            className="bg-[#4B0082] hover:bg-[#3A0066] text-white rounded-full px-6"
          >
            RateIT
          </Button>
        </div>

        {/* Quick Stats */}
        <div>
          <h3 className="text-lg font-semibold text-[#2E2E2E] mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            {quickStats.map((stat, index) => (
              <Card key={index} className="bg-white border border-gray-200">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-[#2E2E2E]">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Category Shortcuts */}
        <div>
          <h3 className="text-lg font-semibold text-[#2E2E2E] mb-4">Category Shortcuts</h3>
          <div className="flex flex-wrap gap-2">
            {categoryShortcuts.map((category, index) => (
              <Link key={index} href={`/category/${category.toLowerCase()}`}>
                <Badge variant="secondary" className="px-3 py-1 cursor-pointer hover:bg-gray-300">
                  {category}
                </Badge>
              </Link>
            ))}
          </div>
        </div>

        {/* Suggested Actions */}
        <div>
          <h3 className="text-lg font-semibold text-[#2E2E2E] mb-4">Suggested Actions</h3>
          <div className="space-y-3">
            {suggestedActions.map((action, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                <action.icon className="h-5 w-5 text-[#4B0082]" />
                <div>
                  <p className="font-medium text-[#2E2E2E]">{action.title}</p>
                  <p className="text-sm text-gray-600">{action.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trending Reviews */}
        <div>
          <h3 className="text-lg font-semibold text-[#2E2E2E] mb-4">Trending Reviews</h3>
          <div className="grid gap-4">
            {trendingReviews.map((review, index) => (
              <Link key={index} href={`/item/${index + 1}`}>
                <Card className="bg-white border border-gray-200 cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg"></div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-[#2E2E2E]">{review.title}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">{review.rating}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{review.category}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around items-center">
          <Button variant="ghost" size="sm" className="flex flex-col items-center space-y-1">
            <div className="w-6 h-6 bg-[#4B0082] rounded"></div>
            <span className="text-xs text-[#4B0082]">Dashboard</span>
          </Button>
          <Link href="/discover">
            <Button variant="ghost" size="sm" className="flex flex-col items-center space-y-1">
              <Search className="h-6 w-6 text-gray-400" />
              <span className="text-xs text-gray-400">Discover</span>
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center space-y-1"
            onClick={() => setShowRateModal(true)}
          >
            <div className="w-6 h-6 bg-[#FF6B6B] rounded flex items-center justify-center">
              <span className="text-white text-lg">+</span>
            </div>
            <span className="text-xs text-gray-400">Rate</span>
          </Button>
          <Link href="/lists">
            <Button variant="ghost" size="sm" className="flex flex-col items-center space-y-1">
              <Heart className="h-6 w-6 text-gray-400" />
              <span className="text-xs text-gray-400">Lists</span>
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="ghost" size="sm" className="flex flex-col items-center space-y-1">
              <User className="h-6 w-6 text-gray-400" />
              <span className="text-xs text-gray-400">Profile</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Rate Modal */}
      {showRateModal && <RateModal onClose={() => setShowRateModal(false)} />}
    </div>
  )
}

function RateModal({ onClose }: { onClose: () => void }) {
  const [rating, setRating] = useState(0)
  const [caption, setCaption] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [visibility, setVisibility] = useState("public")

  const tags = ["Clean place", "Budget-friendly", "Cozy", "Loud", "Staff", "Music", "Parking"]

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#2E2E2E]">Rate Your Moment</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <span className="text-xl">×</span>
            </Button>
          </div>

          {/* Capture Experience */}
          <div className="mb-6">
            <h3 className="font-semibold text-[#2E2E2E] mb-3">Capture Experience</h3>
            <div className="flex space-x-2 mb-4">
              <Button className="bg-blue-500 hover:bg-blue-600 text-white flex-1">📷 Upload Photo</Button>
              <Button variant="outline" className="flex-1 bg-transparent">
                📱 Snap Live
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="aspect-square bg-green-100 rounded-lg"></div>
              <div className="aspect-square bg-orange-100 rounded-lg"></div>
              <div className="aspect-square bg-blue-100 rounded-lg"></div>
            </div>
          </div>

          {/* Caption */}
          <div className="mb-6">
            <h3 className="font-semibold text-[#2E2E2E] mb-3">Write Your Caption / Feedback</h3>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Share your experience..."
              className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none"
            />
          </div>

          {/* Tags */}
          <div className="mb-6">
            <h3 className="font-semibold text-[#2E2E2E] mb-3">Add Contextual Tags (Optional Chips)</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
            <Button variant="outline" size="sm">
              Add Tag
            </Button>
          </div>

          {/* Rating */}
          <div className="mb-6">
            <h3 className="font-semibold text-[#2E2E2E] mb-3">Rating Bar (Optional)</h3>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm text-gray-600">Would you rate this out of 5?</span>
              <span className="font-bold text-[#2E2E2E]">{rating}</span>
            </div>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-8 w-8 cursor-pointer ${star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div className="mb-6">
            <h3 className="font-semibold text-[#2E2E2E] mb-3">Audience & Visibility</h3>
            <div className="flex space-x-2 mb-4">
              <Badge
                variant={visibility === "public" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setVisibility("public")}
              >
                🌍 Public
              </Badge>
              <Badge
                variant={visibility === "followers" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setVisibility("followers")}
              >
                👥 Followers
              </Badge>
              <Badge
                variant={visibility === "private" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setVisibility("private")}
              >
                🔒 Private Log
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="comments" className="rounded" />
              <label htmlFor="comments" className="text-sm text-gray-600">
                Allow comments
              </label>
            </div>
          </div>

          {/* Submit */}
          <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white" onClick={onClose}>
            🚀 Share Your Experience
          </Button>
        </div>
      </div>
    </div>
  )
}
