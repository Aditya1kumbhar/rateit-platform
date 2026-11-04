"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Star, MapPin, Heart, Sparkles, ChevronRight } from "lucide-react"
import Link from "next/link"
import { SaveToListsModal } from "@/components/save-to-lists-modal"
import { useUI } from "@/components/ui-provider"

export interface CategoryPlace {
  id: string
  name: string
  category: string
  description?: string | null
  address: string
  avgRating: number
  reviewCount: number
  tags: string[]
  priceRange?: string | null
  imageUrl?: string | null
}

interface CategoryClientProps {
  categoryName: string
  places: CategoryPlace[]
}

export function CategoryClient({ categoryName, places }: CategoryClientProps) {
  const [sortBy, setSortBy] = useState("rating")
  const { openRateModal } = useUI()
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [selectedPlaceForSave, setSelectedPlaceForSave] = useState<{ id: string; name: string } | null>(null)

  const sortedItems = [...(places || [])].sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return b.avgRating - a.avgRating
      case "reviews":
        return b.reviewCount - a.reviewCount
      case "name":
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-fg-subtle">
        <Link href="/" className="hover:text-fg transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-fg-subtle" />
        <Link href="/categories" className="hover:text-fg transition-colors">
          Categories
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-fg-subtle" />
        <span className="text-fg font-medium">{categoryName}</span>
      </nav>

      {/* Category Hero Header */}
      <div className="p-6 md:p-8 rounded-modal bg-surface border-0 relative overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-accent-tint text-accent-link border border-accent-link/20">
              <Sparkles className="w-3.5 h-3.5" />
              Pune Verified Hubs
            </span>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.022em] text-fg">
              Best {categoryName} in Pune
            </h1>
            <p className="text-fg-muted text-sm max-w-xl">
              Authentic student & local resident reviews verified via physical GPS geofencing. Zero promotional bias.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-4 rounded-card bg-surface-2 text-center min-w-[100px]">
              <div className="text-2xl font-semibold text-accent-link tabular-nums">
                {places.length}
              </div>
              <div className="text-[11px] text-fg-subtle font-medium">Spots Listed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sort Buttons Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-fg-subtle font-medium mr-1 hidden sm:inline">Sort:</span>
          {[
            { id: "rating", label: "Highest Rated" },
            { id: "reviews", label: "Most Reviews" },
            { id: "name", label: "Name A-Z" },
          ].map((sort) => (
            <button
              key={sort.id}
              onClick={() => setSortBy(sort.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 apple-press apple-focus ${
                sortBy === sort.id
                  ? "bg-accent text-white shadow-sm shadow-accent/20"
                  : "bg-surface-2 text-fg-muted hover:text-fg hover:bg-surface-3 border border-hairline"
              }`}
            >
              {sort.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => openRateModal()}
          className="text-xs font-semibold text-accent-link hover:underline flex items-center gap-1 apple-press apple-focus cursor-pointer"
        >
          <span>+ Rate a {categoryName.slice(0, -1)}</span>
        </button>
      </div>

      {/* Places Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedItems.map((item, idx) => (
          <Link
            key={item.id}
            href={`/item/${item.id}`}
            className="block apple-press group apple-focus rounded-card"
            style={{ animationDelay: `${Math.min(idx * 40, 240)}ms` }}
          >
            <div className="p-5 rounded-card bg-surface hover:bg-surface-2 transition-[background-color] duration-150 h-full flex flex-col justify-between border-0 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-fg tracking-[-0.022em] group-hover:text-accent-link transition-colors">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs mt-1">
                      <div className="flex items-center text-star font-semibold tabular-nums">
                        <Star className="w-3.5 h-3.5 fill-star text-star mr-1" />
                        {item.avgRating ? item.avgRating.toFixed(1) : "0.0"}
                      </div>
                      <span className="text-fg-subtle">•</span>
                      <span className="text-fg-subtle tabular-nums">{item.reviewCount} verified reviews</span>
                      {item.priceRange && (
                        <>
                          <span className="text-fg-subtle">•</span>
                          <span className="text-fg-muted font-mono">{item.priceRange}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setSelectedPlaceForSave({ id: item.id, name: item.name })
                      setShowSaveModal(true)
                    }}
                    title="Save to list"
                    className="p-1.5 rounded-lg text-fg-subtle hover:text-danger hover:bg-surface-3 transition-colors apple-press apple-focus"
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-fg-subtle">
                  <MapPin className="w-3.5 h-3.5 text-fg-subtle shrink-0" />
                  <span className="truncate">{item.address}</span>
                </div>

                {item.description && (
                  <p className="text-xs text-fg-muted line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>

              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-4 mt-3 border-t border-hairline">
                  {item.tags.slice(0, 4).map((tag, tagIdx) => (
                    <span
                      key={tagIdx}
                      className="text-[10px] font-medium text-fg-muted bg-surface-2 px-2.5 py-0.5 rounded-md border border-hairline"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}

        {sortedItems.length === 0 && (
          <div className="col-span-full py-16 text-center rounded-modal bg-surface space-y-3 border-0">
            <h3 className="text-base font-semibold text-fg">No places listed yet in {categoryName}</h3>
            <p className="text-xs text-fg-muted max-w-sm mx-auto">
              Be the first Pune local or student to add and review a place in this category!
            </p>
            <Button
              onClick={() => openRateModal()}
              size="sm"
              className="mt-2 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg px-5 py-2.5 apple-press apple-focus"
            >
              Add First Spot
            </Button>
          </div>
        )}
      </div>

      {/* Save to List Modal */}
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
