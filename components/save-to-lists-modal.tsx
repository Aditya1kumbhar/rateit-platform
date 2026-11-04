"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Check, Lock, Globe, X, Bookmark } from "lucide-react"
import { toast } from "sonner"
import { userSession } from "@/lib/userAuth"

interface SaveToListsModalProps {
  placeId?: string
  placeName?: string
  itemName?: string
  onClose: () => void
}

interface UserList {
  id: string
  name: string
  itemCount?: number
  isPrivate: boolean
}

export function SaveToListsModal({ placeId, placeName, itemName, onClose }: SaveToListsModalProps) {
  const displayName = placeName || itemName || "Place"
  const [lists, setLists] = useState<UserList[]>([
    { id: "1", name: "Best Coffee Shops in Pune", itemCount: 8, isPrivate: false },
    { id: "2", name: "Top JEE Coaching Batches", itemCount: 5, isPrivate: false },
    { id: "3", name: "Boys PGs Near Hinjewadi", itemCount: 7, isPrivate: true },
    { id: "4", name: "FC Road Student Hangouts", itemCount: 12, isPrivate: false },
  ])
  const [selectedLists, setSelectedLists] = useState<string[]>([])
  const [showNewListForm, setShowNewListForm] = useState(false)
  const [newListName, setNewListName] = useState("")
  const [newListPrivacy, setNewListPrivacy] = useState<"public" | "private">("public")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    userSession.isLoggedIn().then((loggedIn) => {
      if (loggedIn) {
        fetch("/api/lists")
          .then((res) => res.json())
          .then((data) => {
            if (active && Array.isArray(data) && data.length > 0) {
              setLists(
                data.map((l: any) => ({
                  id: l.id,
                  name: l.name,
                  itemCount: l.items ? l.items.length : l.itemCount || 0,
                  isPrivate: l.isPrivate,
                }))
              )
            }
          })
          .catch(() => {})
      }
    })
    return () => {
      active = false
    }
  }, [])

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

  const toggleList = (listId: string) => {
    setSelectedLists((prev) =>
      prev.includes(listId) ? prev.filter((id) => id !== listId) : [...prev, listId]
    )
  }

  const handleCreateNewList = async () => {
    if (!newListName.trim()) return

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newListName.trim(),
          isPrivate: newListPrivacy === "private",
          placeIds: placeId ? [placeId] : [],
        }),
      })

      if (res.ok) {
        const created = await res.json()
        const newList: UserList = {
          id: created.id || Date.now().toString(),
          name: created.name || newListName.trim(),
          itemCount: 1,
          isPrivate: created.isPrivate ?? (newListPrivacy === "private"),
        }
        setLists((prev) => [newList, ...prev])
        setSelectedLists((prev) => [...prev, newList.id])
        setNewListName("")
        setShowNewListForm(false)
        toast.success(`Created list "${newList.name}" and added "${displayName}"`)
      } else {
        // Fallback for guest mode
        const fallbackList: UserList = {
          id: Date.now().toString(),
          name: newListName.trim(),
          itemCount: 1,
          isPrivate: newListPrivacy === "private",
        }
        setLists((prev) => [fallbackList, ...prev])
        setSelectedLists((prev) => [...prev, fallbackList.id])
        setNewListName("")
        setShowNewListForm(false)
        toast.success(`Created list "${fallbackList.name}" locally`)
      }
    } catch {
      toast.error("Failed to create list. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSave = async () => {
    if (selectedLists.length === 0) {
      toast.info("Please select at least one list")
      return
    }

    setIsSubmitting(true)
    try {
      if (placeId) {
        await Promise.all(
          selectedLists.map(async (listId) => {
            try {
              const res = await fetch(`/api/lists/${listId}`)
              let currentPlaceIds: string[] = []
              if (res.ok) {
                const data = await res.json()
                if (data.items && Array.isArray(data.items)) {
                  currentPlaceIds = data.items.map((it: any) => it.placeId || it.place?.id).filter(Boolean)
                }
              }
              const updated = [...new Set([...currentPlaceIds, placeId])]
              await fetch(`/api/lists/${listId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ placeIds: updated }),
              })
            } catch (err) {
              console.warn("SaveToListsModal: could not update list on server", listId, err)
            }
          })
        )
      }

      toast.success(`Saved "${displayName}" to ${selectedLists.length} list${selectedLists.length > 1 ? "s" : ""}`)
      onClose()
    } catch {
      toast.error("Failed to update lists")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-0 bg-stone-900/25 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
    >
      <div className="glass rounded-[28px] w-full max-w-md max-h-[85vh] overflow-y-auto relative text-fg animate-in fade-in-0 zoom-in-[0.96] duration-200 ease-out origin-center">
        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-accent-link/[0.12] text-accent-link flex items-center justify-center">
                <Bookmark className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-fg">Save to Lists</h2>
                <p className="text-xs text-fg-muted truncate max-w-[220px]">
                  &ldquo;{displayName}&rdquo;
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors apple-focus"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List Options */}
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {lists.map((list) => {
              const isSelected = selectedLists.includes(list.id)
              return (
                <div
                  key={list.id}
                  onClick={() => toggleList(list.id)}
                  className={`p-3.5 rounded-[22px] cursor-pointer transition-[background-color,transform] duration-150 flex items-center justify-between apple-press ${
                    isSelected
                      ? "bg-accent-link/[0.12]"
                      : "bg-surface-2 hover:bg-surface-3"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-accent border-accent text-stone-950 font-bold"
                          : "border-hairline/[0.2] bg-surface-3"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-fg">{list.name}</h4>
                      <p className="text-[11px] text-fg-subtle flex items-center gap-1.5 mt-0.5">
                        <span>{list.itemCount} items</span>
                        <span>•</span>
                        {list.isPrivate ? (
                          <span className="flex items-center gap-1">
                            <Lock className="w-3 h-3 text-fg-subtle" /> Private
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3 text-fg-subtle" /> Public
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* New List Form Toggle or Form */}
          {!showNewListForm ? (
            <button
              onClick={() => setShowNewListForm(true)}
              className="w-full py-2.5 rounded-full border border-dashed border-hairline/[0.16] hover:border-accent-link/50 text-fg-muted hover:text-fg text-xs font-semibold flex items-center justify-center gap-2 transition-colors apple-press apple-focus"
            >
              <Plus className="w-4 h-4 text-accent-link" />
              <span>Create New Pune List</span>
            </button>
          ) : (
            <div className="p-4 rounded-[22px] bg-surface-2 space-y-3">
              <h4 className="text-xs font-semibold text-fg uppercase tracking-wider">
                New List Details
              </h4>
              <Input
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="e.g., Best Study Cafes on FC Road"
                className="h-11 rounded-[14px] bg-surface-3 border-hairline/[0.08] text-fg text-sm placeholder:text-fg-subtle focus-visible:border-accent-link focus-visible:ring-2 focus-visible:ring-accent-link/30 outline-none"
              />
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNewListPrivacy("public")}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      newListPrivacy === "public"
                        ? "bg-accent text-stone-950 font-semibold"
                        : "bg-surface-3 text-fg-muted hover:text-fg"
                    }`}
                  >
                    Public
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewListPrivacy("private")}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      newListPrivacy === "private"
                        ? "bg-accent text-stone-950 font-semibold"
                        : "bg-surface-3 text-fg-muted hover:text-fg"
                    }`}
                  >
                    Private
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewListForm(false)}
                    className="text-fg-subtle hover:text-fg text-xs px-2.5 py-1 rounded-full"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateNewList}
                    disabled={isSubmitting || !newListName.trim()}
                    className="liquid-glass-btn text-xs px-4 py-1.5 rounded-full disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-hairline/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="text-fg-subtle hover:text-fg text-xs px-4 py-2 rounded-full transition-colors apple-focus"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting || selectedLists.length === 0}
              className="min-h-[44px] px-6 rounded-full liquid-glass-btn text-xs font-semibold disabled:opacity-50"
            >
              Save to {selectedLists.length || ""} List{selectedLists.length === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
