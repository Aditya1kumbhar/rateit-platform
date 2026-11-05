"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

export function BreakUIToggle() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentMode = searchParams.get("data") || "demo"

  const setMode = (mode: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (mode === "demo") {
      params.delete("data")
    } else {
      params.set("data", mode)
    }
    const query = params.toString() ? `?${params.toString()}` : ""
    router.push(`${pathname}${query}`)
  }

  return (
    <aside
      aria-label="Dev UI Stress-Test Mode Selector"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 border border-stone-700/80 p-1 rounded-xl shadow-2xl flex items-center gap-1 backdrop-blur-md text-xs font-sans text-stone-300"
    >
      <span className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold border-r border-stone-800">
        Stress Test
      </span>
      <button
        type="button"
        onClick={() => setMode("demo")}
        className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
          currentMode === "demo"
            ? "bg-white text-stone-950 shadow-sm"
            : "hover:text-white hover:bg-stone-800 text-stone-400"
        }`}
      >
        Demo data
      </button>
      <button
        type="button"
        onClick={() => setMode("worst")}
        className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
          currentMode === "worst"
            ? "bg-red-500 text-white shadow-sm"
            : "hover:text-white hover:bg-stone-800 text-stone-400"
        }`}
      >
        Worst case
      </button>
      <button
        type="button"
        onClick={() => setMode("empty")}
        className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
          currentMode === "empty"
            ? "bg-amber-500 text-white shadow-sm"
            : "hover:text-white hover:bg-stone-800 text-stone-400"
        }`}
      >
        Empty (0)
      </button>
      <button
        type="button"
        onClick={() => setMode("single")}
        className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
          currentMode === "single"
            ? "bg-blue-500 text-white shadow-sm"
            : "hover:text-white hover:bg-stone-800 text-stone-400"
        }`}
      >
        Single (1)
      </button>
    </aside>
  )
}

