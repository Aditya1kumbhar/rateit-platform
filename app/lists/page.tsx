"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Plus,
  Heart,
  Coffee,
  Home,
  GraduationCap,
  Utensils,
  Lock,
  Globe,
  X,
  Bookmark,
  Sparkles,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { userSession } from "@/lib/userAuth"
import { toast } from "sonner"

const initialMockLists = [
  { id: "1", name: "Best Coffee Shops in Pune", itemCount: 8, icon: Coffee, isPrivate: false, description: "Top Irani cafes and specialty espresso spots on FC Road." },
  { id: "2", name: "Top JEE Coaching Batches", itemCount: 5, icon: GraduationCap, isPrivate: false, description: "Small batch size preparation academies in Kothrud." },
  { id: "3", name: "Boys PGs Near Hinjewadi", itemCount: 7, icon: Home, isPrivate: true, description: "Co-living spaces with good WiFi and meals near Phase 1." },
  { id: "4", name: "Late Night Mess & Dining", itemCount: 6, icon: Utensils, isPrivate: false, description: "Student-budget friendly dinners near Fergusson College." },
]

export default function ListsPage() {
  const [lists, setLists] = useState<any[]>(initialMockLists)
  const [showNewListModal, setShowNewListModal] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

  // New List Form State
  const [listName, setListName] = useState("")
  const [listDescription, setListDescription] = useState("")
  const [selectedIcon, setSelectedIcon] = useState("Bookmark")
  const [isPrivate, setIsPrivate] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    let active = true
    userSession.isLoggedIn().then((loggedIn) => {
      if (active) {
        setIsLoggedIn(loggedIn)
        if (loggedIn) {
          fetch("/api/lists")
            .then((res) => res.json())
            .then((data) => {
              if (active && Array.isArray(data) && data.length > 0) {
                setLists(data)
              }
            })
            .catch(() => {})
        }
      }
    })
    return () => {
      active = false
    }
  }, [])

  const handleOpenCreateList = async () => {
    const loggedIn = await userSession.isLoggedIn()
    if (!loggedIn) {
      router.push("/login?reason=create_list&redirect=/lists")
      return
    }
    setShowNewListModal(true)
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
        }),
      })

      if (res.ok) {
        const newList = await res.json()
        setLists([newList, ...lists])
        toast.success(`Created list "${listName.trim()}"`)
      } else {
        const localList = {
          id: Date.now().toString(),
          name: listName.trim(),
          description: listDescription.trim(),
          itemCount: 0,
          isPrivate,
        }
        setLists([localList, ...lists])
        toast.success(`Created list "${listName.trim()}" locally`)
      }
      setListName("")
      setListDescription("")
      setShowNewListModal(false)
    } catch {
      toast.error("Failed to create list")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-fg-subtle">
        <Link href="/" className="hover:text-fg transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-fg-subtle" />
        <span className="text-fg font-medium">Saved Lists & Collections</span>
      </nav>

      {/* Hero Header */}
      <div className="p-6 sm:p-8 rounded-modal bg-surface border-0 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs text-accent-link font-semibold uppercase tracking-wider">
            <Bookmark className="w-3.5 h-3.5" />
            Personal Pune Collections
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-fg tracking-[-0.022em]">
            Curated Pune Lists
          </h1>
          <p className="text-fg-muted text-sm max-w-xl leading-relaxed">
            Organize your favorite cafes, verified PGs, coaching academies, and local services into shareable collections.
          </p>
        </div>

        <button
          onClick={handleOpenCreateList}
          className="self-start sm:self-auto px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-accent/20 apple-press apple-focus shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New List</span>
        </button>
      </div>

      {/* Lists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lists.map((list, idx) => {
          const count = list.items ? list.items.length : list.itemCount || 0
          return (
            <div
              key={list.id}
              className="p-5 rounded-card bg-surface hover:bg-surface-2 border-0 shadow-sm transition-[background-color] duration-150 flex flex-col justify-between space-y-4 group apple-press"
              style={{ animationDelay: `${Math.min(idx * 40, 240)}ms` }}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-accent-tint text-accent-link flex items-center justify-center">
                    <Bookmark className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-fg-subtle flex items-center gap-1">
                    {list.isPrivate ? (
                      <>
                        <Lock className="w-3 h-3 text-fg-subtle" /> Private
                      </>
                    ) : (
                      <>
                        <Globe className="w-3 h-3 text-success" /> Public
                      </>
                    )}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-fg tracking-[-0.022em] group-hover:text-accent-link transition-colors">
                    {list.name}
                  </h3>
                  <p className="text-xs text-fg-muted mt-1 leading-relaxed">
                    {list.description || "Curated collection of verified Pune spots."}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-hairline flex items-center justify-between text-xs">
                <span className="text-accent-link font-semibold tabular-nums">
                  {count} saved venue{count === 1 ? "" : "s"}
                </span>
                <Link
                  href="/discover"
                  className="text-fg-subtle hover:text-fg flex items-center gap-1 font-medium transition-colors apple-focus rounded-md px-2 py-0.5"
                >
                  <span>Explore spots</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* New List Modal */}
      {showNewListModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-hairline rounded-modal w-full max-w-md p-6 shadow-[0_24px_70px_rgba(0,0,0,0.65)] relative space-y-5 text-fg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-accent-tint text-accent-link flex items-center justify-center">
                  <Bookmark className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-fg">Create New Collection</h3>
              </div>
              <button
                onClick={() => setShowNewListModal(false)}
                className="p-1.5 rounded-lg text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors apple-focus"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateListSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-fg block mb-1">List Name</label>
                <Input
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="e.g., Best Study Cafes on FC Road"
                  required
                  className="bg-surface-2 border-hairline text-fg rounded-input text-xs placeholder:text-fg-subtle apple-focus"
                />
              </div>

              <div>
                <label className="font-semibold text-fg block mb-1">Description (Optional)</label>
                <Input
                  value={listDescription}
                  onChange={(e) => setListDescription(e.target.value)}
                  placeholder="e.g., Quiet spots with strong WiFi and AC"
                  className="bg-surface-2 border-hairline text-fg rounded-input text-xs placeholder:text-fg-subtle apple-focus"
                />
              </div>

              <div>
                <label className="font-semibold text-fg block mb-1.5">Privacy</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPrivate(false)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                      !isPrivate
                        ? "bg-accent text-white"
                        : "bg-surface-2 text-fg-muted hover:text-fg border border-hairline"
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Public (Profile)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPrivate(true)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                      isPrivate
                        ? "bg-accent text-white"
                        : "bg-surface-2 text-fg-muted hover:text-fg border border-hairline"
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Private (Only me)</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setShowNewListModal(false)}
                  className="text-fg-subtle hover:text-fg text-xs px-3.5 py-1.5 rounded-lg transition-colors apple-focus"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !listName.trim()}
                  className="bg-accent hover:bg-accent-hover text-white font-semibold text-xs rounded-lg px-5 py-2 shadow-md shadow-accent/20 apple-press apple-focus disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Create Collection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
