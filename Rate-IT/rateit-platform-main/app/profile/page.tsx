"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowLeft,
  Settings,
  Star,
  Home,
  Search,
  Plus,
  Heart,
  User as UserIcon,
  Grid,
  Bookmark,
  Award,
  Edit3,
  Share2,
  LogOut,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Globe,
  X,
  Camera,
  Coffee,
  GraduationCap,
  Sparkles,
  ExternalLink
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { userSession } from "@/lib/userAuth"
import { EnhancedRateModal } from "@/components/enhanced-rate-modal"
import { BottomNav } from "@/components/bottom-nav"

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"grid" | "saved" | "badges">("grid")
  const [showEditModal, setShowEditModal] = useState(false)
  const [showRateModal, setShowRateModal] = useState(false)

  // Edit Form State
  const [editName, setEditName] = useState("")
  const [editBio, setEditBio] = useState("")
  const [editAvatar, setEditAvatar] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const router = useRouter()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/profile")
      if (res.status === 401) {
        // Not logged in -> redirect to login
        router.push("/login?reason=profile&redirect=/profile")
        return
      }
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
        setEditName(data.displayName || "")
        setEditBio(data.bio || "")
        setEditAvatar(data.avatarUrl || "")
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err)
    } finally {
      setIsLoading(false)
    }
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
          avatarUrl: editAvatar.trim() || null
        })
      })

      if (res.ok) {
        const updated = await res.json()
        setProfile((prev: any) => ({
          ...prev,
          displayName: updated.displayName,
          bio: updated.bio,
          avatarUrl: updated.avatarUrl
        }))
        setShowEditModal(false)
      }
    } catch (err) {
      console.error("Failed to update profile:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    await userSession.clearUser()
    router.push("/")
  }

  const handleShareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: `${profile?.displayName || "User"}'s Profile on RateIT`,
        url: window.location.href,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert("Profile link copied to clipboard!")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500 font-medium">Loading Instagram Profile...</p>
        </div>
      </div>
    )
  }

  const initials = profile?.displayName
    ? profile.displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "IT"

  return (
    <div className="min-h-screen bg-gray-50 pb-24 text-gray-900 selection:bg-yellow-100">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-700 hover:text-black">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold tracking-tight text-black">
              Profile
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="hidden md:flex h-9 text-gray-600 hover:text-red-600 border-gray-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Logout"
              className="md:hidden h-9 w-9 text-gray-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 pt-8">
        {/* Profile Card Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 w-full md:w-auto">
              
              {/* Avatar */}
              <div className="relative group cursor-pointer" onClick={() => setShowEditModal(true)}>
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-gray-50 shadow-sm transition-transform group-hover:scale-105 bg-white">
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.displayName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-2xl md:text-4xl tracking-wider">
                      {initials}
                    </div>
                  )}
                </div>
                <div className="absolute bottom-1 right-1 bg-white text-gray-900 p-2 rounded-full shadow-md border border-gray-100 hover:bg-gray-50">
                  <Camera className="h-4 w-4" />
                </div>
              </div>

              {/* Name & Bio Info */}
              <div className="text-center md:text-left space-y-2 mt-2 md:mt-0">
                <div className="flex flex-col md:flex-row items-center gap-2">
                  <h2 className="font-bold text-2xl text-gray-900">{profile?.displayName}</h2>
                  {profile?.phoneVerified && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 max-w-md">
                  {profile?.bio || "Reviewer on RateIT Pune. Sharing authentic ratings & check-ins."}
                </p>
                <div className="flex items-center justify-center md:justify-start gap-4 pt-3">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-gray-900">{profile?.reviewsCount || 0}</span>
                    <span className="text-xs text-gray-500">Reviews</span>
                  </div>
                  <div className="w-1 h-1 bg-gray-300 rounded-full" />
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-gray-900">{profile?.listsCount || 0}</span>
                    <span className="text-xs text-gray-500">Lists</span>
                  </div>
                  <div className="w-1 h-1 bg-gray-300 rounded-full" />
                  <div className="flex items-center gap-1.5 text-amber-600">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-bold">{profile?.trustScore ? profile.trustScore.toFixed(0) : "85"}</span>
                    <span className="text-xs text-gray-500">Trust Score</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="flex flex-row md:flex-col gap-3 w-full md:w-48">
              <Button
                onClick={() => setShowEditModal(true)}
                variant="outline"
                className="flex-1 rounded-xl border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold flex items-center justify-center gap-2 shadow-sm"
              >
                <Edit3 className="h-4 w-4" />
                Edit Profile
              </Button>
              <Button
                onClick={handleShareProfile}
                className="flex-1 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-semibold flex items-center justify-center gap-2 shadow-sm"
              >
                <Share2 className="h-4 w-4" />
                Share Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-t-2xl border-t border-x border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab("grid")}
              className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-semibold border-b-2 transition-all ${
                activeTab === "grid"
                  ? "border-yellow-400 text-gray-900 bg-gray-50/50"
                  : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50/30"
              }`}
            >
              <Grid className="h-4 w-4" />
              Reviews
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-semibold border-b-2 transition-all ${
                activeTab === "saved"
                  ? "border-yellow-400 text-gray-900 bg-gray-50/50"
                  : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50/30"
              }`}
            >
              <Bookmark className="h-4 w-4" />
              Lists ({profile?.listsCount || 0})
            </button>
            <button
              onClick={() => setActiveTab("badges")}
              className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-semibold border-b-2 transition-all ${
                activeTab === "badges"
                  ? "border-yellow-400 text-gray-900 bg-gray-50/50"
                  : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50/30"
              }`}
            >
              <Award className="h-4 w-4" />
              Verification
            </button>
          </div>
        </div>

        {/* Tab Contents Area */}
        <div className="bg-white border-b border-x border-gray-200 rounded-b-2xl p-4 md:p-6 min-h-[400px]">
          
          {/* TAB 1: REVIEWS GRID */}
          {activeTab === "grid" && (
            <div>
              {profile?.reviews && profile.reviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {profile.reviews.map((rev: any) => (
                    <Card key={rev.id} className="overflow-hidden border border-gray-200 rounded-xl bg-white hover:shadow-lg transition-all group flex flex-col h-full">
                      <CardContent className="p-5 flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                            {rev.place?.category || "Place"}
                          </span>
                          <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {rev.rating}.0
                          </span>
                        </div>
                        <h4 className="font-bold text-base text-gray-900 line-clamp-1 group-hover:text-yellow-600 transition-colors mb-2">
                          {rev.place?.name || "Pune Location"}
                        </h4>
                        <p className="text-sm text-gray-600 flex-1 italic bg-gray-50 p-3 rounded-lg">
                          "{rev.text || "Rated location in Pune."}"
                        </p>
                        {rev.checkinVerified && (
                          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                            <CheckCircle2 className="h-4 w-4" /> GPS Check-in Verified
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-4 space-y-4">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 border border-gray-100">
                    <Grid className="h-10 w-10" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">No Reviews Yet</h3>
                  <p className="text-sm text-gray-500 max-w-sm text-center">
                    Share your authentic experience for coaching classes, cafes, and PGs in Pune. Your reviews help the community!
                  </p>
                  <Button
                    onClick={() => setShowRateModal(true)}
                    className="mt-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-xl px-6 h-11 font-semibold"
                  >
                    Post First Review
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SAVED LISTS */}
          {activeTab === "saved" && (
            <div>
              {profile?.lists && profile.lists.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.lists.map((list: any) => (
                    <Card key={list.id} className="border border-gray-200 rounded-xl bg-white p-5 hover:shadow-md transition-all group cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-yellow-50 border border-yellow-100 rounded-xl flex items-center justify-center text-yellow-600 group-hover:scale-105 transition-transform">
                            <Heart className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-gray-900 group-hover:text-yellow-600 transition-colors">{list.name}</h4>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{list.description || "Custom place collection"}</p>
                          </div>
                        </div>
                        <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border bg-gray-50 text-gray-600 border-gray-200">
                          {list.isPrivate ? <Lock className="h-3.5 w-3.5 text-gray-400" /> : <Globe className="h-3.5 w-3.5 text-emerald-600" />}
                          {list.isPrivate ? "Private" : "Public"}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-4 space-y-4">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 border border-gray-100">
                    <Bookmark className="h-10 w-10" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">No Saved Collections</h3>
                  <p className="text-sm text-gray-500 max-w-sm text-center">
                    Organize your favorite hostels, coaching batches, and Irani cafes into custom lists.
                  </p>
                  <Link href="/lists">
                    <Button className="mt-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-xl px-6 h-11 font-semibold">
                      Create a List
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TRUST & BADGES */}
          {activeTab === "badges" && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <Card className="border border-amber-200 bg-amber-50 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white shadow-sm text-amber-600 rounded-xl flex items-center justify-center">
                      <ShieldCheck className="h-7 w-7" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-gray-900">Trust Engine Score</h4>
                      <p className="text-sm text-gray-600">Calculated via GPS check-ins & phone verification</p>
                    </div>
                  </div>
                  <div className="text-3xl font-black text-amber-600">
                    {profile?.trustScore?.toFixed(1) || 85.0}
                  </div>
                </div>
                <div className="w-full bg-white rounded-full h-3 border border-amber-100 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-amber-500 h-full transition-all"
                    style={{ width: `${Math.min(100, profile?.trustScore || 85)}%` }}
                  />
                </div>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 bg-white border border-gray-200 rounded-xl flex items-start space-x-4 shadow-sm hover:border-emerald-200 transition-colors">
                  <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-base text-gray-900">Phone Verified</h5>
                    <p className="text-sm text-gray-500 mt-1">IS 19000 compliant identity verification ensuring authentic reviewers.</p>
                  </div>
                </div>

                <div className="p-5 bg-white border border-gray-200 rounded-xl flex items-start space-x-4 shadow-sm hover:border-purple-200 transition-colors">
                  <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-base text-gray-900">DPDP Compliant</h5>
                    <p className="text-sm text-gray-500 mt-1">Explicit digital consent logged and secured in the database.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Edit Profile</h2>
            <p className="text-sm text-gray-500 mb-6">Update your public display name, bio, and avatar image.</p>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Display Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Aditya Kumbhar"
                  className="w-full px-4 h-12 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell others what you review in Pune..."
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10 focus:outline-none resize-none h-24 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Avatar Image URL (Optional)</label>
                <input
                  type="url"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 h-12 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10 focus:outline-none transition-all"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 rounded-xl h-12 text-sm font-medium"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving || !editName.trim()}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-xl h-12 text-sm font-bold shadow-sm"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav onRateClick={() => setShowRateModal(true)} />

      {/* Rate Modal */}
      {showRateModal && <EnhancedRateModal onClose={() => setShowRateModal(false)} />}
    </div>
  )
}
