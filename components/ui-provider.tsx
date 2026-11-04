"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { BottomNav } from "@/components/bottom-nav"
import { EnhancedRateModal } from "@/components/enhanced-rate-modal"
import { CommandPalette } from "@/components/command-palette"

export interface PlaceToRate {
  id: string
  name: string
  category: string
  address?: string
  latitude: number
  longitude: number
}

interface UIContextType {
  openRateModal: (place?: PlaceToRate) => void
  closeRateModal: () => void
  openSearch: () => void
  closeSearch: () => void
  toggleSearch: () => void
}

const UIContext = createContext<UIContextType | undefined>(undefined)

export function useUI() {
  const context = useContext(UIContext)
  if (!context) {
    throw new Error("useUI must be used within a UIProvider")
  }
  return context
}

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [isRateModalOpen, setIsRateModalOpen] = useState(false)
  const [preSelectedPlace, setPreSelectedPlace] = useState<PlaceToRate | undefined>(undefined)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const openRateModal = useCallback((place?: PlaceToRate) => {
    setPreSelectedPlace(place)
    setIsRateModalOpen(true)
  }, [])

  const closeRateModal = useCallback(() => {
    setIsRateModalOpen(false)
    setPreSelectedPlace(undefined)
  }, [])

  const openSearch = useCallback(() => {
    setIsSearchOpen(true)
  }, [])

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false)
  }, [])

  const toggleSearch = useCallback(() => {
    setIsSearchOpen((prev) => !prev)
  }, [])

  // Global ⌘K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setIsSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Listen for custom window events dispatched anywhere across pages
  useEffect(() => {
    const handleOpenRate = (e: Event) => {
      const customEvent = e as CustomEvent<PlaceToRate | undefined>
      setPreSelectedPlace(customEvent.detail)
      setIsRateModalOpen(true)
    }

    const handleOpenSearch = () => {
      setIsSearchOpen(true)
    }

    window.addEventListener("open-rate-modal", handleOpenRate)
    window.addEventListener("open-search-palette", handleOpenSearch)

    return () => {
      window.removeEventListener("open-rate-modal", handleOpenRate)
      window.removeEventListener("open-search-palette", handleOpenSearch)
    }
  }, [])

  return (
    <UIContext.Provider
      value={{
        openRateModal,
        closeRateModal,
        openSearch,
        closeSearch,
        toggleSearch,
      }}
    >
      {children}

      {/* Global Persistent Floating Bottom Dock (Mobile) */}
      <BottomNav onRateClick={() => openRateModal()} />

      {/* Global Rate Modal */}
      {isRateModalOpen && (
        <EnhancedRateModal
          preSelectedPlace={preSelectedPlace}
          onClose={closeRateModal}
        />
      )}

      {/* Global Command Palette / Quick Search */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={closeSearch}
      />
    </UIContext.Provider>
  )
}

