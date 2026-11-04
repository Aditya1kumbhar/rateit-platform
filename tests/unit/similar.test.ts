import { describe, it, expect } from "vitest"
import { CONFIG } from "@/lib/personalization-config"

describe("P5.4 Similar Places Math & Logic Tests", () => {
  it("Interaction volume gate threshold is configured at 500", () => {
    expect(CONFIG.collaborativeFilteringMinInteractions).toBe(500)
    expect(CONFIG.similarPlacesCacheTtlMs).toBe(3_600_000) // 1 hour TTL
  })

  it("Computes co-interaction cosine similarity correctly", () => {
    // Target Place A has interactions from users {U1, U2, U3, U4} (size = 4)
    const targetUserIds = ["u1", "u2", "u3", "u4"]
    const normA = Math.sqrt(targetUserIds.length) // sqrt(4) = 2

    // Candidate Place B has interactions from users {U1, U2, U3, U5} (co-interactions = 3, total = 4)
    const placeBUsers = ["u1", "u2", "u3", "u5"]
    const coCountB = 3
    const normB = Math.sqrt(placeBUsers.length) // sqrt(4) = 2
    const cosineB = coCountB / (normA * normB) // 3 / (2 * 2) = 0.75

    // Candidate Place C has interactions from only {U1} (co-interactions = 1, total = 2)
    const placeCUsers = ["u1", "u6"]
    const coCountC = 1
    const normC = Math.sqrt(placeCUsers.length) // sqrt(2) = 1.414
    const cosineC = coCountC / (normA * normC) // 1 / (2 * 1.414) = 0.353

    expect(cosineB).toBe(0.75)
    expect(cosineB).toBeGreaterThan(cosineC)
    expect(cosineC).toBeCloseTo(0.3535, 3)
  })

  it("Cosine similarity ranges from 0.0 (no shared users) to 1.0 (identical users)", () => {
    const normA = Math.sqrt(3) // 3 users
    const coCountIdentical = 3
    const normIdentical = Math.sqrt(3)
    const cosineIdentical = coCountIdentical / (normA * normIdentical)
    expect(cosineIdentical).toBeCloseTo(1.0, 5)

    const coCountDisjoint = 0
    const normDisjoint = Math.sqrt(3)
    const cosineDisjoint = coCountDisjoint / (normA * normDisjoint)
    expect(cosineDisjoint).toBe(0.0)
  })
})
