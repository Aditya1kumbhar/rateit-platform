/**
 * Trust Score Engine
 * 
 * Computes per-reviewer trust scores (0-100) based on heuristic signals.
 * This is RateIT's core differentiator — centralized, explainable, no blockchain.
 * 
 * Trust score determines:
 * - How much weight a user's reviews carry in aggregate ratings
 * - Whether a user's reviews get auto-flagged for moderation
 * - Visual trust badges on the UI
 */

interface TrustUser {
  phoneVerified: boolean
  accountAge: Date
  flagCount: number
  isBanned: boolean
}

interface TrustReview {
  createdAt: Date
  checkinVerified: boolean
  checkinLat?: number | null
  checkinLng?: number | null
  exifMatch?: boolean
  flagCount: number
}

export interface TrustScoreResult {
  score: number
  breakdown: TrustBreakdown
  tier: 'trusted' | 'neutral' | 'suspicious' | 'banned'
  reviewWeight: number
}

export interface TrustBreakdown {
  phoneVerification: number
  accountAge: number
  flagPenalty: number
  velocityPenalty: number
  travelPenalty: number
  checkinBonus: number
  exifBonus: number
}

/**
 * Compute a user's trust score from their profile and recent review history.
 * Called after each review submission + periodically via cron.
 */
export function computeTrustScore(
  user: TrustUser,
  recentReviews: TrustReview[]
): TrustScoreResult {
  if (user.isBanned) {
    return {
      score: 0,
      breakdown: {
        phoneVerification: 0,
        accountAge: 0,
        flagPenalty: 0,
        velocityPenalty: 0,
        travelPenalty: 0,
        checkinBonus: 0,
        exifBonus: 0,
      },
      tier: 'banned',
      reviewWeight: 0,
    }
  }

  let score = 50 // Start neutral
  const breakdown: TrustBreakdown = {
    phoneVerification: 0,
    accountAge: 0,
    flagPenalty: 0,
    velocityPenalty: 0,
    travelPenalty: 0,
    checkinBonus: 0,
    exifBonus: 0,
  }

  // +10 if phone-verified (IS 19000: verifiable identity)
  if (user.phoneVerified) {
    breakdown.phoneVerification = 10
    score += 10
  }

  // +5 per month of account age (max +15)
  const now = new Date()
  const monthsOld = Math.floor(
    (now.getTime() - new Date(user.accountAge).getTime()) / (1000 * 60 * 60 * 24 * 30)
  )
  breakdown.accountAge = Math.min(monthsOld * 5, 15)
  score += breakdown.accountAge

  // -5 per flag received (max -25)
  breakdown.flagPenalty = -Math.min(user.flagCount * 5, 25)
  score += breakdown.flagPenalty

  // -15 if review velocity is suspicious (>5 reviews in 1 hour)
  if (recentReviews.length > 0) {
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const lastHourReviews = recentReviews.filter(
      (r) => new Date(r.createdAt) >= oneHourAgo
    ).length
    if (lastHourReviews > 5) {
      breakdown.velocityPenalty = -15
      score -= 15
    }
  }

  // -10 if impossible travel detected
  if (hasImpossibleTravel(recentReviews)) {
    breakdown.travelPenalty = -10
    score -= 10
  }

  // +10 if >80% of reviews are check-in verified
  if (recentReviews.length >= 3) {
    const verifiedCount = recentReviews.filter((r) => r.checkinVerified).length
    const verifiedRatio = verifiedCount / recentReviews.length
    if (verifiedRatio > 0.8) {
      breakdown.checkinBonus = 10
      score += 10
    }
  }

  // +5 bonus if recent reviews have matching EXIF data
  if (recentReviews.length > 0) {
    const exifMatches = recentReviews.filter((r) => r.exifMatch).length
    if (exifMatches > 0) {
      // Small bonus, but caps out quickly. It's a weak signal as EXIF is often stripped.
      breakdown.exifBonus = Math.min(exifMatches * 2, 5)
      score += breakdown.exifBonus
    }
  }

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score))

  return {
    score,
    breakdown,
    tier: getTrustTier(score),
    reviewWeight: computeReviewWeight(score),
  }
}

/**
 * Detect impossible travel patterns — reviews at places >50km apart
 * within 30 minutes. Indicates GPS spoofing or bot activity.
 */
function hasImpossibleTravel(reviews: TrustReview[]): boolean {
  const geoReviews = reviews
    .filter((r) => r.checkinLat != null && r.checkinLng != null)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  for (let i = 1; i < geoReviews.length; i++) {
    const prev = geoReviews[i - 1]
    const curr = geoReviews[i]

    const timeDiffMinutes =
      (new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime()) /
      (1000 * 60)

    if (timeDiffMinutes <= 30) {
      // Inline Haversine to avoid circular dependency
      const R = 6371000
      const toRad = (deg: number) => (deg * Math.PI) / 180
      const dLat = toRad(curr.checkinLat! - prev.checkinLat!)
      const dLng = toRad(curr.checkinLng! - prev.checkinLng!)
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(prev.checkinLat!)) *
          Math.cos(toRad(curr.checkinLat!)) *
          Math.sin(dLng / 2) ** 2
      const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

      if (distance > 50000) {
        // >50km in <30 minutes
        return true
      }
    }
  }

  return false
}

/**
 * Map a numeric trust score to a human-readable tier.
 */
function getTrustTier(score: number): 'trusted' | 'neutral' | 'suspicious' | 'banned' {
  if (score >= 70) return 'trusted'
  if (score >= 40) return 'neutral'
  if (score > 0) return 'suspicious'
  return 'banned'
}

/**
 * Compute how much weight a review should carry in aggregate ratings.
 * Trusted users have more influence; suspicious users' reviews barely count.
 */
function computeReviewWeight(trustScore: number): number {
  if (trustScore >= 70) return 1.0
  if (trustScore >= 50) return 0.8
  if (trustScore >= 30) return 0.5
  if (trustScore > 0) return 0.2
  return 0 // Banned users' reviews don't count
}

/**
 * Get display info for trust tier (for UI badges).
 */
export function getTrustTierDisplay(tier: string): {
  label: string
  color: string
  bgColor: string
  icon: string
} {
  switch (tier) {
    case 'trusted':
      return {
        label: 'Trusted Reviewer',
        color: 'text-green-700',
        bgColor: 'bg-green-50 border-green-200',
        icon: '✅',
      }
    case 'neutral':
      return {
        label: 'Reviewer',
        color: 'text-gray-700',
        bgColor: 'bg-gray-50 border-gray-200',
        icon: '👤',
      }
    case 'suspicious':
      return {
        label: 'Under Review',
        color: 'text-orange-700',
        bgColor: 'bg-orange-50 border-orange-200',
        icon: '⚠️',
      }
    default:
      return {
        label: 'Restricted',
        color: 'text-red-700',
        bgColor: 'bg-red-50 border-red-200',
        icon: '🚫',
      }
  }
}
