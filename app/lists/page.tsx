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
      <div className="p-6 sm:p-8 rounded-[28px] bg-surface border-0 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs text-accent-link font-semibold uppercase tracking-wider">
            <Bookmark className="w-3.5 h-3.5" />
            Personal Pune Collections
          </div>
          <h1 className="text-[28px] sm:text-[40px] font-semibold text-fg tracking-[-0.022em]">
            Curated Pune Lists
          </h1>
          <p className="text-fg-muted text-sm max-w-xl leading-relaxed">
            Organize your favorite cafes, verified PGs, coaching academies, and local services into shareable collections.
          </p>
        </div>

        <button
          onClick={handleOpenCreateList}
          className="self-start sm:self-auto inline-flex items-center justify-center min-h-[44px] px-6 rounded-full liquid-glass-btn text-[14px] font-semibold shrink-0 gap-2"
        >
          <Plus className="w-4 h-4 text-stone-950 stroke-[2.5]" />
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
              className="p-5 rounded-[22px] bg-surface hover:bg-surface-2 border-0 transition-[background-color,transform] duration-150 flex flex-col justify-between space-y-4 group apple-press"
              style={{ animationDelay: `${Math.min(idx * 40, 240)}ms` }}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-[14px] bg-accent-link/[0.12] text-accent-link flex items-center justify-center">
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

              <div className="pt-3 border-t border-hairline/[0.08] flex items-center justify-between text-xs">
                <span className="text-accent-link font-semibold tabular-nums">
                  {count} saved venue{count === 1 ? "" : "s"}
                </span>
                <Link
                  href="/discover"
                  className="text-fg-subtle hover:text-fg flex items-center gap-1 font-medium transition-colors apple-focus rounded-full px-2 py-0.5"
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
        <div className="fixed inset-0 bg-black/25 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-hairline/[0.08] rounded-[28px] shadow-[0_24px_70px_rgba(0,0,0,0.12)] w-full max-w-md p-6 relative space-y-5 text-fg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-accent-link/[0.12] text-accent-link flex items-center justify-center">
                  <Bookmark className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-fg">Create New Collection</h3>
              </div>
              <button
                onClick={() => setShowNewListModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors apple-focus"
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
                  className="h-11 w-full rounded-[14px] bg-surface-2 border border-hairline/[0.08] px-4 text-[14px] text-fg placeholder:text-fg-subtle focus-visible:border-accent-link focus-visible:ring-2 focus-visible:ring-accent-link/30 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-fg block mb-1">Description (Optional)</label>
                <Input
                  value={listDescription}
                  onChange={(e) => setListDescription(e.target.value)}
                  placeholder="e.g., Quiet spots with strong WiFi and AC"
                  className="h-11 w-full rounded-[14px] bg-surface-2 border border-hairline/[0.08] px-4 text-[14px] text-fg placeholder:text-fg-subtle focus-visible:border-accent-link focus-visible:ring-2 focus-visible:ring-accent-link/30 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-fg block mb-1.5">Privacy</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPrivate(false)}
                    className={`flex-1 h-9 px-4 rounded-full text-[12px] font-semibold transition-colors flex items-center justify-center gap-1.5 apple-press apple-focus ${
                      !isPrivate
                        ? "bg-accent text-stone-950 shadow-sm"
                        : "bg-surface-2 text-fg-muted hover:text-fg"
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Public (Profile)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPrivate(true)}
                    className={`flex-1 h-9 px-4 rounded-full text-[12px] font-semibold transition-colors flex items-center justify-center gap-1.5 apple-press apple-focus ${
                      isPrivate
                        ? "bg-accent text-stone-950 shadow-sm"
                        : "bg-surface-2 text-fg-muted hover:text-fg"
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Private (Only me)</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-hairline/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowNewListModal(false)}
                  className="min-h-[44px] px-5 rounded-full text-fg-muted hover:text-fg text-[14px] font-medium transition-colors apple-focus"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !listName.trim()}
                  className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-full liquid-glass-btn text-[14px] font-semibold disabled:opacity-50"
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
