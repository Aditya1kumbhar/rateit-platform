"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Star, MapPin, Heart, Share, ThumbsUp } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

// Mock detailed item data
const itemDetails = {
  1: {
    name: "The Daily Grind",
    category: "Coffee Shop",
    rating: 4.5,
    reviewCount: 234,
    location: "123 Main St, Downtown SF",
    price: "$$",
    phone: "(415) 555-0123",
    hours: "Mon-Fri: 7AM-8PM, Sat-Sun: 8AM-9PM",
    website: "www.dailygrind.com",
    image: "/placeholder.svg?height=300&width=400",
    tags: ["WiFi", "Cozy", "Good Coffee", "Outdoor Seating"],
    description:
      "The Daily Grind is a beloved neighborhood coffee shop that has been serving the community for over 10 years. Known for our expertly crafted espresso drinks and cozy atmosphere, we're the perfect spot for both work and relaxation.",
    features: ["Free WiFi", "Outdoor Seating", "Laptop Friendly", "Pet Friendly", "Takeout Available"],
    reviews: [
      {
        id: 1,
        author: "Sarah M.",
        rating: 5,
        date: "2 days ago",
        text: "Amazing coffee and such a cozy atmosphere! Perfect place to work or catch up with friends. The baristas are super friendly and know their stuff.",
        likes: 12,
        images: ["/placeholder.svg?height=150&width=150"],
      },
      {
        id: 2,
        author: "Mike R.",
        rating: 4,
        date: "1 week ago",
        text: "Great coffee, but can get pretty crowded during peak hours. The outdoor seating is a nice touch though!",
        likes: 8,
        images: [],
      },
      {
        id: 3,
        author: "Emma L.",
        rating: 5,
        date: "2 weeks ago",
        text: "My go-to coffee shop! The staff remembers my order and the WiFi is reliable. Highly recommend the lavender latte.",
        likes: 15,
        images: ["/placeholder.svg?height=150&width=150", "/placeholder.svg?height=150&width=150"],
      },
    ],
    photos: [
      "/placeholder.svg?height=200&width=300",
      "/placeholder.svg?height=200&width=300",
      "/placeholder.svg?height=200&width=300",
      "/placeholder.svg?height=200&width=300",
    ],
  },
}

export default function ItemDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [activeTab, setActiveTab] = useState("overview")
  const [showRateModal, setShowRateModal] = useState(false)

  const item = itemDetails[id as keyof typeof itemDetails]

  if (!item) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#2E2E2E] mb-2">Item not found</h2>
          <Link href="/">
            <Button>Go back home</Button>
          </Link>
        </div>
      </div>
    )
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
            <h1 className="text-xl font-bold text-[#2E2E2E]">{item.name}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon">
              <Share className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Heart className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Hero Section */}
        <div className="mb-6">
          <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4"></div>

          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-[#2E2E2E] mb-2">{item.name}</h1>
              <div className="flex items-center space-x-2 mb-2">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="ml-1 font-semibold text-lg">{item.rating}</span>
                </div>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">{item.reviewCount} reviews</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">{item.price}</span>
              </div>
              <div className="flex items-center space-x-1 mb-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{item.location}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <Button onClick={() => setShowRateModal(true)} className="bg-[#4B0082] hover:bg-[#3A0066] text-white">
              <Star className="h-4 w-4 mr-2" />
              Rate It
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="space-y-6">
              <Card className="bg-white border border-gray-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-[#2E2E2E] mb-3">About</h3>
                  <p className="text-gray-600">{item.description}</p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-[#2E2E2E] mb-3">Features</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {item.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-[#4B0082] rounded-full"></div>
                        <span className="text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <div className="space-y-4">
              {item.reviews.map((review) => (
                <Card key={review.id} className="bg-white border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-[#2E2E2E]">{review.author}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                          <span className="text-gray-500 text-sm">{review.date}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-3">{review.text}</p>
                    {review.images.length > 0 && (
                      <div className="flex space-x-2 mb-3">
                        {review.images.map((image, index) => (
                          <div
                            key={index}
                            className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg"
                          ></div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center space-x-4">
                      <Button variant="ghost" size="sm" className="text-gray-500 hover:text-[#4B0082]">
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        {review.likes}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="photos" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {item.photos.map((photo, index) => (
                <div key={index} className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg"></div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="info" className="mt-6">
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-[#2E2E2E] mb-1">Hours</h4>
                    <p className="text-gray-600">{item.hours}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#2E2E2E] mb-1">Phone</h4>
                    <p className="text-gray-600">{item.phone}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#2E2E2E] mb-1">Website</h4>
                    <p className="text-gray-600">{item.website}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#2E2E2E] mb-1">Address</h4>
                    <p className="text-gray-600">{item.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
