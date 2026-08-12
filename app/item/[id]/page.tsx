"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Star, MapPin, Heart, Share, ThumbsUp } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { EnhancedRateModal } from "@/components/enhanced-rate-modal"
import { PUNE_SEED_PLACES, PUNE_SEED_REVIEWS } from "@/lib/mock"

export default function ItemDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [activeTab, setActiveTab] = useState("overview")
  const [showRateModal, setShowRateModal] = useState(false)

  // Find the place from the seed data
  const placeIndex = PUNE_SEED_PLACES.findIndex((p) => p.id === id)
  const place = placeIndex !== -1 ? PUNE_SEED_PLACES[placeIndex] : null

  if (!place) {
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

  // Get matching reviews
  const placeReviews = PUNE_SEED_REVIEWS.filter(r => r.placeIndex === placeIndex)

  // Map to the UI item shape
  const item = {
    name: place.name,
    category: place.category,
    rating: place.avgRating || 0,
    reviewCount: place.reviewCount || 0,
    location: place.address,
    price: place.priceRange || "$$",
    phone: "Not available",
    hours: "9 AM - 9 PM",
    website: "Not available",
    description: place.description || "No description provided.",
    tags: place.tags || [],
    features: place.tags || [],
    photos: Array(4).fill(0),
    reviews: placeReviews.map((r, i) => ({
      id: i,
      author: r.displayName || "Anonymous User",
      rating: r.rating,
      date: "Recent",
      text: r.text,
      likes: Math.floor(Math.random() * 20),
      images: [],
    }))
  }

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

      <div className="container mx-auto px-4 py-6 pb-24">
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
          </div>
        </div>

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
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
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
              {item.reviews.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No reviews yet.</p>
                </div>
              ) : (
                item.reviews.map((review) => (
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
                      <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-yellow-600">
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          {review.likes}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="photos" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {item.photos.map((_, index) => (
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

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-40">
        <Button onClick={() => setShowRateModal(true)} className="w-full bg-black hover:bg-gray-800 text-white rounded-full py-6 text-lg">
          <Star className="h-5 w-5 mr-2" />
          Rate {item.name}
        </Button>
      </div>

      {showRateModal && <EnhancedRateModal onClose={() => setShowRateModal(false)} />}
    </div>
  )
}
