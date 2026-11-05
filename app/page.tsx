"use client"

import { useState, useEffect, Suspense } from "react"
import {
  Search,
  Star,
  GraduationCap,
  Home,
  Utensils,
  MapPin,
  CheckCircle2,
  Coffee,
  Wrench,
  ArrowRight,
  ShieldCheck,
} from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

// Pune Verified Highlights for V1
const verifiedHighlights = [
  {
    id: "1",
    name: "IIT JEE Academy Pune",
    category: "Coaching",
    hub: "Kothrud",
    rating: 4.8,
    reviews: 142,
    price: "₹₹₹",
    verifiedCheckin: true,
    tag: "Top JEE Hub",
    snippet: "Faculty is exceptional. Regular mock tests and doubt sessions.",
  },
  {
    id: "8",
    name: "Café Good Luck",
    category: "Café",
    hub: "FC Road",
    rating: 4.7,
    reviews: 320,
    price: "₹",
    verifiedCheckin: true,
    tag: "Historic Spot",
    snippet: "Classic bun maska, chai, and iconic Irani breakfast atmosphere.",
  },
  {
    id: "3",
    name: "FC Road Student Stay",
    category: "PG / Hostel",
    hub: "FC Road",
    rating: 4.6,
    reviews: 89,
    price: "₹₹",
    verifiedCheckin: true,
    tag: "Student Favorite",
    snippet: "Clean rooms, high-speed Wi-Fi, walking distance to colleges.",
  },
  {
    id: "4",
    name: "Hinjewadi Tech Living",
    category: "PG / Hostel",
    hub: "Hinjewadi",
    rating: 4.5,
    reviews: 112,
    price: "₹₹₹",
    verifiedCheckin: true,
    tag: "IT Park Proximity",
    snippet: "Spacious with gym, food included, very close to Phase 1.",
  },
]

interface LiveReview {
  id: string
  user: string
  place: string
  hub: string
  rating: number
  text: string
  createdAt: string
  trustScore: number
}

function HomePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [heroSearchQuery, setHeroSearchQuery] = useState("")
  const [liveReviews, setLiveReviews] = useState<LiveReview[]>([])
  const [stats, setStats] = useState({ totalReviews: 0, totalPlaces: 0 })
  const [highlights, setHighlights] = useState(verifiedHighlights)

  useEffect(() => {
    let isMounted = true

    // Fetch places from Prisma database
    fetch("/api/places?take=4")
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.data && json.data.length > 0) {
          const mapped = json.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            hub: p.hub,
            rating: p.bayesianRating ? Number(p.bayesianRating).toFixed(1) : Number(p.avgRating || 4.5).toFixed(1),
            reviews: p.reviewCount || 0,
            price: p.priceRange || "₹₹",
            verifiedCheckin: true,
            tag: p.tags && p.tags[0] ? p.tags[0] : "Verified Venue",
            snippet: p.description || "Authentic Pune location verified by community reviewers.",
          }))
          setHighlights(mapped)
        }
      })
      .catch(() => {})

    // Fetch live verified reviews and counts from API
    fetch("/api/reviews?take=3&verifiedOnly=true")
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.data) {
          setLiveReviews(json.data)
          if (json.meta) {
            setStats({
              totalReviews: json.meta.totalVerifiedReviews || 0,
              totalPlaces: json.meta.totalPlaces || 0,
            })
          }
        }
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [searchParams])

  const handleHeroSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (heroSearchQuery.trim()) {
      router.push(`/discover?search=${encodeURIComponent(heroSearchQuery.trim())}`)
    } else {
      router.push("/discover")
    }
  }

  return (
    <div className="relative overflow-x-hidden bg-canvas text-fg">
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 container mx-auto px-4 max-w-6xl">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Clean Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-semibold text-fg tracking-[-0.022em] leading-[1.05]">
            Physically Verified Pune Reviews.<br />
            <span className="text-fg-muted">
              Zero paid spam. Authentic local ratings.
            </span>
          </h1>

          {/* Search Bar */}
          <form onSubmit={handleHeroSearch} className="max-w-2xl mx-auto relative group pt-2">
            <div className="relative flex items-center rounded-full bg-surface-2 border border-hairline/[0.08] p-1.5 focus-within:border-accent-link focus-within:ring-2 focus-within:ring-accent-link/30 transition-[border-color,box-shadow] duration-150">
              <MapPin className="w-5 h-5 text-accent-link ml-3 shrink-0" />
              <input
                type="text"
                value={heroSearchQuery}
                onChange={(e) => setHeroSearchQuery(e.target.value)}
                placeholder="Search FC Road Cafes, Kothrud Coaching, Hinjewadi PGs..."
                className="w-full bg-transparent px-3 py-2 text-sm sm:text-base text-fg placeholder:text-fg-subtle focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-full liquid-glass-btn text-[14px] font-semibold gap-1.5"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
                <span>Search</span>
              </button>
            </div>

            {/* Hub Filter Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs">
              <span className="text-fg-subtle text-[11px] font-semibold uppercase tracking-[0.06em] mr-1">Hubs:</span>
              {[
                { label: "FC Road Cafes", query: "FC Road" },
                { label: "Kothrud Coaching", query: "Kothrud" },
                { label: "Hinjewadi PGs", query: "Hinjewadi" },
                { label: "Viman Nagar", query: "Viman Nagar" },
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => router.push(`/discover?search=${encodeURIComponent(chip.query)}`)}
                  className="h-9 px-4 rounded-full text-[12px] font-medium bg-surface-2 text-fg-muted hover:text-fg transition-colors apple-press"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </form>

          {/* Bento Specs Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 max-w-3xl mx-auto">
            <div className="p-6 rounded-[22px] bg-surface text-left border-0">
              <div className="text-3xl font-semibold text-fg tabular-nums tracking-tight">
                {stats.totalReviews > 0 ? `${stats.totalReviews}` : "200m"}
              </div>
              <div className="text-[11px] uppercase tracking-[0.06em] text-fg-subtle font-semibold mt-1">
                {stats.totalReviews > 0 ? "Verified Reviews" : "GPS Geofence Radius"}
              </div>
            </div>
            <div className="p-6 rounded-[22px] bg-surface text-left border-0">
              <div className="text-3xl font-semibold text-fg tabular-nums tracking-tight">
                {stats.totalPlaces > 0 ? `${stats.totalPlaces}` : "EXIF + GPS"}
              </div>
              <div className="text-[11px] uppercase tracking-[0.06em] text-fg-subtle font-semibold mt-1">
                {stats.totalPlaces > 0 ? "Pune Listed Venues" : "Dual-Check Verification"}
              </div>
            </div>
            <div className="p-6 rounded-[22px] bg-surface text-left border-0">
              <div className="text-3xl font-semibold text-accent-link tracking-tight">Bayesian</div>
              <div className="text-[11px] uppercase tracking-[0.06em] text-fg-subtle font-semibold mt-1">
                Shrinkage Rating Engine
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Modular Bento Grid */}
      <section className="container mx-auto px-4 py-16 border-t border-hairline/[0.08] max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent-link mb-1">
              Curated Directory
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.022em] text-fg">
              Explore Categories
            </h2>
            <p className="text-fg-muted text-sm mt-1">Structured for students, young professionals, and locals</p>
          </div>
          <Link
            href="/discover"
            className="text-accent-link hover:text-fg text-sm font-semibold flex items-center gap-1 group apple-press min-h-[44px]"
          >
            <span>Browse all spots</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { name: "Coaching Classes", slug: "coaching-classes", icon: GraduationCap, count: "Verified Listings", tag: "IIT / UPSC" },
            { name: "PGs & Hostels", slug: "pgs-hostels", icon: Home, count: "Verified Listings", tag: "Student Stay" },
            { name: "Cafes", slug: "cafes", icon: Coffee, count: "Verified Listings", tag: "FC Road & Viman" },
            { name: "Restaurants", slug: "restaurants", icon: Utensils, count: "Verified Listings", tag: "Mess & Dining" },
            { name: "Local Services", slug: "local-services", icon: Wrench, count: "Verified Listings", tag: "Study & Tech" },
          ].map((cat, index) => (
            <Link key={index} href={`/category/${cat.slug}`} className="apple-press">
              <div className="p-6 rounded-[22px] bg-surface hover:bg-surface-2 transition-[background-color,transform] duration-150 h-full flex flex-col justify-between space-y-4 group border-0">
                <div className="w-12 h-12 rounded-[14px] bg-accent-link/[0.12] text-accent-link flex items-center justify-center">
                  <cat.icon className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-fg-subtle uppercase tracking-[0.08em]">{cat.tag}</span>
                  <h3 className="text-base font-semibold text-fg group-hover:text-accent-link transition-colors mt-0.5">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-fg-subtle mt-1">{cat.count}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Pune Verified Places Spotlight */}
      <section className="container mx-auto px-4 py-16 border-t border-hairline/[0.08] max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-accent-link font-semibold mb-2">
              Verified Local Pune Spots
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.022em] text-fg">
              Top Rated by Students & Locals
            </h2>
          </div>
          <Link
            href="/discover"
            className="text-accent-link hover:text-fg text-sm font-semibold flex items-center gap-1 apple-press min-h-[44px]"
          >
            <span>View discover feed</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {highlights.map((place) => (
            <Link key={place.id} href={`/item/${place.id}`} className="apple-press">
              <div className="p-6 rounded-[22px] bg-surface hover:bg-surface-2 transition-[background-color,transform] duration-150 h-full flex flex-col justify-between group border-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex h-6 px-2.5 items-center rounded-full text-[11px] font-medium text-fg-muted bg-surface-2">
                      {place.tag}
                    </span>
                    <span className="text-xs text-fg-subtle font-mono">{place.price}</span>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-fg group-hover:text-accent-link transition-colors">
                      {place.name}
                    </h3>
                    <p className="text-xs text-fg-subtle flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-fg-subtle" />
                      {place.hub} • {place.category}
                    </p>
                  </div>

                  <p className="text-xs text-fg-muted leading-relaxed line-clamp-2">
                    &ldquo;{place.snippet}&rdquo;
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-hairline/[0.08] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center text-star font-semibold tabular-nums">
                      <Star className="w-3.5 h-3.5 fill-star text-star mr-1" />
                      {place.rating}
                    </div>
                    <span className="text-fg-subtle">({place.reviews})</span>
                  </div>

                  {place.verifiedCheckin && (
                    <span className="inline-flex h-6 px-2.5 items-center gap-1 rounded-full text-[11px] font-medium text-success bg-success/10">
                      <CheckCircle2 className="w-3 h-3" />
                      GPS Verified
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Community Verified Reviews Feed */}
      <section className="container mx-auto px-4 py-16 border-t border-hairline/[0.08] max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent-link">
            Live Reviews
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.022em] text-fg">Real Pune Feedback</h2>
          <p className="text-fg-muted text-sm">Authenticated reviewers verified via physical coordinates</p>
        </div>

        {liveReviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {liveReviews.map((rev) => (
              <div
                key={rev.id}
                className="p-6 rounded-[22px] bg-surface flex flex-col justify-between space-y-4 border-0"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center text-xs font-semibold text-accent-link">
                        {rev.user ? rev.user[0].toUpperCase() : "U"}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-fg">{rev.user}</h4>
                        <span className="text-[10px] text-success font-medium">
                          {rev.trustScore >= 75 ? "Trusted Resident" : rev.trustScore >= 40 ? "Verified Visitor" : "Community Member"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center text-star text-xs font-semibold tabular-nums">
                      <Star className="w-3 h-3 fill-star text-star mr-1" />
                      {Number(rev.rating).toFixed(1)}
                    </div>
                  </div>

                  <div className="text-xs font-medium text-accent-link flex items-center gap-1">
                    <span>{rev.place}</span>
                    <span className="text-fg-subtle">•</span>
                    <span className="text-fg-subtle">{rev.hub}</span>
                  </div>

                  <p className="text-xs text-fg/90 leading-relaxed">
                    &ldquo;{rev.text}&rdquo;
                  </p>
                </div>

                <div className="pt-3 border-t border-hairline/[0.08] flex items-center justify-between text-[11px] text-fg-subtle">
                  <span>{new Date(rev.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                  <span className="inline-flex items-center gap-1 text-success">
                    <ShieldCheck className="w-3 h-3" />
                    GPS Checked-in
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-6 max-w-md mx-auto rounded-[28px] bg-surface space-y-4 border-0">
            <ShieldCheck className="w-10 h-10 text-accent-link mx-auto" />
            <h3 className="text-base font-semibold text-fg">Be the First Verified Reviewer</h3>
            <p className="text-xs text-fg-muted leading-relaxed">
              Check in at any Pune venue, verify your on-site photo, and help students discover authentic local favorites.
            </p>
            <Link
              href="/discover"
              className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-full liquid-glass-btn text-[14px] font-semibold"
            >
              Explore Pune Venues
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-canvas flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="h-5 w-5 rounded-full border-2 border-accent-link border-t-transparent animate-spin mx-auto" />
            <p className="text-fg-muted text-sm font-medium">Loading RateIT Pune...</p>
          </div>
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  )
}
