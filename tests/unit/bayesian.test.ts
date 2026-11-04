import { describe, it, expect } from "vitest"
import { calculateBayesianRating, rescaleRatingToNormalized } from "@/lib/bayesian"
import { CONFIG } from "@/lib/personalization-config"

describe("P5.1 Bayesian Rating Formula Tests", () => {
  const globalMean = 3.8
  const m = CONFIG.bayesianM // 10

  it("returns global mean C when a place has 0 reviews (v = 0)", () => {
    const bayesian = calculateBayesianRating(0, 0, globalMean, m)
    expect(bayesian).toBe(globalMean)
  })

  it("pulls rating halfway towards prior when review count v equals prior weight m", () => {
    // v = 10, m = 10, R = 5.0, C = 3.0
    // (10 / 20) * 5.0 + (10 / 20) * 3.0 = 4.0
    const bayesian = calculateBayesianRating(10, 5.0, 3.0, 10)
    expect(bayesian).toBe(4.0)
  })

  it("converges towards true mean R as review count v grows large", () => {
    // v = 90, m = 10, R = 5.0, C = 3.0
    // (90 / 100) * 5.0 + (10 / 100) * 3.0 = 4.8
    const bayesian = calculateBayesianRating(90, 5.0, 3.0, 10)
    expect(bayesian).toBe(4.8)

    // v = 990, m = 10, R = 4.9, C = 3.5
    // (990 / 1000) * 4.9 + (10 / 1000) * 3.5 = 4.851 + 0.035 = 4.886 -> 4.89
    const largeV = calculateBayesianRating(990, 4.9, 3.5, 10)
    expect(largeV).toBeCloseTo(4.89, 2)
  })

  it("rescales ratings to 0..1 range accurately", () => {
    expect(rescaleRatingToNormalized(5.0)).toBe(1.0)
    expect(rescaleRatingToNormalized(2.5)).toBe(0.5)
    expect(rescaleRatingToNormalized(0.0)).toBe(0.0)
  })
})

