"use client"
// CodeRabbit Uncommitted Change Review Test

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Search,
  User,
  Star,
  GraduationCap,
  Play,
  Plus,
  Home,
  Heart,
  Utensils,
  LogOut,
  BookOpen,
  Shield,
  MapPin,
  CheckCircle,
  Coffee,
  Wrench,
} from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useLenis } from "@/lib/lenis"
import { userSession } from "@/lib/userAuth"
import { EnhancedRateModal } from "@/components/enhanced-rate-modal"
import { BottomNav } from "@/components/bottom-nav"

// Pune-specific mock data for V1
const mockUserData = {
  ratings: [
    {
      id: 1,
      itemId: "1", // IIT JEE Academy
      itemName: "IIT JEE Academy",
      category: "Coaching",
      rating: 4.5,
      date: new Date("2026-08-05"),
      caption: "Great faculty, small batch sizes. Worth the fee.",
      checkinVerified: true,
    },
    {
      id: 2,
      itemId: "5", // Sunrise PG for Boys
      itemName: "Sunrise PG for Boys",
      category: "PG / Hostel",
      rating: 3.8,
      date: new Date("2026-08-04"),
      caption: "Clean rooms, but water supply is inconsistent.",
      checkinVerified: true,
    },
    {
      id: 3,
      itemId: "8", // Café Good Luck
      itemName: "Café Good Luck",
      category: "Café",
      rating: 4.2,
      date: new Date("2026-08-03"),
      caption: "Classic FC Road vibes. Bun maska is legendary.",
      checkinVerified: false,
    },
    {
      id: 4,
      itemId: "2", // Mahesh Tutorials
      itemName: "Mahesh Tutorials",
      category: "Coaching",
      rating: 4.0,
      date: new Date("2026-08-02"),
      caption: "Good study material but crowded batches.",
      checkinVerified: true,
    },
    {
      id: 5,
      itemId: "6", // Green Villa Hostel
      itemName: "Green Villa Hostel",
      category: "PG / Hostel",
      rating: 4.5,
      date: new Date("2026-08-01"),
      caption: "Best PG near Hinjewadi. Food is great, WiFi is fast.",
      checkinVerified: true,
    },
  ],
  favorites: Array.from({ length: 12 }, (_, i) => ({ id: i + 1 })),
  lists: Array.from({ length: 4 }, (_, i) => ({ id: i + 1 })),
  badges: Array.from({ length: 5 }, (_, i) => ({ id: i + 1 })),
}

