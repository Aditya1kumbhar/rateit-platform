"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  MapPin,
  Compass,
  Coffee,
  GraduationCap,
  Home,
  Utensils,
  Wrench,
  Sparkles,
  ArrowRight,
  X,
  TrendingUp,
} from "lucide-react"

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

interface SuggestionItem {
  id?: string
  text: string
  type: "place" | "query" | "category"
  category?: string
  href?: string
}

const POPULAR_HUBS = [
  { label: "FC Road Cafes", query: "FC Road" },
  { label: "Kothrud JEE Coaching", query: "Kothrud" },
  { label: "Hinjewadi Tech PGs", query: "Hinjewadi" },
  { label: "Viman Nagar Cafes", query: "Viman Nagar" },
]

const QUICK_CATEGORIES = [
  { name: "Coaching Classes", href: "/category/coaching-classes", icon: GraduationCap },
  { name: "PGs & Hostels", href: "/category/pgs-hostels", icon: Home },
  { name: "Cafés & Study", href: "/category/cafes", icon: Coffee },
  { name: "Restaurants & Messes", href: "/category/restaurants", icon: Utensils },
  { name: "Local Services", href: "/category/local-services", icon: Wrench },
]

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus on open instantly (Raycast standard)
  useEffect(() => {
    if (isOpen) {
      setQuery("")
      setSuggestions([])
      setSelectedIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [isOpen])

  // Live autocomplete debounced
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([])
      setIsLoading(false)
      return
    }

    let active = true
    setIsLoading(true)

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(query.trim())}`)
        if (res.ok) {
          const json = await res.json()
          if (active && Array.isArray(json.suggestions)) {
            setSuggestions(json.suggestions)
            setSelectedIndex(0)
          }
        }
      } catch (err) {
        console.warn("Autocomplete fetch failed:", err)
      } finally {
        if (active) setIsLoading(false)
      }
    }, 150)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [query])

  const handleSelect = useCallback(
    (item: SuggestionItem) => {
      onClose()
      if (item.href) {
        router.push(item.href)
      } else if (item.type === "place" && item.id) {
        router.push(`/item/${item.id}`)
      } else {
        router.push(`/discover?search=${encodeURIComponent(item.text)}`)
      }
    },
    [onClose, router]
  )

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault()
      onClose()
      return
    }

    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % suggestions.length)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
      } else if (e.key === "Enter") {
        e.preventDefault()
        const selected = suggestions[selectedIndex]
        if (selected) {
          handleSelect(selected)
        } else if (query.trim()) {
          onClose()
          router.push(`/discover?search=${encodeURIComponent(query.trim())}`)
        }
      }
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (query.trim()) {
        onClose()
        router.push(`/discover?search=${encodeURIComponent(query.trim())}`)
      }
    }
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/30 dark:bg-black/80 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* 0ms instantaneous open per Emil Kowalski 100+/day keyboard standard */}
      <div className="w-full max-w-xl rounded-[22px] bg-surface border border-hairline/[0.08] shadow-[0_24px_70px_rgba(0,0,0,0.15)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col text-fg">
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-hairline/[0.08]">
          <Search className="w-5 h-5 text-accent-link shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search Pune coaching, cafes, PGs, restaurants..."
            className="w-full bg-transparent text-base sm:text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="p-1.5 rounded-lg text-fg-subtle hover:text-fg hover:bg-surface-2 mr-2 apple-press min-h-[36px] min-w-[36px] flex items-center justify-center apple-focus"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
          <kbd className="hidden sm:inline-block text-[10px] font-mono bg-surface-2 text-fg-subtle border border-hairline/[0.08] px-2 py-0.5 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Content Body */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {/* Live Suggestions State */}
          {suggestions.length > 0 ? (
            <div className="space-y-1">
              <span className="text-[10px] font-semibold tracking-wider uppercase text-fg-muted px-3 block mb-1">
                Suggestions
              </span>
              {suggestions.map((item, idx) => {
                const isSelected = idx === selectedIndex
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-[background-color,color] duration-150 apple-press apple-focus ${
                      isSelected
                        ? "bg-accent-link/[0.12] text-fg"
                        : "text-fg-muted hover:bg-surface-2"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {item.type === "place" ? (
                        <MapPin className="w-4 h-4 text-accent-link shrink-0" />
                      ) : (
                        <Search className="w-4 h-4 text-fg-subtle shrink-0" />
                      )}
                      <span className="truncate font-medium text-fg">{item.text}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.category && (
                        <span className="text-[10px] font-medium text-accent-link bg-accent-link/[0.12] px-2.5 py-0.5 rounded-full">
                          {item.category.replace("_", " ")}
                        </span>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-fg-subtle" />
                    </div>
                  </button>
                )
              })}
            </div>
          ) : null}

          {/* Fallback Empty Search Result */}
          {query.trim().length >= 2 && !isLoading && suggestions.length === 0 ? (
            <div className="text-center py-6 space-y-2">
              <Compass className="w-8 h-8 text-fg-subtle mx-auto" />
              <p className="text-xs text-fg-muted">
                No instant suggestions for &ldquo;{query}&rdquo;
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  router.push(`/discover?search=${encodeURIComponent(query.trim())}`)
                }}
                className="text-xs font-semibold text-accent-link hover:underline inline-flex items-center gap-1 apple-focus"
              >
                Search all Pune spots on Discover <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ) : null}

          {/* Quick Pune Hubs & Categories (Shown when query is empty) */}
          {!query.trim() ? (
            <>
              {/* Popular Pune Hubs */}
              <div>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-fg-muted px-3 block mb-2">
                  Popular Pune Hubs
                </span>
                <div className="flex flex-wrap gap-1.5 px-3">
                  {POPULAR_HUBS.map((hub, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        onClose()
                        router.push(`/discover?search=${encodeURIComponent(hub.query)}`)
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-surface-2 hover:bg-surface-3 border border-hairline/[0.08] text-xs text-fg-muted hover:text-fg transition-[background-color,color] duration-150 apple-press apple-focus flex items-center gap-1.5"
                    >
                      <TrendingUp className="w-3 h-3 text-accent-link" />
                      <span>{hub.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-fg-muted px-3 block mb-2">
                  Browse by Category
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 px-1">
                  {QUICK_CATEGORIES.map((cat, idx) => {
                    const Icon = cat.icon
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          onClose()
                          router.push(cat.href)
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-fg-muted hover:text-fg hover:bg-surface-2 transition-[background-color,color] duration-150 text-left apple-press apple-focus"
                      >
                        <div className="w-7 h-7 rounded-lg bg-accent-link/[0.12] text-accent-link flex items-center justify-center shrink-0">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-medium truncate">{cat.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-surface-2 border-t border-hairline/[0.08] flex items-center justify-between text-[11px] text-fg-subtle">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-accent-link" />
            <span>RateIT Hyperlocal Search</span>
          </span>
          <span className="hidden sm:inline">Use ↑ ↓ to navigate, ↵ to select</span>
        </div>
      </div>
    </div>
  )
}
