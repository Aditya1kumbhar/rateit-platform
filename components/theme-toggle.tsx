"use client"

import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const isDark = document.documentElement.classList.contains("dark")
    setTheme(isDark ? "dark" : "light")
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark"
    setTheme(nextTheme)

    if (nextTheme === "dark") {
      document.documentElement.classList.remove("light")
      document.documentElement.classList.add("dark")
      document.documentElement.setAttribute("data-theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      document.documentElement.classList.add("light")
      document.documentElement.setAttribute("data-theme", "light")
    }

    try {
      localStorage.setItem("rateit-theme", nextTheme)
    } catch {
      // localStorage may be unavailable in private browsing
    }
  }

  // Prevent hydration mismatch by rendering a stable placeholder
  if (!mounted) {
    return (
      <div
        className={`w-9 h-9 rounded-full bg-surface-2 border border-hairline/[0.08] flex items-center justify-center ${className}`}
        aria-hidden="true"
      >
        <span className="w-4 h-4" />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={theme === "dark" ? "Switch to Apple Light theme" : "Switch to Dark theme"}
      className={`w-9 h-9 rounded-full bg-surface-2 hover:bg-surface-3 border border-hairline/[0.08] text-fg flex items-center justify-center transition-[background-color,transform] duration-150 apple-press apple-focus cursor-pointer ${className}`}
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-warning transition-transform duration-150" />
      ) : (
        <Moon className="w-4 h-4 text-accent-link transition-transform duration-150" />
      )}
    </button>
  )
}