const calculateStats = () => {
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const itemsRatedThisWeek = mockUserData.ratings.filter((r) => r.date >= oneWeekAgo).length
  return {
    itemsRatedThisWeek,
    favoritesSaved: mockUserData.favorites.length,
    listsCreated: mockUserData.lists.length,
    badgesEarned: mockUserData.badges.length,
  }
}

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [isGuest, setIsGuest] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  useLenis()

  useEffect(() => {
    const checkAuth = async () => {
      const activeUser = await userSession.getUser()
      if (activeUser) {
        setUser(activeUser)
      } else {
        const guestMode = searchParams.get("guest") === "true" || typeof window !== "undefined" && localStorage.getItem("rateit_guest_mode") === "true"
        if (guestMode) {
          setIsGuest(true)
        }
      }
      setIsLoading(false)
    }
    checkAuth()
  }, [searchParams])

  const handleGetStarted = () => router.push("/login")

  const handleContinueAsGuest = () => {
    setIsGuest(true)
    if (typeof window !== "undefined") {
      localStorage.setItem("rateit_guest_mode", "true")
    }
    router.replace("/?guest=true")
  }

  const handleLogout = async () => {
    await userSession.clearUser()
    if (typeof window !== "undefined") {
      localStorage.removeItem("rateit_guest_mode")
    }
    setUser(null)
    setIsGuest(false)
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (user || isGuest) {
    return <CalmDashboard user={user} isGuest={isGuest} onLogout={handleLogout} />
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-black">RateIT</h1>
            <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full font-medium">
              Pune
            </span>
          </div>
          <Button variant="ghost" size="icon" className="text-gray-600 hover:text-black">
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-6 leading-tight">
            Trusted Reviews for Pune&apos;s Coaching Classes, PGs & More.
          </h2>
          <p className="text-lg text-gray-600 mb-4 max-w-2xl">
            Verified check-in reviews. No fake ratings. No paid placements.
            See what real students and residents actually think.
          </p>

          {/* Trust signals */}
          <div className="flex flex-wrap gap-4 mb-10 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-green-600" />
              <span>Location-verified reviews</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-blue-600" />
              <span>Fraud detection built-in</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-yellow-600" />
              <span>Phone-verified reviewers</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-800 px-8 py-3 text-lg font-medium rounded-full transition-colors"
            >
              <Play className="h-5 w-5 mr-2" />
              Get Started
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleContinueAsGuest}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-8 py-3 text-lg rounded-full border-gray-200 transition-colors"
            >
              Browse as Guest
            </Button>
          </div>
        </div>
      </section>

      {/* Categories — India/Pune specific */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-black mb-2">Browse Categories</h3>
        <p className="text-gray-500 mb-8">Categories Google Reviews doesn&apos;t serve well</p>
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { name: "Coaching Classes", icon: GraduationCap, count: "48 listed" },
            { name: "PGs & Hostels", icon: Home, count: "32 listed" },
            { name: "Local Services", icon: Wrench, count: "Coming soon" },
            { name: "Restaurants", icon: Utensils, count: "24 listed" },
            { name: "Cafes", icon: Coffee, count: "18 listed" },
          ].map((category, index) => (
            <Link key={index} href={`/category/${category.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
              <Card
                className="bg-gray-50 cursor-pointer group border-0 hover:shadow-md transition-all hover:-translate-y-0.5 h-full"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-gray-200 mb-4 flex items-center justify-center group-hover:bg-yellow-100 transition-colors">
                    <category.icon className="h-6 w-6 text-gray-600 group-hover:text-yellow-700 transition-colors" />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">{category.name}</h4>
                  <p className="text-xs text-gray-400">{category.count}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust explanation */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-black mb-8">Why RateIT is Different</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: MapPin,
              title: "Check-In Verified",
              description:
                "Reviews are GPS-verified. If you're at the location when you rate, your review gets a ✅ badge and carries more weight.",
            },
            {
              icon: Shield,
              title: "Blind Rating System",
              description:
                "You submit your rating before seeing others. This prevents anchoring bias and keeps aggregate scores honest.",
            },
            {
              icon: Star,
              title: "Trust Score",
              description:
                "Every reviewer has a trust score based on verification, consistency, and community feedback. No anonymous bots.",
            },
          ].map((feature, i) => (
            <div key={i} className="space-y-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <feature.icon className="h-5 w-5 text-yellow-700" />
              </div>
              <h4 className="font-semibold text-black">{feature.title}</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function CalmDashboard({
  user,
  isGuest,
  onLogout,
}: {
  user: any
  isGuest: boolean
  onLogout: () => void
}) {
  const [showRateModal, setShowRateModal] = useState(false)
  const [activeTab, setActiveTab] = useState("home")
  const router = useRouter()
  const stats = calculateStats()

  const handleOpenRateModal = () => {
    if (!user || isGuest) {
      router.push("/login?reason=rate&redirect=/")
      return
    }
    setShowRateModal(true)
  }

  const quickStats = [
    { label: "This week", value: stats.itemsRatedThisWeek.toString() },
    { label: "Favorites", value: stats.favoritesSaved.toString() },
    { label: "Lists", value: stats.listsCreated.toString() },
    { label: "Badges", value: stats.badgesEarned.toString() },
  ]

  const categories = [
    { name: "Coaching", icon: GraduationCap },
    { name: "PGs & Hostels", icon: Home },
    { name: "Cafés", icon: Coffee },
    { name: "Restaurants", icon: Utensils },
    { name: "Services", icon: Wrench },
  ]

  const suggestedActions = [
    {
      title: "IIT JEE Academy",
      subtitle: "Rate your coaching class",
      icon: GraduationCap,
    },
    {
      title: "Your PG/Hostel",
      subtitle: "Review where you stay",
      icon: Home,
    },
    {
      title: "Top 5 Cafés in Pune",
      subtitle: "Create a list",
      icon: Heart,
    },
  ]

  const trendingReviews = mockUserData.ratings.slice(0, 4).map((r) => ({
    id: r.id,
    itemId: r.itemId,
    title: r.itemName,
    rating: r.rating,
    category: r.category,
    caption: r.caption,
    checkinVerified: r.checkinVerified,
  }))

  const displayName = user ? user.name : "Guest"

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-black">RateIT</h1>
              <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full font-medium">
                Pune
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="text-gray-600 hover:text-black">
                <Search className="h-5 w-5" />
              </Button>
              {user && (
                <Button variant="ghost" size="icon" onClick={onLogout} className="text-gray-600 hover:text-black">
                  <LogOut className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Welcome */}
        <div className="space-y-4">
          <div>
            <h2 className="text-3xl font-bold text-black mb-2">
              Good evening, {displayName}
              {isGuest && <span className="text-lg text-gray-500 ml-2">(Guest Mode)</span>}
            </h2>
            <p className="text-gray-600">What are you looking to review today?</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div>
          <h3 className="text-xl font-semibold text-black mb-4">Your Activity</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickStats.map((stat, index) => (
              <Card key={index} className="bg-gray-50 border-0 hover:shadow-md transition-all">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Category Shortcuts */}
        <div>
          <h3 className="text-xl font-semibold text-black mb-4">Categories</h3>
          <div className="flex flex-wrap gap-3">
            {categories.map((cat, index) => (
              <Link key={index} href={`/category/${cat.name.toLowerCase().replace(/\s+/g, '-')}`}>
                <Button
                  variant="outline"
                  className="bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200 rounded-full px-4 py-2 flex items-center space-x-2 transition-colors"
                >
                  <cat.icon className="h-4 w-4" />
                  <span>{cat.name}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>

        {/* Suggested Actions */}
        <div>
          <h3 className="text-xl font-semibold text-black mb-4">Suggested Actions</h3>
          <div className="space-y-3">
            {suggestedActions.map((action, index) => (
              <Card key={index} className="bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors border-0">
                <CardContent className="p-4 flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                    <action.icon className="h-6 w-6 text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{action.title}</h4>
                    <p className="text-sm text-gray-600">{action.subtitle}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Trending Reviews */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-black">Recent Reviews in Pune</h3>
            <Link href="/discover">
              <Button variant="ghost" className="text-gray-600 hover:text-black text-sm">
                Show all
              </Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {trendingReviews.map((review) => (
              <Link key={review.id} href={`/item/${review.itemId || review.id}`}>
                <Card className="bg-gray-50 cursor-pointer group border-0 hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-gray-800 group-hover:text-gray-600 transition-colors">
                        {review.title}
                      </h4>
                      {review.checkinVerified && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full border border-green-200 flex-shrink-0">
                          <CheckCircle className="h-3 w-3" />
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < review.rating ? "text-yellow-500 fill-current" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-700">{review.rating}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{review.category}</p>
                    <p className="text-sm text-gray-500 line-clamp-2">{review.caption}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <BottomNav onRateClick={handleOpenRateModal} />

      {showRateModal && <EnhancedRateModal onClose={() => setShowRateModal(false)} />}
    </div>
  )
}
