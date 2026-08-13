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

import { Suspense } from "react"

function HomePageContent() {
  const [user, setUser] = useState<any>(null)
  const [isGuest, setIsGuest] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [heroSearchQuery, setHeroSearchQuery] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useLenis()

  useEffect(() => {
    let isMounted = true
    const checkAuth = async () => {
      try {
        const activeUser = await userSession.getUser()
        if (isMounted) {
          if (activeUser) {
            setUser(activeUser)
          } else {
            const guestParam = searchParams?.get("guest") === "true"
            const guestStorage = typeof window !== "undefined" && localStorage.getItem("rateit_guest_mode") === "true"
            if (guestParam || guestStorage) {
              setIsGuest(true)
            }
          }
        }
      } catch (e) {
        console.error("Auth check error:", e)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    checkAuth()
    return () => { isMounted = false }
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

  const handleHeroSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (heroSearchQuery.trim()) {
      router.push(`/discover?search=${encodeURIComponent(heroSearchQuery.trim())}`)
    } else {
      router.push("/discover")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm font-medium">Loading RateIT Pune...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-400 selection:text-slate-950 font-sans relative overflow-x-hidden">
      {/* Background Ambient Mesh Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-amber-500/15 via-indigo-600/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Glassmorphic Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 transition-all">
        <div className="container mx-auto px-4 py-3.5 flex items-center justify-between">
          {/* Logo & City Badge */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              R
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                RateIT
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 bg-amber-400/10 text-amber-300 border border-amber-400/30 rounded-full font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Pune Live
                </span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-300">
            <Link href="/discover" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
              <Search className="w-4 h-4 text-amber-400" />
              Discover Places
            </Link>
            <Link href="/category/coaching-classes" className="hover:text-amber-400 transition-colors">
              Coaching
            </Link>
            <Link href="/category/pgs-hostels" className="hover:text-amber-400 transition-colors">
              PGs & Hostels
            </Link>
            <Link href="/moderation-policy" className="hover:text-amber-400 transition-colors">
              Trust Engine
            </Link>
          </nav>

          {/* Auth Action Buttons */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link href="/profile" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium hidden sm:inline-block">
                    {user.displayName || user.phone || "User"}
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-full h-8 w-8 p-0 flex items-center justify-center"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                {!isGuest && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleContinueAsGuest}
                    className="text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-full text-xs font-medium px-4"
                  >
                    Browse Guest
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-semibold px-5 rounded-full shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all text-xs"
                >
                  Sign In
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          
          {/* Trust Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300 shadow-xl">
            <Shield className="h-3.5 w-3.5 text-amber-400" />
            <span>EXIF GPS Verified Reviews for FC Road, Kothrud & Hinjewadi</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
            Hyperlocal Verified Reviews for{" "}
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Pune&apos;s Student Hubs
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Zero paid reviews. Zero bot ratings. Every rating is verified using real-time GPS check-ins & EXIF photo metadata.
          </p>

          {/* Interactive In-Hero Search Bar */}
          <form onSubmit={handleHeroSearch} className="max-w-2xl mx-auto relative group">
            <div className="relative flex items-center rounded-2xl bg-slate-900/90 border border-slate-800 p-2 shadow-2xl shadow-amber-500/5 focus-within:border-amber-400/60 focus-within:ring-2 focus-within:ring-amber-400/20 transition-all">
              <MapPin className="w-5 h-5 text-amber-400 ml-3 shrink-0" />
              <input
                type="text"
                value={heroSearchQuery}
                onChange={(e) => setHeroSearchQuery(e.target.value)}
                placeholder="Search IIT Coaching, FC Road Cafes, Hinjewadi PGs..."
                className="w-full bg-transparent px-3 py-2 text-sm md:text-base text-white placeholder-slate-500 focus:outline-none"
              />
              <Button
                type="submit"
                className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-semibold rounded-xl px-6 py-2.5 shrink-0 transition-all shadow-md"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>

            {/* Quick Area Filter Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs text-slate-400">
              <span className="text-slate-500 font-medium">Popular:</span>
              {[
                { label: "📍 Kothrud Coaching", query: "Kothrud" },
                { label: "☕ FC Road Cafes", query: "FC Road" },
                { label: "🏠 Hinjewadi PGs", query: "Hinjewadi" },
                { label: "🎓 Viman Nagar", query: "Viman Nagar" },
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => router.push(`/discover?search=${encodeURIComponent(chip.query)}`)}
                  className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-amber-400/40 hover:text-amber-300 transition-colors"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </form>

          {/* Live Trust Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 max-w-3xl mx-auto">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="text-2xl md:text-3xl font-extrabold text-amber-400">1,250+</div>
              <div className="text-xs text-slate-400 font-medium mt-1">Verified Student Reviews</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="text-2xl md:text-3xl font-extrabold text-amber-400">48+</div>
              <div className="text-xs text-slate-400 font-medium mt-1">Pune Institutes & Hubs</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="text-2xl md:text-3xl font-extrabold text-emerald-400">100%</div>
              <div className="text-xs text-slate-400 font-medium mt-1">Anti-Fraud Protection</div>
            </div>
          </div>

        </div>
      </section>

      {/* Categories Section */}
      <section className="container mx-auto px-4 py-16 border-t border-slate-900">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Explore Categories</h2>
            <p className="text-slate-400 text-sm mt-1">Tailored for Pune students, job seekers, and locals</p>
          </div>
          <Link href="/discover" className="text-amber-400 hover:text-amber-300 text-sm font-semibold flex items-center gap-1">
            Browse all places &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { name: "Coaching Classes", slug: "coaching-classes", icon: GraduationCap, count: "48 Hubs", tag: "IIT / MPSC" },
            { name: "PGs & Hostels", slug: "pgs-hostels", icon: Home, count: "32 Verified", tag: "Student Stay" },
            { name: "Cafes", slug: "cafes", icon: Coffee, count: "24 Listed", tag: "FC Road & Viman" },
            { name: "Restaurants", slug: "restaurants", icon: Utensils, count: "18 Listed", tag: "Mess & Dining" },
            { name: "Local Services", slug: "local-services", icon: Wrench, count: "Verified Only", tag: "Laundries & Tech" },
          ].map((cat, index) => (
            <Link key={index} href={`/category/${cat.slug}`}>
              <Card className="bg-slate-900/80 border-slate-800 hover:border-amber-400/50 hover:bg-slate-800/80 transition-all hover:-translate-y-1 group h-full">
                <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <cat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">{cat.tag}</span>
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors mt-0.5">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{cat.count}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust & Anti-Fraud Comparison Section */}
      <section className="container mx-auto px-4 py-16 border-t border-slate-900">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-white">Why RateIT is Different</h2>
          <p className="text-slate-400 text-sm">How we eradicate paid reviews and fake ratings in Pune</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: MapPin,
              title: "GPS Geofence Verification",
              description: "Reviews are validated against business coordinates. Ratings given at the actual venue earn a Verified Check-in Badge.",
              color: "text-emerald-400",
              bgColor: "bg-emerald-500/10",
              borderColor: "border-emerald-500/20",
            },
            {
              icon: Shield,
              title: "EXIF Photo Anti-Spam",
              description: "Uploaded photos undergo client-side EXIF header extraction to confirm capture time & location, stopping stock photo spam.",
              color: "text-amber-400",
              bgColor: "bg-amber-500/10",
              borderColor: "border-amber-500/20",
            },
            {
              icon: Star,
              title: "Blind Rating System",
              description: "Users submit ratings before seeing aggregate scores, eliminating peer anchoring bias and keeping reviews honest.",
              color: "text-indigo-400",
              bgColor: "bg-indigo-500/10",
              borderColor: "border-indigo-500/20",
            },
          ].map((feature, i) => (
            <div key={i} className={`p-6 rounded-2xl bg-slate-900/60 border ${feature.borderColor} space-y-4 hover:bg-slate-900/90 transition-colors`}>
              <div className={`w-11 h-11 ${feature.bgColor} rounded-xl flex items-center justify-center`}>
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="text-base font-bold text-white">{feature.title}</h3>
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-8 text-slate-400 text-xs">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">RateIT Pune</span>
            <span>&bull; IT Act Section 79 Safe Harbour Compliant</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/terms" className="hover:text-amber-400 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-amber-400 transition-colors">Privacy Policy</Link>
            <Link href="/grievance" className="hover:text-amber-400 transition-colors">Grievance Officer</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}


export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 text-sm font-medium">Loading RateIT Pune...</p>
          </div>
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  )
}
