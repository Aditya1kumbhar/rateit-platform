/**
 * Fraud Detection Heuristics
 * 
 * Server-side fraud checks that don't require ML.
 * These run on review submission and flag suspicious activity.
 * 
 * Heuristics:
 * 1. Near-duplicate text detection (templated/copy-paste reviews)
 * 2. Impossible travel detection (GPS spoofing)
 * 3. Bulk posting detection (bot behavior)
 * 4. EXIF cross-check (photo location vs review location)
 */

import { haversineDistance } from "./geolocation"
import { CONFIG } from "./personalization-config"

export interface FraudCheckResult {
  isSuspicious: boolean
  flags: FraudFlag[]
  riskScore: number // 0-100, higher = more suspicious
}

export interface FraudFlag {
  type: 'DUPLICATE_TEXT' | 'IMPOSSIBLE_TRAVEL' | 'BULK_POSTING' | 'EXIF_MISMATCH' | 'NEW_ACCOUNT_BURST' | 'COLLUSION_NETWORK' | 'BURST_ON_PLACE'
  severity: 'low' | 'medium' | 'high'
  detail: string
}

// ============================================================
// 1. Near-Duplicate Text Detection
// Uses Jaccard similarity on word bigrams. No LLM needed.
// ============================================================

/**
 * Generate word bigrams from text for similarity comparison.
 */
function getBigrams(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Strip punctuation
    .split(/\s+/)
    .filter((w) => w.length > 2) // Ignore very short words

  const bigrams = new Set<string>()
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.add(`${words[i]}_${words[i + 1]}`)
  }
  return bigrams
}

/**
 * Compute Jaccard similarity between two texts.
 * Returns 0-1 where 1 = identical.
 */
export function jaccardSimilarity(text1: string, text2: string): number {
  const set1 = getBigrams(text1)
  const set2 = getBigrams(text2)

  if (set1.size === 0 && set2.size === 0) return 0

  let intersection = 0
  set1.forEach((bigram) => {
    if (set2.has(bigram)) intersection++
  })

  const union = set1.size + set2.size - intersection
  return union === 0 ? 0 : intersection / union
}

/**
 * Check if a new review's text is suspiciously similar to existing reviews.
 * Threshold: 0.6 Jaccard similarity = likely templated/copy-pasted.
 */
export function detectNearDuplicateText(
  newText: string,
  existingTexts: string[],
  threshold: number = 0.6
): { isDuplicate: boolean; maxSimilarity: number; matchedText?: string } {
  if (!newText || newText.length < 20) {
    return { isDuplicate: false, maxSimilarity: 0 }
  }

  let maxSimilarity = 0
  let matchedText: string | undefined

  for (const existing of existingTexts) {
    if (!existing || existing.length < 20) continue
    const similarity = jaccardSimilarity(newText, existing)
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity
      matchedText = existing
    }
  }

  return {
    isDuplicate: maxSimilarity >= threshold,
    maxSimilarity: Math.round(maxSimilarity * 100) / 100,
    matchedText: maxSimilarity >= threshold ? matchedText : undefined,
  }
}

// ============================================================
// 2. Bulk Posting Detection
// ============================================================

/**
 * Detect if a user is posting reviews at an abnormally high rate.
 */
export function detectBulkPosting(
  reviewTimestamps: Date[],
  windowMinutes: number = 60,
  maxReviews: number = 5
): { isBulk: boolean; count: number; windowMinutes: number } {
  const now = new Date()
  const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000)

  const recentCount = reviewTimestamps.filter(
    (ts) => new Date(ts) >= windowStart
  ).length

  return {
    isBulk: recentCount >= maxReviews,
    count: recentCount,
    windowMinutes,
  }
}

// ============================================================
// 3. New Account Burst Detection
// ============================================================

/**
 * Flag if a brand-new account (<24 hours old) posts >3 reviews.
 * Common bot pattern: create account, flood reviews, abandon.
 */
export function detectNewAccountBurst(
  accountCreatedAt: Date,
  totalReviewCount: number,
  threshold: number = 3
): { isSuspicious: boolean; accountAgeHours: number } {
  const now = new Date()
  const ageHours =
    (now.getTime() - new Date(accountCreatedAt).getTime()) / (1000 * 60 * 60)

  return {
    isSuspicious: ageHours < 24 && totalReviewCount >= threshold,
    accountAgeHours: Math.round(ageHours * 10) / 10,
  }
}

