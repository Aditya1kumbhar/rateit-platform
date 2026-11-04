"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Star,
  MapPin,
  ShieldCheck,
  Edit3,
  Bookmark,
  Sparkles,
  Camera,
  Trash2,
  Lock,
  Globe,
  Share2,
  AlertTriangle,
  X,
  ChevronRight,
  LogOut,
  Shield,
  CheckCircle2,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { userSession } from "@/lib/userAuth"
import { toast } from "sonner"
import { useUI } from "@/components/ui-provider"
import { getGlassLevel, setGlassLevel } from "@/lib/glass"

export default function ProfilePage() {
  const router = useRouter()
  const { openRateModal } = useUI()
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"grid" | "saved" | "badges">("grid")

  // iOS 27 Liquid Glass Intensity State
  const [glassLevel, setGlassLevelState] = useState(0.5)

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false)
  const [editName, setEditName] = useState("")
  const [editBio, setEditBio] = useState("")
  const [editAvatar, setEditAvatar] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Data Erasure State (DPDP Act 2023)
  const [isDeletingData, setIsDeletingData] = useState(false)

  useEffect(() => {
    let active = true
    setGlassLevelState(getGlassLevel())

    const loadProfile = async () => {
      const loggedIn = await userSession.isLoggedIn()
      if (!loggedIn) {
        router.push("/login?reason=profile&redirect=/profile")
        return
      }

      try {
        const res = await fetch("/api/profile")
        if (res.ok) {
          const data = await res.json()
          if (active) {
            setProfile(data)
            setEditName(data.displayName || "")
            setEditBio(data.bio || "")
            setEditAvatar(data.avatarUrl || "")
          }
        }
      } catch (err) {
        console.warn("Could not load profile:", err)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [router])

  const handleLogout = async () => {
    await userSession.clearUser()
    toast.success("Signed out successfully")
    router.push("/")
  }

  const handleShareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: `${profile?.displayName || "Reviewer"}: RateIT Pune Profile`,
        text: `Check out verified Pune reviews by ${profile?.displayName || "this reviewer"}.`,
        url: window.location.href,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Profile link copied to clipboard")
    }
  }

  const handleGlassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setGlassLevelState(val)
    setGlassLevel(val)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: editName.trim(),
          bio: editBio.trim(),
          avatarUrl: editAvatar.trim() || null,
        }),
      })

      if (res.ok) {
        const updated = await res.json()
        setProfile((prev: any) => ({
          ...prev,
          displayName: updated.displayName,
          bio: updated.bio,
          avatarUrl: updated.avatarUrl,
        }))
        setShowEditModal(false)
        toast.success("Profile updated successfully")
      } else {
        toast.error("Failed to update profile")
      }
    } catch {
      toast.error("Network error while updating profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeletePersonalData = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently withdraw your consent and erase your personal data under the Indian DPDP Act 2023? This will purge your profile, saved lists, and telemetry records."
    )
    if (!confirmDelete) return

    setIsDeletingData(true)
    try {
      const res = await fetch("/api/profile", {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success("Personal data and consent erased under DPDP Act 2023")
        await userSession.clearUser()
        router.push("/")
      } else {
        toast.error("Failed to erase data. Please contact the Grievance Officer.")
      }
    } catch {
      toast.error("Network error during data erasure")
    } finally {
      setIsDeletingData(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-5 w-5 rounded-full border-2 border-accent-link border-t-transparent animate-spin mx-auto" />
          <p className="text-fg-muted text-sm font-medium">Loading RateIT Profile...</p>
        </div>
      </div>
    )
  }

  const initials = profile?.displayName
    ? profile.displayName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "IT"

  const trustScore = profile?.trustScore || 85
  const trustTier =
    trustScore >= 75
      ? { label: "Trusted Resident", color: "text-success bg-success/10" }
      : trustScore >= 40
      ? { label: "Verified Visitor", color: "text-accent-link bg-accent-link/[0.12]" }
      : { label: "Community Member", color: "text-fg-muted bg-surface-2" }

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-fg-subtle">
        <Link href="/" className="hover:text-fg transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-fg-subtle" />
        <span className="text-fg font-medium">My Profile</span>
      </nav>

      {/* Profile Header Card */}
      <div className="p-6 md:p-8 rounded-[28px] bg-surface border-0 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
            {/* Avatar */}
            <div
              className="relative group cursor-pointer apple-press"
              onClick={() => setShowEditModal(true)}
            >
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[22px] overflow-hidden bg-surface-2 flex items-center justify-center">
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl font-semibold text-accent-link">
                    {initials}
                  </span>
                )}
              </div>
              <div className="absolute bottom-0 right-0 bg-accent text-stone-950 p-2 rounded-full shadow-sm">
                <Camera className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Info */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-semibold text-fg tracking-[-0.022em]">
                  {profile?.displayName || "RateIT User"}
                </h1>
                <span className={`inline-flex h-6 px-2.5 items-center rounded-full text-[11px] font-medium ${trustTier.color}`}>
                  {trustTier.label}
                </span>
                {profile?.phoneVerified && (
                  <span className="inline-flex h-6 px-2.5 items-center gap-1 rounded-full text-[11px] font-medium text-success bg-success/10">
                    <ShieldCheck className="w-3 h-3" /> Phone Verified
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-fg-muted max-w-md leading-relaxed">
                {profile?.bio || "Verified Pune student and community reviewer on RateIT."}
              </p>

              {/* Stats Bar */}
              <div className="flex items-center justify-center md:justify-start gap-4 pt-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-fg tabular-nums">{profile?.reviewsCount || 0}</span>
                  <span className="text-fg-subtle">Reviews</span>
                </div>
                <span className="text-fg-subtle">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-fg tabular-nums">{profile?.listsCount || 0}</span>
                  <span className="text-fg-subtle">Lists</span>
                </div>
                <span className="text-fg-subtle">•</span>
                <div className="flex items-center gap-1.5 text-star font-semibold tabular-nums">
                  <Star className="w-3.5 h-3.5 fill-star text-star" />
                  <span>{trustScore.toFixed(0)}</span>
                  <span className="text-fg-subtle font-normal">Trust Score</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap md:flex-col items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={() => setShowEditModal(true)}
              className="flex-1 md:flex-initial min-h-[44px] px-5 rounded-full bg-surface-2 hover:bg-surface-3 text-fg text-[14px] font-medium flex items-center justify-center gap-2 transition-[background-color,transform] duration-150 apple-press apple-focus"
            >
              <Edit3 className="w-3.5 h-3.5 text-accent-link" />
              <span>Edit Profile</span>
            </button>
            <button
              onClick={handleShareProfile}
              className="flex-1 md:flex-initial min-h-[44px] px-5 rounded-full bg-surface-2 hover:bg-surface-3 text-fg text-[14px] font-medium flex items-center justify-center gap-2 transition-[background-color,transform] duration-150 apple-press apple-focus"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 md:flex-initial min-h-[44px] px-5 rounded-full bg-surface-2 hover:bg-danger/10 text-fg-subtle hover:text-danger text-[14px] font-medium flex items-center justify-center gap-2 transition-[background-color,color,transform] duration-150 apple-press apple-focus"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-hairline/[0.08] pb-3 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("grid")}
            className={`h-9 px-4 rounded-full text-[12px] font-semibold transition-colors apple-focus ${
              activeTab === "grid"
                ? "bg-accent text-stone-950 shadow-sm"
                : "bg-surface-2 text-fg-muted hover:text-fg"
            }`}
          >
            My Reviews ({profile?.reviewsCount || 0})
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={`h-9 px-4 rounded-full text-[12px] font-semibold transition-colors apple-focus ${
              activeTab === "saved"
                ? "bg-accent text-stone-950 shadow-sm"
                : "bg-surface-2 text-fg-muted hover:text-fg"
            }`}
          >
            Saved Collections ({profile?.listsCount || 0})
          </button>
          <button
            onClick={() => setActiveTab("badges")}
            className={`h-9 px-4 rounded-full text-[12px] font-semibold transition-colors apple-focus ${
              activeTab === "badges"
                ? "bg-accent text-stone-950 shadow-sm"
                : "bg-surface-2 text-fg-muted hover:text-fg"
            }`}
          >
            Trust & DPDP Privacy
          </button>
        </div>

        {/* TAB 1: REVIEWS */}
        {activeTab === "grid" && (
          <div className="space-y-4">
            {profile?.reviews && profile.reviews.length > 0 ? (
              profile.reviews.map((rev: any) => (
                <div
                  key={rev.id}
                  className="p-5 rounded-[22px] bg-surface space-y-3 border-0"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-fg tracking-[-0.022em]">{rev.place?.name}</h4>
                      <p className="text-xs text-fg-subtle flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-fg-subtle" />
                        {rev.place?.address}
                      </p>
                    </div>
                    <div className="flex items-center text-star font-semibold text-xs tabular-nums">
                      <Star className="w-3.5 h-3.5 fill-star text-star mr-1" />
                      {rev.rating}.0
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-fg-muted leading-relaxed">
                    &ldquo;{rev.text}&rdquo;
                  </p>

                  <div className="pt-2 border-t border-hairline/[0.08] flex items-center justify-between text-xs text-fg-subtle">
                    <span>{new Date(rev.publishDate).toLocaleDateString()}</span>
                    {rev.checkinVerified && (
                      <span className="text-success font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> GPS Verified
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center rounded-[28px] bg-surface space-y-3 border-0">
                <Star className="w-10 h-10 text-fg-subtle mx-auto" />
                <h3 className="text-base font-semibold text-fg">No reviews posted yet</h3>
                <p className="text-xs text-fg-muted max-w-sm mx-auto">
                  Help fellow students in Pune by sharing your first verified review of a cafe, coaching institute, or PG.
                </p>
                <Button
                  onClick={() => openRateModal()}
                  className="mt-2 inline-flex items-center justify-center min-h-[44px] px-6 rounded-full liquid-glass-btn text-[14px] font-semibold cursor-pointer"
                >
                  Write First Review
                </Button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SAVED LISTS */}
        {activeTab === "saved" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-fg">Your Collections</h3>
              <Link
                href="/lists"
                className="text-xs text-accent-link hover:underline font-semibold"
              >
                Manage all lists &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profile?.lists && profile.lists.length > 0 ? (
                profile.lists.map((l: any) => (
                  <div
                    key={l.id}
                    className="p-5 rounded-[22px] bg-surface hover:bg-surface-2 transition-[background-color,transform] duration-150 space-y-2 border-0 apple-press"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-fg">{l.name}</h4>
                      {l.isPrivate ? (
                        <Lock className="w-3.5 h-3.5 text-fg-subtle" />
                      ) : (
                        <Globe className="w-3.5 h-3.5 text-success" />
                      )}
                    </div>
                    <p className="text-xs text-fg-muted">{l.description || "Curated Pune list"}</p>
                    <p className="text-xs text-accent-link font-semibold pt-2">
                      {l.items?.length || 0} spots saved
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-fg-muted rounded-[28px] bg-surface border-0">
                  No saved collections yet. Visit <Link href="/lists" className="text-accent-link underline">Lists</Link> to create one.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: TRUST & DPDP PRIVACY */}
        {activeTab === "badges" && (
          <div className="space-y-6">
            {/* Trust Engine Card */}
            <div className="p-6 rounded-[22px] bg-surface space-y-4 border-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-[14px] bg-accent-link/[0.12] text-accent-link flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-fg">Trust Engine Score</h4>
                    <p className="text-xs text-fg-muted">
                      Calculated from physical GPS check-ins, helpful votes (+1), and anti-fraud heuristics.
                    </p>
                  </div>
                </div>
                <div className="text-3xl font-semibold text-accent-link tabular-nums">
                  {trustScore.toFixed(0)} <span className="text-xs text-fg-subtle font-normal">/ 100</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-surface-2 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full bg-accent transition-transform duration-500 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, trustScore))}%` }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3.5 rounded-[14px] bg-surface-2 space-y-1 border-0">
                  <span className="font-semibold text-success flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> IS 19000:2022 Compliant
                  </span>
                  <p className="text-fg-muted">Verifiable reviewer identity without invasive biometric KYC.</p>
                </div>
                <div className="p-3.5 rounded-[14px] bg-surface-2 space-y-1 border-0">
                  <span className="font-semibold text-accent-link flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" /> DPDP Act 2023 Enforced
                  </span>
                  <p className="text-fg-muted">Hardware EXIF stripped. Explicit consent withdrawal supported below.</p>
                </div>
              </div>
            </div>

            {/* iOS 27 Liquid Glass Intensity Setting */}
            <div className="p-6 rounded-[22px] bg-surface space-y-4 border-0">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-semibold text-fg">Liquid Glass Intensity</h4>
                  <p className="text-xs text-fg-muted">
                    Adjust navigation and modal frosted glass translucency in real-time.
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold text-fg bg-surface-2 px-2.5 py-1 rounded-md tabular-nums">
                  {Math.round(glassLevel * 100)}%
                </span>
              </div>

              {/* Glass Slider */}
              <div className="space-y-2 pt-1">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={glassLevel}
                  onChange={handleGlassChange}
                  aria-label="Liquid Glass Intensity"
                  className="w-full h-1 rounded-full bg-surface-3 appearance-none cursor-pointer accent-white [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(0,0,0,0.3)] [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-black/10 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-[0_2px_8px_rgba(0,0,0,0.3)] [&::-moz-range-thumb]:border-none"
                />
                <div className="flex justify-between text-[12px] text-fg-subtle font-medium">
                  <span>Clear</span>
                  <span>Frosted</span>
                </div>
              </div>

              <p className="text-[11px] text-fg-subtle border-t border-hairline/[0.08] pt-3">
                Follows your device&apos;s Reduce Transparency setting.
              </p>
            </div>

            {/* DPDP 2023 Data Erasure Zone */}
            <div className="p-6 rounded-[22px] bg-danger/5 border border-danger/20 space-y-3">
              <div className="flex items-center gap-2 text-danger font-semibold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Digital Personal Data Protection (DPDP) Act 2023 Rights</span>
              </div>
              <p className="text-xs text-fg-muted leading-relaxed">
                Under Section 12 of the Indian DPDP Act 2023, you have the right to withdraw data processing consent and demand the permanent erasure of all personal data, telemetry logs, and search history from our PostgreSQL database.
              </p>
              <button
                type="button"
                onClick={handleDeletePersonalData}
                disabled={isDeletingData}
                className="mt-2 inline-flex items-center justify-center min-h-[44px] px-6 rounded-full bg-danger/10 text-danger hover:bg-danger/20 text-[14px] font-semibold transition-[background-color,transform] duration-150 apple-press apple-focus disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                {isDeletingData ? "Erasing Data..." : "Withdraw Consent & Erase My Personal Data"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-hairline/[0.08] rounded-[28px] shadow-[0_24px_70px_rgba(0,0,0,0.12)] w-full max-w-md p-6 relative space-y-5 text-fg">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-fg">Edit Profile</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors apple-focus"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-fg block mb-1">Display Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Aditya Kulkarni"
                  required
                  className="h-11 w-full rounded-[14px] bg-surface-2 border border-hairline/[0.08] px-4 text-[14px] text-fg placeholder:text-fg-subtle focus-visible:border-accent-link focus-visible:ring-2 focus-visible:ring-accent-link/30 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-fg block mb-1">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell students what you review in Pune (e.g., Kothrud cafes, Hinjewadi PGs)..."
                  className="w-full p-3.5 bg-surface-2 border border-hairline/[0.08] rounded-[14px] text-fg placeholder:text-fg-subtle resize-none h-24 focus-visible:border-accent-link focus-visible:ring-2 focus-visible:ring-accent-link/30 outline-none text-[14px]"
                />
              </div>

              <div>
                <label className="font-semibold text-fg block mb-1">Avatar Image URL (Optional)</label>
                <input
                  type="url"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  placeholder="https://..."
                  className="h-11 w-full rounded-[14px] bg-surface-2 border border-hairline/[0.08] px-4 text-[14px] text-fg placeholder:text-fg-subtle focus-visible:border-accent-link focus-visible:ring-2 focus-visible:ring-accent-link/30 outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-hairline/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="min-h-[44px] px-5 rounded-full text-fg-muted hover:text-fg text-[14px] font-medium transition-colors apple-focus"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !editName.trim()}
                  className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-full liquid-glass-btn text-[14px] font-semibold disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
