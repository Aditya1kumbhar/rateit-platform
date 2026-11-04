"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Star,
  MapPin,
  Camera,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  X,
  Loader2,
  Shield,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  Globe,
} from "lucide-react"
import { getCurrentPosition, isWithinGeofence, formatDistance } from "@/lib/geolocation"
import type { Coordinates } from "@/lib/geolocation"
import { extractExifData, type ExifData } from "@/lib/exif"
import { toast } from "sonner"

interface EnhancedRateModalProps {
  onClose: () => void
  // Optional: pre-selected place for direct rating
  preSelectedPlace?: {
    id: string
    name: string
    category: string
    latitude: number
    longitude: number
  }
}

interface PlaceOption {
  id: string
  name: string
  category: string
  address: string
  latitude: number
  longitude: number
}

type Step = "search" | "checkin" | "blind-rating" | "review" | "confirm"

export function EnhancedRateModal({ onClose, preSelectedPlace }: EnhancedRateModalProps) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    import("@/lib/userAuth").then(({ userSession }) => {
      userSession.isLoggedIn().then((loggedIn) => {
        if (!loggedIn) {
          onClose()
          router.push(`/login?reason=rate&redirect=${encodeURIComponent(window.location.pathname)}`)
        } else {
          setIsAuthenticated(true)
        }
      })
    })
  }, [router, onClose])

  // Apple UX: Escape key dismisses modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  // Step management
  const [currentStep, setCurrentStep] = useState<Step>(preSelectedPlace ? "checkin" : "search")

  // Step 1: Place selection
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPlace, setSelectedPlace] = useState(preSelectedPlace || null)

  // Step 2: Check-in
  const [isLocating, setIsLocating] = useState(false)
  const [userCoords, setUserCoords] = useState<Coordinates | null>(null)
  const [checkinStatus, setCheckinStatus] = useState<"pending" | "verified" | "unverified" | "error">("pending")
  const [checkinDistance, setCheckinDistance] = useState<number | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)

  // Step 3: Blind rating
  const [rating, setRating] = useState(0)
  const [hasSubmittedBlindRating, setHasSubmittedBlindRating] = useState(false)
  const [showOtherRatings, setShowOtherRatings] = useState(false)

  // Step 4: Review details
  const [reviewText, setReviewText] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([])
  const [photoExifResults, setPhotoExifResults] = useState<ExifData[]>([])
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC")
  const [consentChecked, setConsentChecked] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Live place search
  const [livePlaces, setLivePlaces] = useState<PlaceOption[]>([])
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false)

  useEffect(() => {
    let active = true
    const fetchPlaces = async () => {
      setIsSearchingPlaces(true)
      try {
        const queryParam = searchQuery.trim() ? `?search=${encodeURIComponent(searchQuery)}&take=15` : `?take=15`
        const res = await fetch(`/api/places${queryParam}`)
        if (res.ok) {
          const json = await res.json()
          if (active && json.data) {
            setLivePlaces(json.data)
          }
        }
      } catch (err) {
        console.error("Failed to search places:", err)
      } finally {
        if (active) setIsSearchingPlaces(false)
      }
    }

    const timer = setTimeout(fetchPlaces, 250)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [searchQuery])

  const categoryLabels: Record<string, string> = {
    COACHING: "Coaching",
    PG_HOSTEL: "PG / Hostel",
    LOCAL_SERVICE: "Local Service",
    RESTAURANT: "Restaurant",
    CAFE: "Café",
  }

  // STEP 2: Geofence Check-In
  const handleCheckin = useCallback(async () => {
    if (!selectedPlace) return
    setIsLocating(true)
    setLocationError(null)

    const result = await getCurrentPosition()

    if (!result.success || !result.coordinates) {
      setCheckinStatus("error")
      setLocationError(result.error || "Unable to retrieve GPS coordinates")
      setIsLocating(false)
      return
    }

    setUserCoords(result.coordinates)

    const geofenceResult = isWithinGeofence(
      result.coordinates.latitude,
      result.coordinates.longitude,
      selectedPlace.latitude,
      selectedPlace.longitude,
      100
    )
    setCheckinDistance(geofenceResult.distanceMeters)

    if (geofenceResult.verified) {
      setCheckinStatus("verified")
      toast.success("GPS Location verified! You are on-site.")
    } else {
      setCheckinStatus("unverified")
      toast.info(`You are ${formatDistance(geofenceResult.distanceMeters)} away from this venue.`)
    }

    setIsLocating(false)
  }, [selectedPlace])

  // STEP 3: Blind Rating
  const handleBlindRatingSubmit = () => {
    if (rating === 0) return
    setHasSubmittedBlindRating(true)
    setShowOtherRatings(true)
    toast.success("Blind rating recorded! Revealing community ratings...")
  }

  // STEP 4: Review Details
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const getTagsForCategory = (category: string): string[] => {
    switch (category) {
      case "COACHING":
        return ["Good Faculty", "Doubt Sessions", "Small Batches", "Library Access", "Study Material", "Strict Discipline"]
      case "PG_HOSTEL":
        return ["24/7 Water", "High-speed WiFi", "Good Food / Mess", "Biometric Entry", "Clean Washrooms", "Quiet Environment"]
      case "CAFE":
        return ["Study Friendly", "Great Coffee", "Good WiFi", "Power Sockets", "Outdoor Seating", "Bun Maska"]
      case "RESTAURANT":
        return ["Unlimited Thali", "Student Budget", "Quick Service", "Hygienic", "Iconic Taste"]
      default:
        return ["Quick Service", "Fair Pricing", "Helpful Staff", "Clean Space", "Recommended"]
    }
  }

  // FINAL SUBMISSION
  const handleSubmit = async () => {
    if (!selectedPlace || rating === 0 || !consentChecked) return

    const reviewData = {
      placeId: selectedPlace.id,
      rating,
      text: reviewText.trim() || undefined,
      tags: selectedTags,
      checkinLat: userCoords?.latitude,
      checkinLng: userCoords?.longitude,
      checkinVerified: checkinStatus === "verified",
      consentGiven: consentChecked,
      photoExifData: photoExifResults.length > 0 ? photoExifResults : undefined,
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewData),
      })

      if (response.status === 401) {
        toast.error("Please sign in to publish a verified review.")
        router.push(`/login?reason=rate&redirect=${encodeURIComponent(window.location.pathname)}`)
        onClose()
        return
      }

      const result = await response.json()
      if (result.success) {
        toast.success("Review published! Bayesian score recomputed.")
        onClose()
        router.refresh()
      } else {
        toast.error(result.error || "Failed to submit review.")
      }
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Step navigation
  const steps: Step[] = ["search", "checkin", "blind-rating", "review", "confirm"]
  const currentStepIndex = steps.indexOf(currentStep)
  const stepLabels: Record<Step, string> = {
    search: "Select Place",
    checkin: "GPS Check-In",
    "blind-rating": "Blind Rating",
    review: "Write Details",
    confirm: "Confirm & Post",
  }

  const goNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex])
    }
  }

  const goBack = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex])
    }
  }

  if (isAuthenticated === null) {
    return (
      <div className="fixed inset-0 bg-black/25 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-surface border border-hairline/[0.08] rounded-[28px] w-full max-w-sm p-8 flex flex-col items-center justify-center shadow-[0_24px_70px_rgba(0,0,0,0.12)] text-fg animate-in fade-in-0 zoom-in-95 duration-200 ease-out origin-center">
          <Loader2 className="h-8 w-8 text-accent-link animate-spin mb-4" />
          <p className="text-sm font-medium text-fg-muted">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-0 bg-black/25 backdrop-blur-md flex items-center justify-center z-50 p-4"
    >
      <div className="bg-surface border border-hairline/[0.08] rounded-[28px] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[0_24px_70px_rgba(0,0,0,0.12)] relative text-fg animate-in fade-in-0 zoom-in-95 duration-200 ease-out origin-center">
        {/* Header */}
        <div className="sticky top-0 bg-surface/95 backdrop-blur-2xl border-b border-hairline/[0.08] p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={goBack}
                aria-label="Previous step"
                className="p-2 hover:bg-surface-2 rounded-full transition-colors text-fg-subtle hover:text-fg apple-press min-h-[44px] min-w-[44px] flex items-center justify-center apple-focus"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <h2 className="text-base font-semibold text-fg tracking-tight">{stepLabels[currentStep]}</h2>
              <p className="text-xs text-fg-subtle tabular-nums">
                Step {currentStepIndex + 1} of {steps.length}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 hover:bg-surface-2 rounded-full transition-colors text-fg-subtle hover:text-fg apple-press min-h-[44px] min-w-[44px] flex items-center justify-center apple-focus"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress bar (full-width bg-surface-3 h-1 rounded-full track) */}
        <div className="w-full bg-surface-3 h-1 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent origin-left transition-transform duration-200 ease-out"
            style={{ transform: `scaleX(${(currentStepIndex + 1) / steps.length})` }}
          />
        </div>

        <div className="p-6">
          {/* STEP 1: Search/Select Place */}
          {currentStep === "search" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-accent-link pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search coaching class, PG, café on FC Road or Kothrud..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 w-full pl-10 pr-4 rounded-[14px] bg-surface-2 border border-hairline/[0.08] text-[14px] text-fg placeholder:text-fg-subtle focus-visible:border-accent-link focus-visible:ring-2 focus-visible:ring-accent-link/30 outline-none transition-[border-color,box-shadow] duration-150"
                />
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {livePlaces.map((place) => (
                  <button
                    key={place.id}
                    onClick={() => {
                      setSelectedPlace(place as any)
                      goNext()
                    }}
                    className={`w-full text-left p-4 rounded-[22px] transition-[background-color,transform] duration-150 apple-press apple-focus ${
                      selectedPlace?.id === place.id
                        ? "bg-accent-link/[0.12] text-fg"
                        : "bg-surface-2 hover:bg-surface-3 text-fg"
                    }`}
                  >
                    <div className="font-semibold text-fg text-sm">{place.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] px-2.5 py-0.5 bg-surface-3 text-accent-link rounded-full font-medium">
                        {categoryLabels[place.category] || place.category}
                      </span>
                      <span className="text-xs text-fg-subtle truncate">{place.address}</span>
                    </div>
                  </button>
                ))}
              </div>

              {livePlaces.length === 0 && !isSearchingPlaces && (
                <div className="text-center py-10">
                  <MapPin className="h-8 w-8 text-fg-subtle mx-auto mb-2" />
                  <p className="text-sm text-fg">No Pune places found.</p>
                  <p className="text-xs text-fg-subtle mt-1">Try typing &ldquo;IIT JEE&rdquo;, &ldquo;Good Luck&rdquo;, or &ldquo;Kothrud&rdquo;</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Geofence Check-In */}
          {currentStep === "checkin" && selectedPlace && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-surface-2 text-accent-link rounded-[18px] flex items-center justify-center mx-auto">
                  <MapPin className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-fg text-lg">{selectedPlace.name}</h3>
                <p className="text-xs text-fg-muted max-w-sm mx-auto">
                  Verify you are at or have visited this location. Reviews posted on-site receive a Verified Check-in Badge.
                </p>
              </div>

              {checkinStatus === "pending" && (
                <div className="space-y-3">
                  <Button
                    onClick={handleCheckin}
                    disabled={isLocating}
                    className="w-full min-h-[44px] px-6 rounded-full liquid-glass-btn text-[14px] font-semibold"
                  >
                    {isLocating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Acquiring GPS coordinates...
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4 mr-2" />
                        Verify My Location (GPS Geofence)
                      </>
                    )}
                  </Button>
                  <button
                    onClick={() => {
                      setCheckinStatus("unverified")
                    }}
                    className="w-full text-xs text-fg-subtle hover:text-fg transition-colors text-center apple-focus py-1"
                  >
                    Skip location verification (Submit as off-site) &rarr;
                  </button>
                </div>
              )}

              {checkinStatus === "verified" && (
                <div className="bg-success/10 rounded-[22px] p-4 text-center space-y-2">
                  <CheckCircle className="h-8 w-8 text-success mx-auto" />
                  <p className="font-semibold text-success text-sm">Location Verified On-Site</p>
                  <p className="text-xs text-fg-muted">
                    You are {formatDistance(checkinDistance!)} away: well inside the physical check-in radius.
                  </p>
                  <Button
                    onClick={goNext}
                    className="w-full mt-3 min-h-[44px] px-6 rounded-full liquid-glass-btn text-[14px] font-semibold"
                  >
                    Proceed to Rating &rarr;
                  </Button>
                </div>
              )}

              {checkinStatus === "unverified" && (
                <div className="bg-warning/10 rounded-[22px] p-4 text-center space-y-2">
                  <AlertTriangle className="h-8 w-8 text-warning mx-auto" />
                  <p className="font-semibold text-warning text-sm">Off-site / Distance Mismatch</p>
                  <p className="text-xs text-fg-muted">
                    You appear to be {checkinDistance ? formatDistance(checkinDistance) : "away from the venue"}. Your review will carry standard community trust.
                  </p>
                  <Button
                    onClick={goNext}
                    className="w-full mt-3 min-h-[44px] px-6 rounded-full liquid-glass-btn text-[14px] font-semibold"
                  >
                    Continue to Rating &rarr;
                  </Button>
                </div>
              )}

              {checkinStatus === "error" && (
                <div className="bg-danger/10 rounded-[22px] p-4 text-center space-y-2">
                  <AlertTriangle className="h-8 w-8 text-danger mx-auto" />
                  <p className="font-semibold text-danger text-sm">Location Access Unavailable</p>
                  <p className="text-xs text-fg-muted">{locationError}</p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={handleCheckin}
                      variant="outline"
                      size="sm"
                      className="flex-1 min-h-[44px] rounded-full bg-surface-2 hover:bg-surface-3 text-fg text-xs font-semibold border-0 apple-focus apple-press"
                    >
                      Retry GPS
                    </Button>
                    <Button
                      onClick={() => {
                        setCheckinStatus("unverified")
                        goNext()
                      }}
                      size="sm"
                      className="flex-1 min-h-[44px] rounded-full liquid-glass-btn text-xs font-semibold"
                    >
                      Skip & Rate
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Blind Rating */}
          {currentStep === "blind-rating" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  {showOtherRatings ? (
                    <Eye className="h-4 w-4 text-accent-link" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-accent-link" />
                  )}
                  <span className="text-xs text-accent-link uppercase tracking-wider font-semibold">
                    {showOtherRatings ? "Ratings Unveiled" : "Blind Rating System"}
                  </span>
                </div>
                <p className="text-xs text-fg-muted max-w-sm mx-auto">
                  {showOtherRatings
                    ? "Your unbiased opinion has been recorded. Here is how others rated:"
                    : "Rate before seeing aggregate scores to eradicate peer-anchoring bias."}
                </p>
              </div>

              {/* Star Rating Selection */}
              <div className="text-center py-2">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-11 w-11 cursor-pointer transition-transform duration-150 ${
                        star <= rating
                          ? "fill-star text-star scale-105"
                          : "text-fg-subtle hover:text-fg"
                      } ${hasSubmittedBlindRating ? "pointer-events-none" : ""}`}
                      onClick={() => !hasSubmittedBlindRating && setRating(star)}
                    />
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-base font-semibold text-fg tabular-nums">
                    {rating} / 5
                    <span className="text-xs font-medium text-fg-muted ml-2">
                      {rating <= 2 ? "Needs Improvement" : rating <= 3 ? "Decent" : rating <= 4 ? "Very Good" : "Outstanding"}
                    </span>
                  </p>
                )}
              </div>

              {!hasSubmittedBlindRating ? (
                <Button
                  onClick={handleBlindRatingSubmit}
                  disabled={rating === 0}
                  className="w-full min-h-[44px] px-6 rounded-full liquid-glass-btn text-[14px] font-semibold disabled:opacity-40"
                >
                  Lock In My Blind Rating
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-[22px] bg-surface-2 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-fg-muted">Pune Aggregate Rating:</span>
                      <span className="text-star font-semibold tabular-nums flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-star text-star" /> 4.4 / 5
                      </span>
                    </div>
                    <p className="text-[11px] text-fg-subtle">
                      Your rating will be incorporated into the Bayesian shrinkage aggregate.
                    </p>
                  </div>
                  <Button
                    onClick={goNext}
                    className="w-full min-h-[44px] px-6 rounded-full liquid-glass-btn text-[14px] font-semibold"
                  >
                    Add Review Details &rarr;
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Write Review */}
          {currentStep === "review" && selectedPlace && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Text review */}
              <div>
                <label className="text-xs font-semibold text-fg mb-1.5 block">
                  Detailed Experience (Optional)
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share details on faculty, study environment, WiFi, or food..."
                  className="w-full h-28 p-3.5 bg-surface-2 border border-hairline/[0.08] rounded-[14px] text-fg placeholder:text-fg-subtle resize-none focus-visible:border-accent-link focus-visible:ring-2 focus-visible:ring-accent-link/30 outline-none text-xs leading-relaxed"
                />
                <p className="text-[11px] text-fg-subtle mt-1 tabular-nums">
                  {reviewText.length}/500 characters
                </p>
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs font-semibold text-fg mb-1.5 block">
                  Key Experience Tags
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {getTagsForCategory((selectedPlace as any).category || "").map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-[background-color,color] duration-150 apple-press apple-focus ${
                        selectedTags.includes(tag)
                          ? "bg-accent text-stone-950 font-bold"
                          : "bg-surface-2 text-fg-muted hover:text-fg"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo Upload with EXIF Extraction */}
              <div>
                <label className="text-xs font-semibold text-fg mb-1.5 block">
                  Photo Evidence (Optional EXIF GPS Verification)
                </label>
                <label className="flex items-center justify-center gap-2 py-3 px-4 bg-surface-2 border border-dashed border-hairline/[0.12] rounded-[14px] cursor-pointer hover:bg-surface-3 transition-colors apple-focus">
                  <Camera className="h-4 w-4 text-accent-link" />
                  <span className="text-xs text-fg-muted">Upload on-site photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      if (e.target.files) {
                        const files = Array.from(e.target.files).slice(0, 5)
                        setUploadedPhotos(files)
                        try {
                          const extracted = await Promise.all(
                            files.map((file) => extractExifData(file))
                          )
                          setPhotoExifResults(extracted)
                          toast.success("Analyzed photo EXIF metadata")
                        } catch (err) {
                          console.warn("EXIF extraction failed:", err)
                        }
                      }
                    }}
                  />
                </label>
                {uploadedPhotos.length > 0 && (
                  <div className="mt-2 text-xs text-success flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" />
                    <span>
                      {uploadedPhotos.length} photo(s) selected
                      {photoExifResults.some((e) => e.hasGps) && " • GPS metadata verified"}
                    </span>
                  </div>
                )}
              </div>

              {/* Visibility */}
              <div>
                <label className="text-xs font-semibold text-fg mb-1.5 block">Visibility</label>
                <div className="flex gap-2">
                  {(["PUBLIC", "PRIVATE"] as const).map((vis) => (
                    <button
                      key={vis}
                      type="button"
                      onClick={() => setVisibility(vis)}
                      className={`flex-1 min-h-[40px] py-2 px-3 rounded-full text-xs font-semibold transition-[background-color,color] duration-150 apple-focus apple-press ${
                        visibility === vis
                          ? "bg-accent text-stone-950 font-bold"
                          : "bg-surface-2 text-fg-muted hover:text-fg"
                      }`}
                    >
                      {vis === "PUBLIC" ? "Public Review" : "Private Note"}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={goNext}
                className="w-full min-h-[44px] px-6 rounded-full liquid-glass-btn text-[14px] font-semibold"
              >
                Review & Confirm &rarr;
              </Button>
            </div>
          )}

          {/* STEP 5: Confirm & Submit */}
          {currentStep === "confirm" && selectedPlace && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Review Summary */}
              <div className="p-4 rounded-[22px] bg-surface-2 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-fg-subtle">Spot:</span>
                  <span className="font-semibold text-fg">{selectedPlace.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-fg-subtle">Your Rating:</span>
                  <div className="flex items-center text-star font-semibold tabular-nums">
                    <Star className="w-3.5 h-3.5 fill-star text-star mr-1" />
                    {rating}.0 / 5
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-fg-subtle">GPS Check-in:</span>
                  <span className={checkinStatus === "verified" ? "text-success font-semibold" : "text-warning font-semibold"}>
                    {checkinStatus === "verified" ? "Geofence Verified" : "Off-site / Skipped"}
                  </span>
                </div>
                {reviewText && (
                  <div className="pt-2 border-t border-hairline/[0.08] text-fg-muted italic">
                    &ldquo;{reviewText}&rdquo;
                  </div>
                )}
              </div>

              {/* DPDP Act 2023 Consent Notice */}
              <div className="p-3.5 rounded-[18px] bg-surface-2 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-accent-link">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Indian DPDP Act 2023 Consent</span>
                </div>
                <p className="text-fg-muted text-[11px] leading-relaxed">
                  Location data is used solely for geofence validation. Photo EXIF metadata is stripped after fraud check. You can request data erasure at any time in Profile.
                </p>
              </div>

              {/* Consent Checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-hairline text-accent focus:ring-accent-link bg-surface-2"
                />
                <span className="text-xs text-fg-muted leading-relaxed">
                  I confirm this review is based on my genuine first-hand experience at this venue, and I consent to RateIT processing this review.
                </span>
              </label>

              {/* Publish Button */}
              <Button
                onClick={handleSubmit}
                disabled={!consentChecked || isSubmitting}
                className="w-full min-h-[44px] px-6 rounded-full liquid-glass-btn text-[14px] font-semibold disabled:opacity-40"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publishing Verified Review...
                  </>
                ) : (
                  "Publish Verified Review"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
