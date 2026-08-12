import { z } from "zod"

const categorySchema = z.enum(["COACHING", "PG_HOSTEL", "LOCAL_SERVICE", "RESTAURANT", "CAFE"])
const visibilitySchema = z.enum(["PUBLIC", "PRIVATE"])

export const reviewSchema = z.object({
  placeId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().trim().max(500).optional().transform((value) => value || null),
  tags: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
  photoUrls: z.array(z.string().url()).max(5).default([]),
  visibility: visibilitySchema.default("PUBLIC"),
  checkinLat: z.coerce.number().min(-90).max(90).optional(),
  checkinLng: z.coerce.number().min(-180).max(180).optional(),
})

export const businessClaimSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("auto"), placeId: z.string().uuid() }),
  z.object({
    type: z.literal("manual"),
    placeId: z.string().uuid(),
    documentUrl: z.string().url().max(2_000),
  }),
])

export const createListSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).optional().transform((value) => value || null),
  isPrivate: z.boolean().default(false),
  iconName: z.string().trim().min(1).max(40).default("Heart"),
  placeIds: z.array(z.string().uuid()).max(100).default([]),
})

export const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(80).optional(),
  bio: z.string().trim().max(500).nullable().optional(),
  avatarUrl: z.string().url().max(2_000).nullable().optional(),
  consentGiven: z.literal(true).optional(),
})

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
})

export const placesQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.union([categorySchema, z.literal("all")]).optional(),
  sortBy: z.enum(["rating", "reviews", "name"]).default("rating"),
  take: z.coerce.number().int().min(1).max(50).default(20),
  skip: z.coerce.number().int().min(0).default(0),
})
