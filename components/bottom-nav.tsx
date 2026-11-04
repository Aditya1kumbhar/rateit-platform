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

  return (
    <div className="fixed bottom-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] inset-x-0 z-40 flex justify-center pointer-events-none md:hidden px-4 select-none">
      <nav className="pointer-events-auto flex items-center justify-around gap-1 px-3 py-1.5 rounded-full bg-surface/85 backdrop-blur-2xl backdrop-saturate-180 border border-hairline/[0.08] shadow-[0_12px_32px_rgba(0,0,0,0.08)] w-full max-w-sm">
        {navItems.map((item, idx) => {
          if (item.isAction) {
            return (
              <button
                key={idx}
                onClick={item.action}
                aria-label="Rate a place"
                className="relative -top-2.5 w-12 h-12 rounded-full liquid-glass-btn flex items-center justify-center border-2 border-surface apple-focus min-h-[48px] min-w-[48px]"
              >
                <Plus className="w-5 h-5 stroke-[2.5] text-stone-950" />
              </button>
            )
          }

          const Icon = item.icon!
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href!)

          return (
            <Link
              key={idx}
              href={item.href!}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-full transition-colors duration-150 apple-press min-h-[44px] min-w-[44px] apple-focus ${
                isActive
                  ? "text-accent-link font-semibold"
                  : "text-fg-muted hover:text-fg"
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-105" : ""}`} />
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
