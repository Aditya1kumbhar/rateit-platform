"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Search, User, Shield, Plus, Sparkles, MapPin, LogOut } from "lucide-react"
import { userSession, type AuthUser } from "@/lib/userAuth"
import { useUI } from "@/components/ui-provider"

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const { openRateModal, openSearch } = useUI()

  useEffect(() => {
    let active = true
    userSession.getUser().then((u) => {
      if (active) setUser(u)
    })
    return () => {
      active = false
    }
  }, [pathname])

  const handleLogout = async () => {
    await userSession.clearUser()
    setUser(null)
    router.refresh()
  }

  const navLinks = [
    { href: "/discover", label: "Discover" },
    { href: "/category/coaching-classes", label: "Coaching" },
    { href: "/category/pgs-hostels", label: "PGs & Hostels" },
    { href: "/category/cafes", label: "Cafes" },
    { href: "/lists", label: "Lists" },
  ]

  return (
    <header className="sticky top-0 z-40 w-full pointer-events-none md:pt-3 md:px-4">
      <div className="pointer-events-auto glass w-full md:max-w-5xl md:mx-auto md:rounded-full rounded-none border-b md:border-b-0 border-hairline/[0.08] shadow-none md:shadow-[0_8px_32px_rgb(0_0_0_/_0.25)] px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo & Pune Live Indicator */}
        <Link href="/" className="flex items-center gap-2.5 group apple-press shrink-0 min-h-[44px] apple-focus rounded-xl pr-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-stone-950 font-bold text-base shadow-sm">
            R
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold tracking-[-0.022em] text-fg flex items-center gap-2">
              RateIT
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2 py-0.5 bg-success/10 text-success rounded-full font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Pune Live
              </span>
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-medium">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-full transition-colors duration-150 min-h-[32px] flex items-center apple-focus ${
                  isActive
                    ? "text-accent-link bg-accent-link/[0.12] font-semibold"
                    : "text-fg-muted hover:text-fg hover:bg-surface-2"
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Desktop Quick Search Shortcut */}
          <button
            type="button"
            onClick={openSearch}
            className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-2 border border-hairline/[0.08] text-xs text-fg-muted hover:text-fg hover:bg-surface-3 transition-colors duration-150 apple-press cursor-pointer min-h-[36px] apple-focus"
          >
            <Search className="w-3.5 h-3.5 text-accent-link" />
            <span>Search Pune...</span>
            <kbd className="text-[10px] bg-surface-3 text-fg-subtle px-1.5 py-0.5 rounded-md font-mono">⌘K</kbd>
          </button>

          {/* Mobile Search Button */}
          <button
            type="button"
            onClick={openSearch}
            aria-label="Search places"
            className="sm:hidden p-2.5 rounded-full text-fg hover:bg-surface-2 border border-hairline/[0.08] apple-press min-h-[44px] min-w-[44px] flex items-center justify-center apple-focus"
          >
            <Search className="w-4 h-4 text-accent-link" />
          </button>

          {/* Rate Spot Button */}
          <button
            type="button"
            onClick={() => openRateModal()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full liquid-glass-btn text-xs cursor-pointer min-h-[36px] apple-focus"
          >
            <Plus className="w-3.5 h-3.5 text-stone-950 stroke-[2.5]" />
            <span className="hidden sm:inline">Rate Spot</span>
            <span className="sm:hidden">Rate</span>
          </button>

          {/* User State */}
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-2 p-1 pr-3 rounded-full bg-surface-2 border border-hairline/[0.08] text-fg hover:bg-surface-3 transition-colors duration-150 apple-press min-h-[36px] apple-focus"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName || "User avatar"}
                    className="w-6 h-6 rounded-full object-cover border border-hairline/[0.08]"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-accent-link/[0.12] text-accent-link flex items-center justify-center text-xs font-semibold">
                    {user.displayName ? user.displayName[0].toUpperCase() : "U"}
                  </div>
                )}
                <span className="text-xs font-medium hidden md:inline truncate max-w-[100px]">
                  {user.displayName || "Profile"}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-2 rounded-full text-fg-subtle hover:text-danger hover:bg-surface-2 border border-transparent hover:border-hairline/[0.08] transition-colors duration-150 apple-press min-h-[36px] min-w-[36px] flex items-center justify-center apple-focus"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-full bg-surface-2 hover:bg-surface-3 border border-hairline/[0.08] text-xs font-semibold text-fg transition-colors duration-150 apple-press min-h-[36px] flex items-center apple-focus"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
