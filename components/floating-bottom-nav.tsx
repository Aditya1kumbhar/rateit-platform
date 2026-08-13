"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Bell, User } from "lucide-react"

/**
 * FloatingBottomNav - A premium iOS "liquid glass" floating bottom navigation component.
 * Generated via Stitch AI MCP for Next.js 14 App Router.
 */
export default function FloatingBottomNav() {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState("home")

  const navItems = [
    { id: "home", label: "Home", href: "/", icon: Home },
    { id: "search", label: "Search", href: "/discover", icon: Search },
    { id: "notifications", label: "Notifications", href: "/notifications", icon: Bell },
    { id: "profile", label: "Profile", href: "/profile", icon: User },
  ]

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md px-2 py-1 pointer-events-auto select-none">
      {/* Liquid Glass Container */}
      <div className="relative flex items-center justify-around p-2 rounded-full bg-slate-900/70 dark:bg-slate-950/70 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] overflow-hidden">
        
        {/* Crisp 1px Translucent Top Light-Refraction Edge */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || activeTab === item.id

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setActiveTab(item.id)}
              className="relative flex flex-col items-center justify-center py-2 px-4 group transition-all duration-300 rounded-full"
            >
              {/* Active Glass Pill Background Highlight */}
              {isActive && (
                <div className="absolute inset-0 bg-white/15 dark:bg-white/20 rounded-full blur-[2px] transition-all duration-300" />
              )}
              
              <Icon 
                size={22} 
                className={`relative z-10 transition-all duration-300 ${
                  isActive 
                    ? "text-amber-400 dark:text-white scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" 
                    : "text-slate-400 hover:text-slate-200 group-hover:scale-105"
                }`}
              />
              
              <span 
                className={`relative z-10 text-[10px] mt-1 font-semibold tracking-tight transition-all duration-300 ${
                  isActive 
                    ? "text-amber-300 dark:text-white opacity-100" 
                    : "text-slate-400 opacity-0 group-hover:opacity-80"
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
