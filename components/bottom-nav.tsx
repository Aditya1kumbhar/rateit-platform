"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Plus, Heart, User } from "lucide-react"

export function BottomNav({ onRateClick }: { onRateClick: () => void }) {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none flex justify-center">
      <div className="bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-2 w-full max-w-5xl pointer-events-auto">
        <div className="flex justify-around items-center">
          <Link href="/">
            <button className={`bottom-nav-item ${pathname === "/" ? "bottom-nav-active" : "bottom-nav-inactive"}`}>
              <Home className="h-6 w-6" />
              <span className="text-xs font-medium hidden sm:block mt-1">Home</span>
            </button>
          </Link>

          <Link href="/discover">
            <button className={`bottom-nav-item ${pathname === "/discover" ? "bottom-nav-active" : "bottom-nav-inactive"}`}>
              <Search className="h-6 w-6" />
              <span className="text-xs font-medium hidden sm:block mt-1">Discover</span>
            </button>
          </Link>

          <button onClick={onRateClick} className="bottom-nav-item transform -translate-y-2">
            <div className="w-14 h-14 bg-yellow-400 hover:bg-yellow-500 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 border-4 border-white">
              <Plus className="h-7 w-7 text-gray-900" />
            </div>
          </button>

          <Link href="/lists">
            <button className={`bottom-nav-item ${pathname === "/lists" ? "bottom-nav-active" : "bottom-nav-inactive"}`}>
              <Heart className="h-6 w-6" />
              <span className="text-xs font-medium hidden sm:block mt-1">Lists</span>
            </button>
          </Link>

          <Link href="/profile">
            <button className={`bottom-nav-item ${pathname === "/profile" ? "bottom-nav-active" : "bottom-nav-inactive"}`}>
              <User className="h-6 w-6" />
              <span className="text-xs font-medium hidden sm:block mt-1">Profile</span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
