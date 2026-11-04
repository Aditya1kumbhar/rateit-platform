/**
 * iOS 27 Liquid Glass Intensity Controller
 * Reads and persists user-controlled --glass-level (0.0 clear to 1.0 frosted)
 */

export function getGlassLevel(): number {
  if (typeof window === "undefined") return 0.5
  try {
    const saved = localStorage.getItem("glass-level")
    if (saved !== null) {
      const parsed = parseFloat(saved)
      if (!isNaN(parsed)) {
        return Math.max(0, Math.min(1, parsed))
      }
    }
  } catch {
    // localStorage unavailable or restricted
  }
  return 0.5
}

export function setGlassLevel(n: number): void {
  const clamped = Math.max(0, Math.min(1, n))
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("glass-level", clamped.toString())
    } catch {
      // localStorage write error ignored
    }
    document.documentElement.style.setProperty("--glass-level", clamped.toString())
  }
}
