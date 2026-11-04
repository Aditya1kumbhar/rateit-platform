import { z } from "zod"

export const categorySchema = z.enum(["COACHING", "PG_HOSTEL", "LOCAL_SERVICE", "RESTAURANT", "CAFE"])
export const visibilitySchema = z.enum(["PUBLIC", "PRIVATE", "HIDDEN"])
export const flagReasonSchema = z.enum(["FAKE_REVIEW", "OFFENSIVE", "IRRELEVANT", "SPAM", "DEFAMATORY"])

export const exifDataSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  timestamp: z.union([z.string(), z.date()]).optional(),
  deviceMake: z.string().max(100).optional(),
  deviceModel: z.string().max(100).optional(),
  hasGps: z.boolean(),
}).strict()

export const reviewSchema = z.object({
  placeId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().trim().max(500).optional().transform((value) => value || null),
  tags: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
  photoUrls: z.array(z.string().url()).max(5).default([]),
  photoExifData: z.array(exifDataSchema).max(5).nullable().optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
  checkinLat: z.coerce.number().min(-90).max(90).optional(),
  checkinLng: z.coerce.number().min(-180).max(180).optional(),
  checkinVerified: z.boolean().optional(),
  consentGiven: z.boolean().optional(),
  turnstileToken: z.string().optional(),
}).strict()

export const updateReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  text: z.string().trim().max(500).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
}).strict()

export const flagReviewSchema = z.object({
  reason: flagReasonSchema,
  detail: z.string().trim().max(500).optional().transform((v) => v || null),
}).strict()

export const bizReplySchema = z.object({
  text: z.string().trim().min(1).max(1000),
}).strict()

export const moderationActionSchema = z.object({
  action: z.enum(["hide", "unhide", "ban_user", "dismiss_flag"]),
  targetType: z.enum(["review", "user", "grievance"]),
  targetId: z.string().uuid(),
  reason: z.string().trim().min(3).max(500),
}).strict()

export const grievanceSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(120),
  phone: z.string().trim().max(20).optional(),
  reportType: z.enum(["content_complaint", "data_rights", "moderation_appeal", "business_dispute"]),
  targetReviewId: z.string().uuid().optional(),
  description: z.string().trim().min(10).max(2000),
  turnstileToken: z.string().optional(),
}).strict()

export const businessClaimSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("auto"),
    placeId: z.string().uuid(),
    turnstileToken: z.string().optional(),
  }).strict(),
  z.object({
    type: z.literal("manual"),
    placeId: z.string().uuid(),
    documentUrl: z.string().url().max(2_000),
    turnstileToken: z.string().optional(),
  }).strict(),
])

export const createListSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).optional().transform((value) => value || null),
  isPrivate: z.boolean().default(false),
  iconName: z.string().trim().min(1).max(40).default("Heart"),
  placeIds: z.array(z.string().uuid()).max(100).default([]),
}).strict()

export const updateListSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  isPrivate: z.boolean().optional(),
  iconName: z.string().trim().min(1).max(40).optional(),
  placeIds: z.array(z.string().uuid()).max(100).optional(),
}).strict()

export const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(80).optional(),
  bio: z.string().trim().max(500).nullable().optional(),
  avatarUrl: z.string().url().max(2_000).nullable().optional(),
  consentGiven: z.literal(true).optional(),
}).strict()

export const createPlaceSchema = z.object({
  name: z.string().trim().min(2).max(160),
  category: categorySchema,
  description: z.string().trim().max(2_000).nullable().optional(),
  address: z.string().trim().min(2).max(300),
  city: z.string().trim().min(2).max(100).default("Pune"),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  priceRange: z.enum(["$", "$$", "$$$"]).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  imageUrl: z.string().url().max(2_000).nullable().optional(),
}).strict()

export const placesQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.union([categorySchema, z.literal("all")]).optional(),
  sortBy: z.enum(["rating", "reviews", "name"]).default("rating"),
  take: z.coerce.number().int().min(1).max(50).default(20),
  skip: z.coerce.number().int().min(0).default(0),
}).strict()

// Phase 2: Event tracking validation
export const singleEventSchema = z.object({
  type: z.enum([
    "place_view",
    "place_dwell",
    "category_browse",
    "search_query",
    "search_click",
    "review_submit",
    "review_helpful",
    "place_save",
    "list_add",
    "share_click",
    "feed_impression",
  ]),
  placeId: z.string().uuid().optional(),
  category: categorySchema.optional(),
  query: z.string().trim().max(200).optional(),
  dwellMs: z.number().int().min(0).max(600_000).optional(),
  deviceHash: z.string().max(128).optional(),
}).strict()

export const eventBatchSchema = z.object({
  sessionId: z.string().min(1).max(128),
  events: z.array(singleEventSchema).min(1).max(25),
}).strict()

// Phase 3 & 4: Feed & Search validation
export const feedQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
}).strict()

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(200),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
}).strict()

export const searchSuggestQuerySchema = z.object({
  q: z.string().trim().min(2).max(100),
}).strict()
