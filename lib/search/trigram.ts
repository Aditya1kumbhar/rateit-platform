/**
 * Trigram Similarity & String Relevance Engine
 * Implements the standard PostgreSQL pg_trgm similarity algorithm:
 * Trigram count intersection / union on normalized strings.
 */

export function extractTrigrams(input: string): Set<string> {
  const normalized = `  ${input.toLowerCase().trim()} `
  const trigrams = new Set<string>()

  for (let i = 0; i < normalized.length - 2; i++) {
    trigrams.add(normalized.substring(i, i + 3))
  }

  return trigrams
}

/**
 * Computes trigram similarity between two strings (0.0 to 1.0).
 * Matches PostgreSQL pg_trgm `similarity(a, b)`.
 */
export function calculateTrigramSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0.0

  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()

  if (s1 === s2) return 1.0

  // Exact prefix match rule from P4.2: exact-prefix match = 1.0
  if (s2.startsWith(s1) || s1.startsWith(s2)) {
    return 1.0
  }

  const tri1 = extractTrigrams(s1)
  const tri2 = extractTrigrams(s2)

  if (tri1.size === 0 || tri2.size === 0) return 0.0

  let intersectionCount = 0
  for (const t of tri1) {
    if (tri2.has(t)) {
      intersectionCount++
    }
  }

  const unionCount = tri1.size + tri2.size - intersectionCount
  if (unionCount <= 0) return 0.0

  return Math.round((intersectionCount / unionCount) * 1000) / 1000
}

/**
 * Finds the highest-similarity Category enum for zero-result fallback.
 */
const CATEGORY_NAMES: Record<string, string> = {
  COACHING: "Coaching Classes JEE NEET UPSC Board Exams",
  PG_HOSTEL: "PG Hostels Co-living Student Accommodation",
  LOCAL_SERVICE: "Local Services Electrician Plumber Laundry Cleaning",
  RESTAURANT: "Restaurants Dining Food Meals Thali",
  CAFE: "Cafes Coffee Tea Chai Snacks Bakery",
}

export function findBestCategoryFallback(query: string): string | null {
  const q = query.toLowerCase().trim()
  let bestCategory: string | null = null
  let highestSim = 0

  for (const [cat, keywords] of Object.entries(CATEGORY_NAMES)) {
    const simName = calculateTrigramSimilarity(q, cat)
    const simDesc = calculateTrigramSimilarity(q, keywords)
    const maxSim = Math.max(simName, simDesc)

    // Direct substring check
    if (keywords.toLowerCase().includes(q) || cat.toLowerCase().includes(q)) {
      return cat
    }

    if (maxSim > highestSim) {
      highestSim = maxSim
      bestCategory = cat
    }
  }

  return highestSim >= 0.15 ? bestCategory : "CAFE" // fallback to popular category
}

