"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Compass, Plus, Bookmark, User } from "lucide-react"

export function BottomNav({ onRateClick }: { onRateClick: () => void }) {
  const pathname = usePathname()

  const navItems = [
    { href: "/", label: "Home", icon: Home, exact: true },
    { href: "/discover", label: "Discover", icon: Compass, exact: false },
    { isAction: true, label: "Rate", icon: Plus, action: onRateClick },
    { href: "/lists", label: "Lists", icon: Bookmark, exact: false },
    { href: "/profile", label: "Profile", icon: User, exact: false },
  ]

  const activeIndex = navItems.findIndex((item) => {
    if (item.isAction) return false
    return item.exact ? pathname === item.href : pathname.startsWith(item.href!)
  })

  return (
    <div className="fixed bottom-[calc(12px+env(safe-area-inset-bottom))] inset-x-0 z-40 flex justify-center pointer-events-none md:hidden px-3 select-none">
      {/* Chromium Optional Refraction Filter */}
      <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
        <filter id="glass-refract" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="10" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <nav className="pointer-events-auto relative glass glass-refract flex items-center justify-between px-1.5 py-1 rounded-full w-full max-w-sm">
        {/* Sliding Indicator */}
        {activeIndex !== -1 && activeIndex !== 2 && (
          <div
            className="glass-thumb absolute top-1 bottom-1 rounded-full pointer-events-none"
            style={{
              width: "calc(20% - 6px)",
              left: "3px",
              transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * 3}px))`,
            }}
          />
        )}

        {navItems.map((item, idx) => {
          if (item.isAction) {
            return (
              <div key={idx} className="flex-1 flex justify-center items-center">
                <button
                  type="button"
                  onClick={item.action}
                  aria-label="Rate a place"
                  className="relative -top-2.5 w-12 h-12 rounded-full bg-accent flex items-center justify-center border-2 border-surface glass-press min-h-[48px] min-w-[48px] apple-focus z-20"
                >
                  <Plus className="w-5 h-5 stroke-[2.5] text-stone-950" />
                </button>
              </div>
            )
          }

          const Icon = item.icon!
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href!)

          return (
            <Link
              key={idx}
              href={item.href!}
              className={`relative z-10 flex-1 flex flex-col items-center justify-center py-1 rounded-full transition-colors duration-150 glass-press min-h-[44px] apple-focus ${
                isActive
                  ? "text-fg font-semibold"
                  : "text-fg-muted hover:text-fg"
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-105" : ""}`} />
              <span className="text-[11px] mt-0.5 tracking-tight font-medium">
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
