"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Check, Lock, Globe } from "lucide-react"

interface SaveToListsModalProps {
  itemName: string
  onClose: () => void
}

export function SaveToListsModal({ itemName, onClose }: SaveToListsModalProps) {
  const [selectedLists, setSelectedLists] = useState<string[]>([])
  const [showNewListForm, setShowNewListForm] = useState(false)
  const [newListName, setNewListName] = useState("")
  const [newListPrivacy, setNewListPrivacy] = useState("public")

  // Mock existing lists
  const existingLists = [
    { id: "1", name: "Best Coffee Shops in SF", itemCount: 8, isPrivate: false },
    { id: "2", name: "Must-Watch Movies 2024", itemCount: 12, isPrivate: false },
    { id: "3", name: "Top Universities", itemCount: 5, isPrivate: true },
    { id: "4", name: "Hidden Restaurant Gems", itemCount: 7, isPrivate: false },
  ]

  const toggleList = (listId: string) => {
    setSelectedLists((prev) => (prev.includes(listId) ? prev.filter((id) => id !== listId) : [...prev, listId]))
  }

  const handleCreateNewList = () => {
    if (newListName.trim()) {
      // Here you would normally create the new list
      console.log("Creating new list:", {
        name: newListName,
        privacy: newListPrivacy,
        firstItem: itemName,
      })
      setShowNewListForm(false)
      setNewListName("")
    }
  }

  const handleSave = () => {
    // Here you would normally save the item to selected lists
    console.log("Saving to lists:", {
      item: itemName,
      lists: selectedLists,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto shadow-xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-black">Save to Lists</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-black">
              <span className="text-xl">×</span>
            </Button>
          </div>

          <p className="text-gray-600 mb-6">Save "{itemName}" to your lists</p>

          {/* Existing Lists */}
          <div className="space-y-3 mb-6">
            {existingLists.map((list) => (
              <Card
                key={list.id}
                className={`cursor-pointer transition-all border ${
                  selectedLists.includes(list.id) ? "border-yellow-400 bg-yellow-50" : "border-gray-200 bg-gray-50"
                }`}
                onClick={() => toggleList(list.id)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedLists.includes(list.id) ? "border-yellow-400 bg-yellow-400" : "border-gray-300 bg-white"
                      }`}
                    >
                      {selectedLists.includes(list.id) && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">{list.name}</h4>
                      <p className="text-sm text-gray-600">{list.itemCount} items</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {list.isPrivate ? (
                      <Lock className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Globe className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Create New List */}
          {!showNewListForm ? (
            <Button
              onClick={() => setShowNewListForm(true)}
              variant="outline"
              className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 mb-6 bg-transparent"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New List
            </Button>
          ) : (
            <Card className="border border-gray-200 mb-6">
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-800 mb-3">Create New List</h4>
                <Input
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="List name"
                  className="mb-3 bg-gray-50 border-gray-200"
                />
                <div className="flex space-x-2 mb-3">
                  <Button
                    size="sm"
                    variant={newListPrivacy === "public" ? "default" : "outline"}
                    onClick={() => setNewListPrivacy("public")}
                    className={
                      newListPrivacy === "public"
                        ? "bg-yellow-400 hover:bg-yellow-500 text-gray-800"
                        : "border-gray-200 text-gray-700 bg-transparent"
                    }
                  >
                    <Globe className="h-3 w-3 mr-1" />
                    Public
                  </Button>
                  <Button
                    size="sm"
                    variant={newListPrivacy === "private" ? "default" : "outline"}
                    onClick={() => setNewListPrivacy("private")}
                    className={
                      newListPrivacy === "private"
                        ? "bg-yellow-400 hover:bg-yellow-500 text-gray-800"
                        : "border-gray-200 text-gray-700 bg-transparent"
                    }
                  >
                    <Lock className="h-3 w-3 mr-1" />
                    Private
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleCreateNewList} className="bg-blue-500 hover:bg-blue-600 text-white">
                    Create
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowNewListForm(false)}
                    className="border-gray-200 text-gray-700 bg-transparent"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Save Button */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-200 text-gray-600 hover:text-black bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={selectedLists.length === 0}
              className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-800"
            >
              Save ({selectedLists.length})
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
