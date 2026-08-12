"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowLeft,
  Plus,
  Heart,
  Coffee,
  Film,
  Home,
  Search,
  User,
  GraduationCap,
  Utensils,
  Wrench,
  Lock,
  Globe,
  X,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { userSession } from "@/lib/userAuth"
import { EnhancedRateModal } from "@/components/enhanced-rate-modal"
import { BottomNav } from "@/components/bottom-nav"

const initialMockLists = [
  { id: "1", name: "Best Coffee Shops in Pune", itemCount: 8, icon: Coffee, isPrivate: false, description: "Top Irani cafes and specialty espresso spots on FC Road." },
  { id: "2", name: "Top JEE Coaching Batches", itemCount: 5, icon: GraduationCap, isPrivate: false, description: "Small batch size preparation academies." },
  { id: "3", name: "Boys PGs Near Hinjewadi", itemCount: 7, icon: Home, isPrivate: true, description: "Co-living spaces with good WiFi and meals." },
]

export default function ListsPage() {
  const [lists, setLists] = useState(initialMockLists)
  const [showNewListModal, setShowNewListModal] = useState(false)
  const [showRateModal, setShowRateModal] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

  // New List Form State
  const [listName, setListName] = useState("")
  const [listDescription, setListDescription] = useState("")
  const [selectedIcon, setSelectedIcon] = useState("Heart")
  const [isPrivate, setIsPrivate] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    // Check if user is logged in
    userSession.isLoggedIn().then((loggedIn) => {
      setIsLoggedIn(loggedIn)
      if (loggedIn) {
        fetch("/api/lists").then(res => res.json()).then(data => {
          if (Array.isArray(data)) {
            setLists(data)
          }
        }).catch(err => console.error(err))
      }
    })
  }, [])

  const handleOpenCreateList = async () => {
    const loggedIn = await userSession.isLoggedIn()
    if (!loggedIn) {
      // Strictly enforce login for list creation as requested
      router.push("/login?reason=create_list&redirect=/lists")
      return
    }
    setShowNewListModal(true)
  }

  const handleOpenRateModal = async () => {
    const loggedIn = await userSession.isLoggedIn()
    if (!loggedIn) {
      // Strictly enforce login for rating as requested
      router.push("/login?reason=rate&redirect=/lists")
      return
    }
    setShowRateModal(true)
  }

  const handleCreateListSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!listName.trim()) return

    setIsCreating(true)

    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: listName.trim(),
          description: listDescription.trim(),
          isPrivate,
          iconName: selectedIcon,
        })
      })

      if (res.ok) {
        const newList = await res.json()
        setLists([newList, ...lists])
      }
    } catch (error) {
      console.error(error)
    }

    // Reset Form
    setListName("")
    setListDescription("")
    setIsPrivate(false)
    setIsCreating(false)
    setShowNewListModal(false)
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-gray-600 hover:text-black">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-black">Your Lists</h1>
          </div>
          <Button
            onClick={handleOpenCreateList}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            Create List
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-black mb-2">Personal Collections</h2>
            <p className="text-gray-600 text-sm">Save your favorite Pune places, PGs, and cafes</p>
          </div>
        </div>

        {/* Lists Grid */}
        {lists.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.map((list) => {
              const iconMap: Record<string, any> = { Coffee, GraduationCap, Home, Heart, Film, Utensils, Wrench }
              const IconComp = (list as any).iconName ? iconMap[(list as any).iconName] || Heart : (list as any).icon || Heart
              return (
                <Card key={list.id} className="bg-gray-50 cursor-pointer group border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all rounded-2xl overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                        <IconComp className="h-6 w-6 text-yellow-700" />
                      </div>
                      <span className="flex items-center gap-1 text-xs px-2.5 py-1 bg-white text-gray-600 rounded-full border border-gray-200">
                        {list.isPrivate ? <Lock className="h-3 w-3 text-gray-400" /> : <Globe className="h-3 w-3 text-green-600" />}
                        {list.isPrivate ? "Private" : "Public"}
                      </span>
                    </div>

                    <h3 className="font-bold text-gray-900 mb-1 group-hover:text-yellow-600 transition-colors">
                      {list.name}
                    </h3>
                    <p className="text-gray-500 text-xs line-clamp-2 mb-3">
                      {list.description || "No description provided."}
                    </p>

                    <div className="text-xs text-gray-400 font-medium">
                      {list.itemCount} places saved
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-yellow-50 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Heart className="h-12 w-12 text-yellow-500" />
            </div>
            <h3 className="text-2xl font-bold text-black mb-2">No custom lists yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm">
              Lists make it easy to organize your favorite coaching classes, PGs, and cafes.
            </p>
            <Button onClick={handleOpenCreateList} className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-6 py-3 rounded-full font-medium text-sm">
              Create First List
            </Button>
          </div>
        )}
      </div>

      {/* CREATE NEW LIST MODAL */}
      {showNewListModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowNewListModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-1">Create New List</h2>
            <p className="text-xs text-gray-500 mb-6">Group your favorite places in Pune</p>

            <form onSubmit={handleCreateListSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">List Name</label>
                <input
                  type="text"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="e.g. Top 5 Cafes on FC Road"
                  className="w-full px-4 h-11 bg-gray-50 border border-gray-200 rounded-xl text-black text-sm focus:border-yellow-400 focus:outline-none"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Description (Optional)</label>
                <textarea
                  value={listDescription}
                  onChange={(e) => setListDescription(e.target.value)}
                  placeholder="What is this collection about?"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-black text-sm focus:border-yellow-400 focus:outline-none resize-none h-20"
                />
              </div>

              {/* Icon Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Choose Icon</label>
                <div className="flex gap-2">
                  {[
                    { id: "Heart", icon: Heart },
                    { id: "Coffee", icon: Coffee },
                    { id: "GraduationCap", icon: GraduationCap },
                    { id: "Home", icon: Home },
                    { id: "Utensils", icon: Utensils },
                    { id: "Film", icon: Film },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedIcon(item.id)}
                      className={`p-2.5 rounded-xl border transition-all ${
                        selectedIcon === item.id
                          ? "bg-yellow-100 border-yellow-400 text-yellow-800"
                          : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Privacy Setting */}
              <div className="pt-2">
                <label className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    {isPrivate ? <Lock className="h-4 w-4 text-gray-500" /> : <Globe className="h-4 w-4 text-green-600" />}
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{isPrivate ? "Private List" : "Public List"}</p>
                      <p className="text-[11px] text-gray-500">{isPrivate ? "Only visible to you" : "Visible to everyone on RateIT"}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="h-4 w-4 text-yellow-500 rounded border-gray-300 focus:ring-yellow-400"
                  />
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewListModal(false)}
                  className="flex-1 rounded-xl h-11 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!listName.trim() || isCreating}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-xl h-11 text-xs font-semibold"
                >
                  {isCreating ? "Saving..." : "Create List"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav onRateClick={handleOpenRateModal} />

      {/* Rate Modal */}
      {showRateModal && <EnhancedRateModal onClose={() => setShowRateModal(false)} />}
    </div>
  )
}
