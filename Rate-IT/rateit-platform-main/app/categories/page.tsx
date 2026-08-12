"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Home, Search, User } from "lucide-react"
import Link from "next/link"

export default function CategoriesPage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const categories = [
    { name: "Movies", color: "bg-blue-500" },
    { name: "Books", color: "bg-amber-500" },
    { name: "Music", color: "bg-purple-500" },
    { name: "Restaurants", color: "bg-orange-500" },
    { name: "Travel Destinations", color: "bg-green-500" },
    { name: "Tech Gadgets", color: "bg-gray-500" },
    { name: "Fashion Brands", color: "bg-pink-500" },
    { name: "Sports Teams", color: "bg-red-500" },
    { name: "Video Games", color: "bg-indigo-500" },
    { name: "Art & Design", color: "bg-yellow-500" },
    { name: "Automobiles", color: "bg-slate-500" },
    { name: "Health & Wellness", color: "bg-emerald-500" },
  ]

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-white">RateIt</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
              <Home className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Select Your Favorite Categories</h2>
            <p className="text-gray-300">
              Choose the categories that interest you the most. Your selections will help us personalize your rating
              experience.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {categories.map((category, index) => (
              <Card
                key={index}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedCategories.includes(category.name)
                    ? "ring-2 ring-white bg-gray-700"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
                onClick={() => toggleCategory(category.name)}
              >
                <CardContent className="p-6 text-center">
                  <div
                    className={`w-16 h-16 ${category.color} rounded-lg mx-auto mb-3 flex items-center justify-center`}
                  >
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h3 className="font-semibold text-white text-sm">{category.name}</h3>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Link href="/">
              <Button
                size="lg"
                className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-3 text-lg font-semibold rounded-full"
              >
                Continue
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
