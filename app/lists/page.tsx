"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Plus, Heart } from "lucide-react"
import Link from "next/link"
import { mockUserData } from "@/lib/mock"

export default function ListsPage() {
  const [showNewListModal, setShowNewListModal] = useState(false)

  const lists = mockUserData.lists.map((list) => ({
    title: list.name,
    ratingsCount: list.itemCount,
    image: "/placeholder.svg?height=200&width=300",
  }))

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-[#2E2E2E]">Your Custom Lists</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Create New List Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[#2E2E2E] mb-4">Create a new list</h2>
          <Card className="bg-white border border-gray-200 cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Plus className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Create your first custom list</p>
            </CardContent>
          </Card>
        </div>

        {/* Existing Lists */}
        {lists.length > 0 ? (
          <div className="space-y-4">
            {lists.map((list, index) => (
              <Card key={index} className="bg-white border border-gray-200">
                <CardContent className="p-0">
                  <div className="aspect-video bg-gradient-to-br from-amber-100 to-amber-200 rounded-t-lg"></div>
                  <div className="p-4">
                    <h3 className="font-semibold text-[#2E2E2E] mb-1">{list.title}</h3>
                    <p className="text-sm text-gray-600">{list.ratingsCount} ratings added</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Heart className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-[#2E2E2E] mb-2">No lists yet</h3>
            <p className="text-gray-600 mb-4">Start creating your first list to save your favorite places!</p>
            <Button onClick={() => setShowNewListModal(true)} className="bg-[#4B0082] hover:bg-[#3A0066] text-white">
              Let's Add Your First List
            </Button>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <Button
        className="fixed bottom-6 right-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-14 h-14 shadow-lg"
        onClick={() => setShowNewListModal(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  )
}