/**
 * P5.2 (a): Flag when a place receives more than 8 reviews in 1 hour from accounts younger than 7 days.
 */
export function detectYoungAccountBurstOnPlace(
  recentReviewsOnPlace: { accountAgeDays: number; createdAt: Date }[]
): { isBurst: boolean; count: number } {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const burstReviews = recentReviewsOnPlace.filter(
    (r) => new Date(r.createdAt) >= oneHourAgo && r.accountAgeDays < CONFIG.burstMaxAccountAgeDays
  )

  return {
    isBurst: burstReviews.length > CONFIG.burstMaxReviewsPerHour,
    count: burstReviews.length,
  }
}

/**
 * P5.2 (b): Flag when 3 or more accounts share one deviceHash or ipHash and review the same place within 24 hours.
 */
export function detectCollusionNetwork(
  recentReviewsOnPlace: { userId: string; ipHash: string; deviceHash: string; createdAt: Date }[]
): { isCollusion: boolean; sharedHash?: string; count: number } {
  const twentyFourHoursAgo = new Date(Date.now() - CONFIG.collusionWindowHours * 60 * 60 * 1000)
  const windowReviews = recentReviewsOnPlace.filter((r) => new Date(r.createdAt) >= twentyFourHoursAgo)

  // Group by ipHash
  const ipGroups = new Map<string, Set<string>>()
  // Group by deviceHash
  const deviceGroups = new Map<string, Set<string>>()

  for (const r of windowReviews) {
    if (r.ipHash && r.ipHash !== "anonymous") {
      if (!ipGroups.has(r.ipHash)) ipGroups.set(r.ipHash, new Set())
      ipGroups.get(r.ipHash)!.add(r.userId)
    }

    if (r.deviceHash && r.deviceHash !== "anonymous") {
      if (!deviceGroups.has(r.deviceHash)) deviceGroups.set(r.deviceHash, new Set())
      deviceGroups.get(r.deviceHash)!.add(r.userId)
    }
  }

  for (const [hash, userSet] of ipGroups.entries()) {
    if (userSet.size >= CONFIG.collusionMinAccounts) {
      return { isCollusion: true, sharedHash: `ip:${hash.substring(0, 8)}`, count: userSet.size }
    }
  }

  for (const [hash, userSet] of deviceGroups.entries()) {
    if (userSet.size >= CONFIG.collusionMinAccounts) {
      return { isCollusion: true, sharedHash: `device:${hash.substring(0, 8)}`, count: userSet.size }
    }
  }

  return { isCollusion: false, count: 0 }
}

/**
 * P5.2 (c): Flag when a single user submits reviews for places more than 50 km apart within 30 minutes.
 */
export function detectImpossibleTravelBetweenPlaces(
  recentUserReviews: { lat: number | null; lng: number | null; createdAt: Date }[],
  currentLat?: number | null,
  currentLng?: number | null,
  currentDate: Date = new Date()
): { isImpossibleTravel: boolean; distanceKm: number; timeMinutes: number } {
  if (currentLat === null || currentLat === undefined || currentLng === null || currentLng === undefined) {
    return { isImpossibleTravel: false, distanceKm: 0, timeMinutes: 0 }
  }

  for (const prev of recentUserReviews) {
    if (prev.lat !== null && prev.lng !== null) {
      const msDiff = Math.abs(currentDate.getTime() - new Date(prev.createdAt).getTime())
      const minutes = msDiff / (1000 * 60)

      if (minutes <= CONFIG.impossibleTravelMinutes) {
        const distanceMeters = haversineDistance(currentLat, currentLng, prev.lat, prev.lng)
        const distanceKm = distanceMeters / 1000

        if (distanceKm > CONFIG.impossibleTravelKm) {
          return {
            isImpossibleTravel: true,
            distanceKm: Math.round(distanceKm),
            timeMinutes: Math.round(minutes),
          }
        }
      }
    }
  }

  return { isImpossibleTravel: false, distanceKm: 0, timeMinutes: 0 }
}

// ============================================================
// 4. Composite Fraud Check
// ============================================================

/**
 * Run all fraud heuristics on a review submission.
 * Returns a composite result with individual flags.
 */
