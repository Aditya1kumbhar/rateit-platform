"use client"

import { useState, useMemo, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Star, MapPin, Heart, Compass, Sparkles, X, Info } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { SaveToListsModal } from "@/components/save-to-lists-modal"
import { getCurrentPosition } from "@/lib/geolocation"

export interface DiscoverPlace {
  id: string
  name: string
  category: string
  description?: string | null
  address: string
  city?: string
  latitude: number
  longitude: number
  avgRating: number
  reviewCount: number
  distanceKm?: number
  tags: string[]
  priceRange?: string | null
  imageUrl?: string | null
  score?: number
  isExploration?: boolean
}

interface DiscoverClientProps {
  initialPlaces: DiscoverPlace[]
}

function DiscoverContent({ initialPlaces }: DiscoverClientProps) {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("search") || ""

  const [places, setPlaces] = useState<DiscoverPlace[]>(initialPlaces)
  const [feedPlaces, setFeedPlaces] = useState<DiscoverPlace[]>(initialPlaces)
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("personalized")
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [searchFallbackNotice, setSearchFallbackNotice] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const [showSaveModal, setShowSaveModal] = useState(false)
  const [selectedPlaceForSave, setSelectedPlaceForSave] = useState<{ id: string; name: string } | null>(null)

  // Sync searchQuery when URL query param changes
  useEffect(() => {
    const q = searchParams.get("search")
    if (q !== null) {
      setSearchQuery(q)
    }
  }, [searchParams])

  // Fetch live personalized feed from /api/feed on mount
  useEffect(() => {
    let active = true

    const loadFeed = async (lat?: number, lng?: number) => {
      try {
        const query = lat !== undefined && lng !== undefined ? `?lat=${lat}&lng=${lng}` : ""
        const res = await fetch(`/api/feed${query}`)
        if (res.ok) {
          const json = await res.json()
          if (active && json.data && json.data.length > 0) {
            setFeedPlaces(json.data)
            if (!searchQuery.trim()) {
              setPlaces(json.data)
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch personalized feed:", err)
      }
    }

    getCurrentPosition().then((pos) => {
      if (pos.success && pos.coordinates) {
        setUserCoords({ lat: pos.coordinates.latitude, lng: pos.coordinates.longitude })
        loadFeed(pos.coordinates.latitude, pos.coordinates.longitude)
      } else {
        loadFeed()
      }
    })

    return () => {
      active = false
    }
  }, [])

  // Live Trigram Search Integration with /api/search
  useEffect(() => {
    const trimmed = searchQuery.trim()
    if (!trimmed) {
      setPlaces(feedPlaces)
      setSearchFallbackNotice(null)
      setIsSearching(false)
      return
    }

    let active = true
    setIsSearching(true)

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: trimmed })
        if (userCoords) {
          params.set("lat", userCoords.lat.toString())
          params.set("lng", userCoords.lng.toString())
        }
        if (selectedCategory && selectedCategory !== "all") {
          params.set("category", selectedCategory)
        }

        const res = await fetch(`/api/search?${params.toString()}`)
        if (res.ok) {
          const json = await res.json()
          if (active && json.data) {
            setPlaces(json.data)
            if (json.meta && json.meta.isFallback && json.meta.fallbackMessage) {
              setSearchFallbackNotice(json.meta.fallbackMessage)
            } else {
              setSearchFallbackNotice(null)
            }
          }
        } else {
          // Fallback to local in-memory filter
          if (active) {
            const lower = trimmed.toLowerCase()
            const filtered = feedPlaces.filter(
              (p) =>
                p.name.toLowerCase().includes(lower) ||
                p.address.toLowerCase().includes(lower) ||
                p.tags?.some((t) => t.toLowerCase().includes(lower))
            )
            setPlaces(filtered)
            setSearchFallbackNotice(null)
          }
        }
      } catch (err) {
        console.warn("Search query failed, falling back to local dataset:", err)
        if (active) {
          const lower = trimmed.toLowerCase()
          setPlaces(feedPlaces.filter((p) => p.name.toLowerCase().includes(lower)))
        }
      } finally {
        if (active) setIsSearching(false)
      }
    }, 200)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [searchQuery, feedPlaces, userCoords, selectedCategory])

  const categories = [
    { id: "all", label: "All Categories" },
    { id: "coaching", label: "Coaching" },
    { id: "hostel", label: "PGs & Hostels" },
    { id: "cafe", label: "Cafés" },
    { id: "restaurant", label: "Restaurants" },
    { id: "library", label: "Libraries" },
    { id: "service", label: "Local Services" },
  ]

  const filteredAndSortedPlaces = useMemo(() => {
    let result = [...places]

    if (selectedCategory !== "all") {
      result = result.filter((place) => {
        const cat = (place.category || "").toLowerCase()
        if (selectedCategory === "coaching") return cat.includes("coaching") || cat.includes("class")
        if (selectedCategory === "hostel") return cat.includes("pg") || cat.includes("hostel")
        if (selectedCategory === "cafe") return cat.includes("cafe") || cat.includes("coffee")
        if (selectedCategory === "restaurant") return cat.includes("restaurant") || cat.includes("mess") || cat.includes("food")
        if (selectedCategory === "library") return cat.includes("library") || cat.includes("study")
        if (selectedCategory === "service") return cat.includes("service") || cat.includes("store") || cat.includes("laundry")
        return true
      })
    }

    result.sort((a, b) => {
      if (sortBy === "personalized") return (b.score || 0) - (a.score || 0)
      if (sortBy === "rating") return (b.avgRating || 0) - (a.avgRating || 0)
      if (sortBy === "reviews") return (b.reviewCount || 0) - (a.reviewCount || 0)
      if (sortBy === "distance") return (a.distanceKm || 999) - (b.distanceKm || 999)
      if (sortBy === "name") return a.name.localeCompare(b.name)
      return 0
    })

    return result
  }, [places, selectedCategory, sortBy])

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      {/* Header & Search Bar */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.022em] text-fg">
            Discover Pune
          </h1>
          <p className="text-fg-muted text-sm mt-1">
            Personalized directory of coaching hubs, student PGs, cafes, and spots with verified check-ins.
          </p>
        </div>

        {/* Search Bar (Apple Pill Input) */}
        <div className="relative flex items-center rounded-full bg-surface-2 border border-hairline p-1 shadow-sm focus-within:border-accent-link/60 focus-within:ring-2 focus-within:ring-accent-link/20 transition-[border-color] duration-150">
          <Search className="w-4 h-4 text-accent-link ml-3.5 shrink-0" />
          <input
            type="text"
            placeholder="Search Pune venues, coaching, FC Road cafes, PGs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="p-1.5 mr-2 rounded-full text-fg-subtle hover:text-fg hover:bg-surface-3 transition-colors apple-focus"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search Fallback Notice Banner */}
      {searchFallbackNotice && (
        <div className="flex items-center gap-2 p-3 rounded-card bg-accent-tint border border-accent-link/20 text-xs text-accent-link">
          <Info className="w-4 h-4 text-accent-link shrink-0" />
          <span>{searchFallbackNotice}</span>
        </div>
      )}

      {/* Category Pills & Sort Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Horizontal Category Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors duration-150 apple-press apple-focus min-h-[36px] ${
                  isSelected
                    ? "bg-accent text-white shadow-sm shadow-accent/20"
                    : "bg-surface-2 text-fg-muted hover:text-fg hover:bg-surface-3 border border-hairline"
                }`}
              >
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-fg-subtle font-medium hidden sm:inline">Sort:</span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] bg-surface-2 border-hairline text-fg text-xs rounded-full apple-focus">
              <SelectValue placeholder="Sort places" />
            </SelectTrigger>
            <SelectContent className="bg-surface border-hairline text-fg">
              <SelectItem value="personalized">Top Picks For You</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="reviews">Most Reviews</SelectItem>
              <SelectItem value="distance">Nearest to Me</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Places Count */}
      <div className="flex items-center justify-between text-xs text-fg-subtle px-1">
        <span>
          Showing <strong className="text-fg tabular-nums">{filteredAndSortedPlaces.length}</strong> verified Pune places
        </span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-accent-link hover:underline"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Places Feed Cards (Apple Minimal Border + Fill Contrast) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAndSortedPlaces.map((place, idx) => (
          <Link
            key={place.id}
            href={`/item/${place.id}`}
            className="block apple-press group apple-focus rounded-card"
            style={{ animationDelay: `${Math.min(idx * 40, 240)}ms` }}
          >
            <div className="p-5 rounded-card bg-surface hover:bg-surface-2 transition-[background-color] duration-150 h-full flex flex-col justify-between border-0 shadow-sm">
              <div className="space-y-3">
                {/* Header row: Category tag & exploration badge & bookmark */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-fg-muted bg-surface-2 px-2.5 py-0.5 rounded-full border border-hairline">
                      {place.category.replace("_", " ")}
                    </span>
                    {place.isExploration && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-accent-link bg-accent-tint px-2.5 py-0.5 rounded-full border border-accent-link/20">
                        <Sparkles className="w-3 h-3" />
                        Serendipity Pick
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setSelectedPlaceForSave({ id: place.id, name: place.name })
                      setShowSaveModal(true)
                    }}
                    title="Save to list"
                    className="p-1.5 rounded-full text-fg-subtle hover:text-danger hover:bg-surface-3 transition-colors apple-press apple-focus"
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                </div>

                {/* Place Name & Rating */}
                <div>
                  <h3 className="text-lg font-semibold text-fg tracking-[-0.022em] group-hover:text-accent-link transition-colors">
                    {place.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs mt-1">
                    <div className="flex items-center text-star font-semibold tabular-nums">
                      <Star className="w-3.5 h-3.5 fill-star text-star mr-1" />
                      {place.avgRating ? place.avgRating.toFixed(1) : "0.0"}
                    </div>
                    <span className="text-fg-subtle">•</span>
                    <span className="text-fg-subtle tabular-nums">{place.reviewCount} reviews</span>
                    {place.priceRange && (
                      <>
                        <span className="text-fg-subtle">•</span>
                        <span className="text-fg-muted font-mono">{place.priceRange}</span>
                      </>
                    )}
                    {place.distanceKm !== undefined && (
                      <>
                        <span className="text-fg-subtle">•</span>
                        <span className="text-success font-medium tabular-nums">{place.distanceKm.toFixed(1)} km</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-center gap-1.5 text-xs text-fg-subtle">
                  <MapPin className="w-3.5 h-3.5 text-fg-subtle shrink-0" />
                  <span className="truncate">{place.address}</span>
                </div>

                {/* Description */}
                {place.description && (
                  <p className="text-xs text-fg-muted line-clamp-2 leading-relaxed">
                    {place.description}
                  </p>
                )}
              </div>

              {/* Tags footer */}
              {place.tags && place.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-4 mt-3 border-t border-hairline">
                  {place.tags.slice(0, 4).map((tag, tagIdx) => (
                    <span
                      key={tagIdx}
                      className="text-[10px] font-medium text-fg-muted bg-surface-2 px-2.5 py-0.5 rounded-full border border-hairline"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}

        {/* Empty state */}
        {filteredAndSortedPlaces.length === 0 && (
          <div className="col-span-full py-16 text-center rounded-modal bg-surface space-y-3">
            <Compass className="w-10 h-10 text-fg-subtle mx-auto" />
            <h3 className="text-base font-semibold text-fg">No Pune spots found</h3>
            <p className="text-xs text-fg-muted max-w-sm mx-auto">
              No places matched your query &ldquo;{searchQuery}&rdquo;. Try searching for &ldquo;FC Road&rdquo;, &ldquo;Kothrud&rdquo;, or &ldquo;Coaching&rdquo;.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("")
                setSelectedCategory("all")
              }}
              className="mt-2 rounded-full border-hairline text-fg hover:bg-surface-2 apple-focus"
            >
              Reset filters
            </Button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showSaveModal && selectedPlaceForSave && (
        <SaveToListsModal
          onClose={() => {
            setShowSaveModal(false)
            setSelectedPlaceForSave(null)
          }}
          placeId={selectedPlaceForSave.id}
          placeName={selectedPlaceForSave.name}
        />
      )}
    </div>
  )
}

export function DiscoverClient({ initialPlaces }: DiscoverClientProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-canvas flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-fg-muted text-sm font-medium">Loading Discover Feed...</p>
          </div>
        </div>
      }
    >
      <DiscoverContent initialPlaces={initialPlaces} />
    </Suspense>
  )
}
