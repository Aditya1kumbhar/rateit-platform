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
      <div className="p-6 md:p-8 rounded-[28px] bg-surface border-0 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-flex h-6 px-2.5 items-center gap-1.5 rounded-full text-[11px] font-medium bg-accent-link/[0.12] text-accent-link">
              <Sparkles className="w-3.5 h-3.5" />
              Pune Verified Hubs
            </span>
            <h1 className="text-[28px] sm:text-[40px] font-semibold tracking-[-0.022em] text-fg">
              Best {categoryName} in Pune
            </h1>
            <p className="text-fg-muted text-sm max-w-xl">
              Authentic student and local resident reviews verified via physical GPS geofencing. Zero promotional bias.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3.5 rounded-[14px] bg-surface-2 text-center min-w-[90px]">
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
              className={`h-9 px-4 rounded-full text-[12px] font-medium transition-[background-color,color] duration-150 apple-press apple-focus ${
                sortBy === sort.id
                  ? "bg-accent text-stone-950 font-semibold shadow-sm"
                  : "bg-surface-2 text-fg-muted hover:text-fg"
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
            className="block apple-press group apple-focus rounded-[22px]"
            style={{ animationDelay: `${Math.min(idx * 40, 240)}ms` }}
          >
            <div className="p-5 rounded-[22px] bg-surface hover:bg-surface-2 transition-[background-color] duration-150 h-full flex flex-col justify-between border-0">
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
                    className="w-9 h-9 rounded-full bg-surface-2 hover:bg-surface-3 text-fg-subtle hover:text-danger flex items-center justify-center transition-[background-color,color] duration-150 apple-press apple-focus"
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
                <div className="flex flex-wrap gap-1.5 pt-4 mt-3 border-t border-hairline/[0.08]">
                  {item.tags.slice(0, 4).map((tag, tagIdx) => (
                    <span
                      key={tagIdx}
                      className="inline-flex h-6 px-2.5 items-center rounded-full text-[11px] font-medium text-fg-muted bg-surface-2"
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
          <div className="col-span-full py-16 text-center rounded-[28px] bg-surface space-y-3 border-0">
            <h3 className="text-base font-semibold text-fg">No places listed yet in {categoryName}</h3>
            <p className="text-xs text-fg-muted max-w-sm mx-auto">
              Be the first Pune local or student to add and review a place in this category!
            </p>
            <Button
              onClick={() => openRateModal()}
              className="mt-2 inline-flex items-center justify-center min-h-[44px] px-6 rounded-full liquid-glass-btn text-[14px] font-semibold cursor-pointer"
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
