/**
 * Central Personalization & Platform Configuration
 *
 * All weights, decay rates, rate limiters, Bayesian hyperparameters,
 * and diversity exploration constants live here for easy tuning.
 */

export const CONFIG = {
  // P1.3 Rate Limits
  rateLimits: {
    reviewSubmit: { points: 5, duration: "1 h" as const },
    authAttempts: { points: 10, duration: "15 m" as const },
    eventsIngest: { points: 120, duration: "1 m" as const },
    search: { points: 60, duration: "1 m" as const },
    feed: { points: 120, duration: "1 m" as const },
    generalApi: { points: 300, duration: "1 m" as const },
  },

  // P1.7 Moderation threshold
  flagsToAutoHide: 3,

  // P2.2 Ingest
  maxEventsPerBatch: 25,
  dwellTriggerMs: 3_000,
  maxDwellMs: 120_000,
  dwellAffinityPer10s: 1.0,
  maxDwellPointsPerView: 3.0,

  // P2.3 Event affinity weights W(type)
  eventWeights: {
    review_submit: 5.0,
    place_save: 3.0,
    list_add: 3.0,
    search_click: 2.0,
    share_click: 2.0,
    review_helpful: 1.0,
    place_dwell: 1.0, // 1 per full 10s, max 3 per view
    category_browse: 0.5,
    place_view: 0.5,
  } as Record<string, number>,

  // P2.4 Decay
  decayHalfLifeDays: 30,

  // P2.5 Cold start
  coldStartEventThreshold: 20,

  // P3.2 Candidate generation
  feedRadiusKm: 10,
  feedRecentReviewsDays: 14,
  feedTrendingDays: 7,

  // P3.3 Scoring weights
  feedWeights: {
    affinityMatch: 0.35,
    quality: 0.25,
    proximity: 0.20,
    freshness: 0.10,
    trust: 0.10,
  },

  // P3.4 Diversity (MMR-style)
  diversityMaxPerCategoryTop10: 2,
  diversityPenaltyPerPriorPick: 0.85,

  // P3.5 Exploration
  explorationRatio: 0.15,
  explorationSlots: [4, 10, 16], // 0-indexed positions 5, 11, 17
  explorationInterval: 7, // then every 7th
  explorationMinQuality: 0.6,
  explorationMaxReviews: 10,

  // P4 Search
  searchMinTrigramSimilarity: 0.2,
  searchWeights: {
    textRelevance: 0.40,
    quality: 0.20,
    proximity: 0.20,
    affinityMatch: 0.20,
  },
  searchSuggestMax: 8,
  searchSuggestMinChars: 2,

  // P5.1 Bayesian average
  bayesianM: 10, // CONFIG: prior weight m = 10
  defaultGlobalMean: 4.0, // fallback if DB empty

  // P5.2 Fraud detection heuristics
  burstMaxReviewsPerHour: 8,
  burstMaxAccountAgeDays: 7,
  collusionMinAccounts: 3,
  collusionWindowHours: 24,
  impossibleTravelKm: 50,
  impossibleTravelMinutes: 30,

  // P5.3 Reviewer trust feedback loop
  helpfulVoteTrustIncrement: 1.0, // each helpful vote on a user's review increments their trust by +1
  flagUpheldTrustDecrement: 10.0, // a flag upheld by admin decrements by -10
  fraudFlagTrustDecrement: 15.0, // impossible travel or collusion flag decrements by -15
  trustScoreCap: 100.0,
  trustScoreMin: 0.0,
  trustTiers: {
    communityMemberMax: 40.0, // Community Member < 40
    verifiedVisitorMax: 75.0, // Verified Visitor 40..74
    trustedResidentMin: 75.0, // Trusted Resident >= 75
  },
  helpfulVotesThreshold: 5,
  helpfulTrustBoost: 2.0,
  moderationTrustPenalty: 10.0,
  preModerationTrustThreshold: 40.0,

  // P5.4 Similar places
  collaborativeFilteringMinInteractions: 500,
  similarPlacesCacheTtlMs: 3_600_000, // 1 hour in-memory cache
} as const
