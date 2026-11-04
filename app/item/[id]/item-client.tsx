"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Star,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Heart,
  Share2,
  ChevronRight,
  MessageSquare,
  ThumbsUp,
  Camera,
  CheckCircle2,
} from "lucide-react"
import Link from "next/link"
import { useUI } from "@/components/ui-provider"
import { SaveToListsModal } from "@/components/save-to-lists-modal"
import { toast } from "sonner"

interface ReviewUser {
  id: string
  displayName: string | null
  avatarUrl: string | null
  trustScore: number
}

interface Review {
  id: string
  rating: number
  text: string | null
  tags: string[]
  photoUrls: string[]
  checkinVerified: boolean
  publishDate: Date | string
  user: ReviewUser | null
  bizReply: {
    text: string
    publishedAt: Date | string
  } | null
}

interface Place {
  id: string
  name: string
  category: string
  description?: string | null
  address: string
  city: string
  latitude: number
  longitude: number
  avgRating: number
  bayesianRating?: number
  reviewCount: number
  priceRange?: string | null
  imageUrl?: string | null
  tags: string[]
  isVerifiedBiz: boolean
  reviews: Review[]
}

interface ItemClientProps {
  place: Place
}

export function ItemClient({ place }: ItemClientProps) {
  const { openRateModal } = useUI()
  const [activeTab, setActiveTab] = useState("overview")
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [likedReviews, setLikedReviews] = useState<Record<string, number>>({})
  const [hasVoted, setHasVoted] = useState<Record<string, boolean>>({})

  // Similar places volume-gated state
  const [similarPlaces, setSimilarPlaces] = useState<any[]>([])
  const [similarType, setSimilarType] = useState<"collaborative" | "category">("category")

  useEffect(() => {
    let active = true
    fetch(`/api/places/${place.id}/similar`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (active && json && Array.isArray(json.data)) {
          setSimilarPlaces(json.data)
          if (json.type) setSimilarType(json.type)
        }
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [place.id])

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${place.name}: RateIT Pune`,
        text: `Check out verified student & local reviews for ${place.name} in Pune.`,
        url: window.location.href,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Link copied to clipboard")
    }
  }

  const handleHelpfulClick = async (reviewId: string) => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: "POST",
      })
      if (res.ok) {
        const json = await res.json()
        setLikedReviews((prev) => ({ ...prev, [reviewId]: json.helpfulCount }))
        setHasVoted((prev) => ({ ...prev, [reviewId]: json.hasVoted }))
        if (json.hasVoted) {
          toast.success("Marked as helpful (+1 reviewer trust score)")
        }
      }
    } catch {
      toast.error("Could not register helpful vote")
    }
  }

  const getTrustBadge = (score: number) => {
    if (score >= 75) {
      return { label: "Trusted Resident", color: "text-success bg-success/10" }
    } else if (score >= 40) {
      return { label: "Verified Visitor", color: "text-accent-link bg-accent-link/[0.12]" }
    }
    return { label: "Community Member", color: "text-fg-muted bg-surface-2" }
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-fg-subtle">
        <Link href="/" className="hover:text-fg transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-fg-subtle" />
        <Link href="/discover" className="hover:text-fg transition-colors">
          Discover
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-fg-subtle" />
        <span className="text-fg font-medium truncate max-w-[200px] sm:max-w-none">
          {place.name}
        </span>
      </nav>

      {/* Place Hero Visual Card (Apple Minimalist Border + Fill Contrast) */}
      <div className="p-6 md:p-8 rounded-[28px] bg-surface relative overflow-hidden border-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex h-6 px-2.5 items-center rounded-full text-[11px] font-medium bg-surface-2 text-fg-muted">
                {place.category.replace("_", " ")}
              </span>
              {place.isVerifiedBiz ? (
                <span className="inline-flex h-6 px-2.5 items-center gap-1.5 rounded-full text-[11px] font-medium text-success bg-success/10">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Business Claim
                </span>
              ) : (
                <Link
                  href={`/business/claim/${place.id}`}
                  className="inline-flex h-6 px-2.5 items-center gap-1 rounded-full text-[11px] font-medium text-fg-subtle hover:text-fg bg-surface-2 transition-[color,background-color] duration-150 apple-focus"
                >
                  Claim this business &rarr;
                </Link>
              )}
            </div>

            <h1 className="text-[28px] sm:text-[40px] font-semibold tracking-[-0.022em] text-fg">
              {place.name}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center text-star font-semibold tabular-nums">
                <Star className="w-4 h-4 fill-star text-star mr-1.5" />
                <span className="text-lg">{place.avgRating ? place.avgRating.toFixed(1) : "0.0"}</span>
              </div>
              <span className="text-fg-subtle">•</span>
              <span className="text-fg-subtle tabular-nums">{place.reviewCount} verified reviews</span>
              {place.priceRange && (
                <>
                  <span className="text-fg-subtle">•</span>
                  <span className="text-fg-muted font-mono">{place.priceRange}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-fg-subtle">
              <MapPin className="w-4 h-4 text-accent-link shrink-0" />
              <span>{place.address}, {place.city}</span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${place.address} ${place.city}`)}`}
                target="_blank"
                rel="noreferrer"
                className="text-accent-link hover:underline flex items-center gap-1 ml-1 text-xs"
              >
                Maps <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <button
              onClick={() =>
                openRateModal({
                  id: place.id,
                  name: place.name,
                  category: place.category,
                  address: place.address,
                  latitude: place.latitude,
                  longitude: place.longitude,
                })
              }
              className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-full liquid-glass-btn text-[14px] font-semibold cursor-pointer"
            >
              <Star className="w-4 h-4 fill-stone-950 text-stone-950 mr-2" />
              <span>Rate this spot</span>
            </button>
            <button
              onClick={() => setShowSaveModal(true)}
              className="min-h-[44px] min-w-[44px] rounded-full bg-surface-2 hover:bg-surface-3 text-fg flex items-center justify-center transition-[background-color,transform] duration-150 apple-press apple-focus"
              title="Save to list"
              aria-label="Save to list"
            >
              <Heart className="w-4 h-4" />
            </button>
            <button
              onClick={handleShare}
              className="min-h-[44px] min-w-[44px] rounded-full bg-surface-2 hover:bg-surface-3 text-fg flex items-center justify-center transition-[background-color,transform] duration-150 apple-press apple-focus"
              title="Share"
              aria-label="Share spot"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Container */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-surface-2 p-1 rounded-full grid grid-cols-4 max-w-md border-0">
          <TabsTrigger value="overview" className="rounded-full text-[12px] font-medium data-[state=active]:bg-surface-3 data-[state=active]:text-fg text-fg-muted transition-colors">
            Overview
          </TabsTrigger>
          <TabsTrigger value="reviews" className="rounded-full text-[12px] font-medium data-[state=active]:bg-surface-3 data-[state=active]:text-fg text-fg-muted transition-colors">
            Reviews ({place.reviews.length})
          </TabsTrigger>
          <TabsTrigger value="photos" className="rounded-full text-[12px] font-medium data-[state=active]:bg-surface-3 data-[state=active]:text-fg text-fg-muted transition-colors">
            Photos
          </TabsTrigger>
          <TabsTrigger value="info" className="rounded-full text-[12px] font-medium data-[state=active]:bg-surface-3 data-[state=active]:text-fg text-fg-muted transition-colors">
            Location
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="p-6 rounded-[22px] bg-surface space-y-3 border-0">
            <h3 className="text-base font-semibold text-fg">About</h3>
            <p className="text-sm text-fg-muted leading-relaxed">
              {place.description || "No official description provided yet. Community verified Pune location."}
            </p>
          </div>

          {place.tags && place.tags.length > 0 && (
            <div className="p-6 rounded-[22px] bg-surface space-y-3 border-0">
              <h3 className="text-base font-semibold text-fg">Features & Highlights</h3>
              <div className="flex flex-wrap gap-2">
                {place.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-medium text-fg-muted bg-surface-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-link" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Similar Places Nearby */}
          {similarPlaces.length > 0 && (
            <div className="p-6 rounded-[22px] bg-surface space-y-4 border-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-fg">
                    {similarType === "collaborative" ? "People Also Visited" : `Similar in ${place.category.replace("_", " ")}`}
                  </h3>
                  <p className="text-xs text-fg-subtle mt-0.5">
                    {similarType === "collaborative"
                      ? "High co-interaction similarity in Pune"
                      : "Top Bayesian rated in this category"}
                  </p>
                </div>
                <span className="inline-flex h-6 px-2.5 items-center rounded-full text-[11px] font-medium text-accent-link bg-accent-link/[0.12]">
                  {similarType === "collaborative" ? "Collaborative" : "Category Match"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {similarPlaces.map((sim) => (
                  <Link key={sim.id} href={`/item/${sim.id}`} className="block apple-press group apple-focus rounded-[22px]">
                    <div className="p-4 rounded-[22px] bg-surface-2 hover:bg-surface-3 transition-colors space-y-2">
                      <h4 className="text-sm font-semibold text-fg group-hover:text-accent-link truncate">
                        {sim.name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-fg-subtle">
                        <span className="flex items-center text-star font-semibold tabular-nums">
                          <Star className="w-3 h-3 fill-star text-star mr-1" />
                          {(sim.bayesianRating || sim.avgRating || 0).toFixed(1)}
                        </span>
                        <span>•</span>
                        <span>{sim.reviewCount} reviews</span>
                      </div>
                      <p className="text-xs text-fg-subtle truncate">{sim.address}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="mt-6 space-y-4">
          {place.reviews.length === 0 ? (
            <div className="p-12 text-center rounded-[28px] bg-surface space-y-3 border-0">
              <Star className="w-10 h-10 text-fg-subtle mx-auto" />
              <h3 className="text-base font-semibold text-fg">No verified reviews yet</h3>
              <p className="text-xs text-fg-muted max-w-sm mx-auto">
                Be the first Pune resident or student to rate this venue with GPS verification.
              </p>
              <Button
                onClick={() =>
                  openRateModal({
                    id: place.id,
                    name: place.name,
                    category: place.category,
                    address: place.address,
                    latitude: place.latitude,
                    longitude: place.longitude,
                  })
                }
                className="mt-2 inline-flex items-center justify-center min-h-[44px] px-6 rounded-full liquid-glass-btn text-[14px] font-semibold cursor-pointer"
              >
                Write First Review
              </Button>
            </div>
          ) : (
            place.reviews.map((rev) => {
              const badge = getTrustBadge(rev.user?.trustScore ?? 30)
              const votes = likedReviews[rev.id] || 0

              return (
                <div
                  key={rev.id}
                  className="p-5 rounded-[22px] bg-surface space-y-3 border-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center font-semibold text-sm text-accent-link">
                        {rev.user?.displayName ? rev.user.displayName[0].toUpperCase() : "U"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-fg">
                            {rev.user?.displayName || "Pune Student"}
                          </h4>
                          <span className={`inline-flex h-6 px-2.5 items-center rounded-full text-[11px] font-medium ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-fg-subtle">
                          <div className="flex items-center text-star">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < rev.rating ? "fill-star text-star" : "text-surface-3"}`}
                              />
                            ))}
                          </div>
                          <span>•</span>
                          <span>{new Date(rev.publishDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {rev.checkinVerified && (
                      <span className="inline-flex h-6 px-2.5 items-center gap-1 rounded-full text-[11px] font-medium text-success bg-success/10">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        GPS Verified
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-fg-muted leading-relaxed">
                    {rev.text || "(No written comment provided)"}
                  </p>

                  {/* Photo Thumbnails */}
                  {rev.photoUrls && rev.photoUrls.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 pt-1">
                      {rev.photoUrls.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt="Review attachment"
                          className="w-20 h-20 object-cover rounded-[14px]"
                        />
                      ))}
                    </div>
                  )}

                  {/* Tags */}
                  {rev.tags && rev.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {rev.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="inline-flex h-6 px-2.5 items-center rounded-full text-[11px] font-medium text-fg-muted bg-surface-2"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Business Response */}
                  {rev.bizReply && (
                    <div className="p-3.5 rounded-[14px] bg-surface-2 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-accent-link">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Business Owner Reply</span>
                      </div>
                      <p className="text-fg-muted leading-relaxed">{rev.bizReply.text}</p>
                    </div>
                  )}

                  {/* Helpful Vote Button */}
                  <div className="pt-2 border-t border-hairline/[0.08] flex items-center justify-between text-xs">
                    <button
                      onClick={() => handleHelpfulClick(rev.id)}
                      className={`h-9 px-4 rounded-full text-[12px] font-medium inline-flex items-center gap-1.5 transition-[background-color,transform] duration-150 apple-press apple-focus ${
                        hasVoted[rev.id]
                          ? "bg-accent-link/[0.12] text-accent-link"
                          : "bg-surface-2 text-fg-muted hover:text-fg"
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Helpful</span>
                      {votes > 0 && <span className="tabular-nums font-semibold">({votes})</span>}
                    </button>
                    <span className="text-[10px] text-fg-subtle font-mono">
                      Trust score feedback active
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {place.imageUrl && (
              <div className="aspect-square rounded-[22px] overflow-hidden bg-surface-2">
                <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover" />
              </div>
            )}
            {place.reviews.flatMap((r) => r.photoUrls).map((url, index) => (
              <div key={index} className="aspect-square rounded-[22px] overflow-hidden bg-surface-2">
                <img src={url} alt={`Place upload ${index + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
            {!place.imageUrl && place.reviews.flatMap((r) => r.photoUrls).length === 0 && (
              <div className="col-span-full py-16 text-center text-fg-muted rounded-[28px] bg-surface border-0">
                No user photos uploaded yet. Upload one during review to earn the EXIF Photo Badge!
              </div>
            )}
          </div>
        </TabsContent>

        {/* Location & Info Tab */}
        <TabsContent value="info" className="mt-6">
          <div className="p-6 rounded-[22px] bg-surface space-y-4 text-xs sm:text-sm border-0">
            <div>
              <h4 className="font-semibold text-fg mb-1">Physical Address</h4>
              <p className="text-fg-muted">{place.address}, {place.city}</p>
            </div>
            <div>
              <h4 className="font-semibold text-fg mb-1">GPS Coordinates</h4>
              <p className="text-fg-subtle font-mono text-xs">
                Latitude: {place.latitude.toFixed(6)}, Longitude: {place.longitude.toFixed(6)}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-fg mb-1">Category & Price Range</h4>
              <p className="text-fg-muted">{place.category.replace("_", " ")} • {place.priceRange || "Not specified"}</p>
            </div>
            <div>
              <h4 className="font-semibold text-fg mb-1">IT Act Section 79 & Grievance Notice</h4>
              <p className="text-fg-subtle leading-relaxed text-xs">
                RateIT acts solely as an intermediary under the Information Technology Act, 2000. All reviews reflect independent opinions of verified users. For grievance appeals or incorrect listing claims, submit a formal request via the Grievance Desk.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Save to List Modal */}
      {showSaveModal && (
        <SaveToListsModal
          onClose={() => setShowSaveModal(false)}
          placeId={place.id}
          placeName={place.name}
        />
      )}
    </div>
  )
}
