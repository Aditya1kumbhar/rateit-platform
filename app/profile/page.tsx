"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Settings, Star, Lock, Globe } from "lucide-react"
import Link from "next/link"

// Add the same mockUserData and calculateStats function at the top
const mockUserData = {
  ratings: [
    { itemId: 1, rating: 5 },
    { itemId: 2, rating: 4 },
    { itemId: 3, rating: 5 },
    { itemId: 4, rating: 3 },
    { itemId: 5, rating: 5 },
    { itemId: 6, rating: 4 },
    { itemId: 7, rating: 5 },
  ],
  lists: [
    { name: "My Favorite Restaurants", itemCount: 12, isPrivate: true },
    { name: "Best Coffee Shops", itemCount: 8, isPrivate: false },
    { name: "Hidden Gems", itemCount: 5, isPrivate: true },
  ],
}

const calculateStats = () => {
  // Simple logic to determine items rated this week (can be expanded)
  const itemsRatedThisWeek = mockUserData.ratings.length
  return { itemsRatedThisWeek }
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("reviews")

  // Update the userStats object:
  const stats = calculateStats()
  const userStats = {
    name: "Ethan Carter",
    location: "San Francisco, CA",
    rating: 4.8,
    totalRatings: mockUserData.ratings.length,
    itemsRatedThisWeek: stats.itemsRatedThisWeek,
  }

  // Update savedLists to use mock data:
  const savedLists = mockUserData.lists.slice(0, 2).map((list) => ({
    title: list.name,
    itemCount: list.itemCount,
    isPrivate: list.isPrivate,
    image: "/placeholder.svg?height=100&width=100",
  }))

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-[#2E2E2E]">Profile</h1>
          </div>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-orange-200 to-orange-300 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl">👨‍💼</span>
          </div>
          <h2 className="text-2xl font-bold text-[#2E2E2E] mb-1">{userStats.name}</h2>
          <p className="text-gray-600 mb-2">{userStats.location}</p>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="ml-1 font-semibold">{userStats.rating}</span>
            </div>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600">{userStats.totalRatings} ratings</span>
          </div>
          <Button variant="outline" className="mb-6 bg-transparent">
            Edit Profile
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="reviews">My Reviews</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Weekly Progress */}
        <div className="mb-6">
          <h3 className="font-semibold text-[#2E2E2E] mb-3">Rated {userStats.itemsRatedThisWeek} items this week</h3>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-[#4B0082] h-2 rounded-full" style={{ width: "60%" }}></div>
          </div>
        </div>

        {/* Saved Lists */}
        <div>
          <h3 className="text-xl font-bold text-[#2E2E2E] mb-4">Saved Lists</h3>
          <div className="space-y-4">
            {savedLists.map((list, index) => (
              <Card key={index} className="bg-white border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {list.isPrivate ? (
                          <Lock className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Globe className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="text-sm text-gray-500">{list.isPrivate ? "Private" : "Public"}</span>
                      </div>
                      <h4 className="font-semibold text-[#2E2E2E]">{list.title}</h4>
                      <p className="text-sm text-gray-600">{list.itemCount} items</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