export function runFraudChecks(params: {
  reviewText: string
  existingUserReviewTexts: string[]
  userReviewTimestamps: Date[]
  accountCreatedAt: Date
  totalReviewCount: number
  exifWarnings?: string[]
  burstOnPlace?: { accountAgeDays: number; createdAt: Date }[]
  collusionRecentReviews?: { userId: string; ipHash: string; deviceHash: string; createdAt: Date }[]
  impossibleTravelCheckins?: { lat: number | null; lng: number | null; createdAt: Date }[]
  currentLat?: number | null
  currentLng?: number | null
}): FraudCheckResult {
  const flags: FraudFlag[] = []
  let riskScore = 0

  // Check 0: Photo EXIF Cross-check
  if (params.exifWarnings && params.exifWarnings.length > 0) {
    flags.push({
      type: 'EXIF_MISMATCH',
      severity: 'high',
      detail: params.exifWarnings.join('; '),
    })
    riskScore += 35
  }

  // Check 1: Near-duplicate text
  const dupCheck = detectNearDuplicateText(
    params.reviewText,
    params.existingUserReviewTexts
  )
  if (dupCheck.isDuplicate) {
    flags.push({
      type: 'DUPLICATE_TEXT',
      severity: dupCheck.maxSimilarity > 0.8 ? 'high' : 'medium',
      detail: `Review text is ${Math.round(dupCheck.maxSimilarity * 100)}% similar to a previous review`,
    })
    riskScore += dupCheck.maxSimilarity > 0.8 ? 30 : 15
  }

  // Check 2: Bulk posting
  const bulkCheck = detectBulkPosting(params.userReviewTimestamps)
  if (bulkCheck.isBulk) {
    flags.push({
      type: 'BULK_POSTING',
      severity: 'high',
      detail: `${bulkCheck.count} reviews posted in the last ${bulkCheck.windowMinutes} minutes`,
    })
    riskScore += 25
  }

  // Check 3: New account burst
  const burstCheck = detectNewAccountBurst(
    params.accountCreatedAt,
    params.totalReviewCount
  )
  if (burstCheck.isSuspicious) {
    flags.push({
      type: 'NEW_ACCOUNT_BURST',
      severity: 'medium',
      detail: `Account is only ${burstCheck.accountAgeHours} hours old with ${params.totalReviewCount} reviews`,
    })
    riskScore += 20
  }

  // Check 4: P5.2(a) Burst on place from young accounts (>8 reviews in 1 hour from accounts < 7 days old)
  if (params.burstOnPlace && params.burstOnPlace.length > 0) {
    const placeBurst = detectYoungAccountBurstOnPlace(params.burstOnPlace)
    if (placeBurst.isBurst) {
      flags.push({
        type: 'BURST_ON_PLACE',
        severity: 'high',
        detail: `Place received ${placeBurst.count} reviews in 1 hour from accounts under ${CONFIG.burstMaxAccountAgeDays} days old`,
      })
      riskScore += 30
    }
  }

  // Check 5: P5.2(b) Collusion network (3+ accounts sharing IP/device hash in 24 hours)
  if (params.collusionRecentReviews && params.collusionRecentReviews.length > 0) {
    const collusion = detectCollusionNetwork(params.collusionRecentReviews)
    if (collusion.isCollusion) {
      flags.push({
        type: 'COLLUSION_NETWORK',
        severity: 'high',
        detail: `Collusion network detected on place: ${collusion.count} accounts sharing ${collusion.sharedHash}`,
      })
      riskScore += 35
    }
  }

  // Check 6: P5.2(c) Impossible travel (>50km apart within 30 minutes)
  if (params.impossibleTravelCheckins && params.impossibleTravelCheckins.length > 0) {
    const travel = detectImpossibleTravelBetweenPlaces(
      params.impossibleTravelCheckins,
      params.currentLat,
      params.currentLng
    )
    if (travel.isImpossibleTravel) {
      flags.push({
        type: 'IMPOSSIBLE_TRAVEL',
        severity: 'high',
        detail: `Impossible travel detected: user reviewed places ${travel.distanceKm}km apart within ${travel.timeMinutes} minutes`,
      })
      riskScore += 40
    }
  }

  return {
    isSuspicious: riskScore >= 25,
    flags,
    riskScore: Math.min(100, riskScore),
  }
}
