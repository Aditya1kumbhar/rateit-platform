import { describe, it, expect } from "vitest"
import { calculateDecayedAffinity, normalizeAffinityVector } from "@/lib/interest"

describe("P2.4 Affinity Decay & Vector Normalization Tests", () => {
  it("halves affinity after exactly 30 days (1 half-life)", () => {
    const initialAffinity = 10.0
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const decayed = calculateDecayedAffinity(initialAffinity, thirtyDaysAgo, now)
    expect(decayed).toBeCloseTo(5.0, 3)
  })

  it("quarters affinity after 60 days (2 half-lives)", () => {
    const initialAffinity = 16.0
    const now = new Date()
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    const decayed = calculateDecayedAffinity(initialAffinity, sixtyDaysAgo, now)
    expect(decayed).toBeCloseTo(4.0, 3)
  })

  it("leaves affinity unchanged when updated just now", () => {
    const initialAffinity = 8.5
    const now = new Date()

    const decayed = calculateDecayedAffinity(initialAffinity, now, now)
    expect(decayed).toBe(8.5)
  })

  it("normalizes user vector to 0..1 by dividing by max category value", () => {
    const raw = new Map<string, number>([
      ["CAFE", 10.0],
      ["RESTAURANT", 5.0],
      ["PG_HOSTEL", 2.0],
    ])

    const normalized = normalizeAffinityVector(raw)

    expect(normalized.get("CAFE")).toBe(1.0)
    expect(normalized.get("RESTAURANT")).toBe(0.5)
    expect(normalized.get("PG_HOSTEL")).toBe(0.2)
  })

  it("handles empty and zero vectors cleanly", () => {
    const emptyMap = new Map<string, number>()
    expect(normalizeAffinityVector(emptyMap).size).toBe(0)

    const zeroMap = new Map<string, number>([["COACHING", 0]])
    const normalized = normalizeAffinityVector(zeroMap)
    expect(normalized.get("COACHING")).toBe(0)
  })
})

