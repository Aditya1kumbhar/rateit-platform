import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    review: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
      delete: vi.fn(),
    },
    place: {
      update: vi.fn().mockResolvedValue({}),
    },
    list: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    businessClaim: {
      findFirst: vi.fn(),
    },
    bizReply: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    moderationAction: {
      create: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => {
      if (typeof cb === "function") {
        return cb(prisma)
      }
      return cb
    }),
  },
}))

vi.mock("@/lib/server-auth", () => ({
  getAuthenticatedUser: vi.fn(),
  isAdmin: vi.fn(),
}))

vi.mock("@/lib/ratelimit", () => ({
  generalApiRateLimit: null,
  enforceRateLimit: vi.fn().mockResolvedValue({ success: true }),
  rateLimitResponse: vi.fn(),
  getIpFromRequest: vi.fn().mockReturnValue("127.0.0.1"),
}))

import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser, isAdmin } from "@/lib/server-auth"
import { PUT as editReview, DELETE as deleteReview } from "@/app/api/reviews/[id]/route"
import { POST as replyReview } from "@/app/api/reviews/[id]/reply/route"
import { PUT as editList, DELETE as deleteList } from "@/app/api/lists/[id]/route"
import { POST as moderateAction } from "@/app/api/admin/moderation/route"

describe("P1.1 Authorization Matrix Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("User B gets 403 when trying to edit User A's review", async () => {
    // User B is authenticated
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      authUser: { id: "user-b", app_metadata: {} } as any,
      user: { id: "user-b", displayName: "User B" } as any,
    })

    // Review belongs to User A
    vi.mocked(prisma.review.findUnique).mockResolvedValue({
      id: "review-1",
      userId: "user-a",
    } as any)

    const request = new NextRequest("http://localhost:3000/api/reviews/review-1", {
      method: "PUT",
      body: JSON.stringify({ rating: 4, text: "Unauthorized modification" }),
    })

    const response = await editReview(request, { params: { id: "review-1" } })
    expect(response.status).toBe(403)
    const json = await response.json()
    expect(json.error).toContain("Forbidden")
  })

  it("User B gets 403 when trying to delete User A's review (non-admin)", async () => {
    // User B is authenticated, not an admin
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      authUser: { id: "user-b", app_metadata: { role: "user" } } as any,
      user: { id: "user-b", displayName: "User B" } as any,
    })
    vi.mocked(isAdmin).mockReturnValue(false)

    // Review belongs to User A
    vi.mocked(prisma.review.findUnique).mockResolvedValue({
      id: "review-1",
      userId: "user-a",
    } as any)

    const request = new NextRequest("http://localhost:3000/api/reviews/review-1", {
      method: "DELETE",
    })

    const response = await deleteReview(request, { params: { id: "review-1" } })
    expect(response.status).toBe(403)
    const json = await response.json()
    expect(json.error).toContain("Forbidden")
  })

  it("Admin CAN delete User A's review", async () => {
    // Admin is authenticated
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      authUser: { id: "admin-user", app_metadata: { role: "admin" } } as any,
      user: { id: "admin-user", displayName: "Admin" } as any,
    })
    vi.mocked(isAdmin).mockReturnValue(true)

    // Review belongs to User A
    vi.mocked(prisma.review.findUnique).mockResolvedValue({
      id: "review-1",
      userId: "user-a",
    } as any)
    vi.mocked(prisma.review.delete).mockResolvedValue({ id: "review-1" } as any)

    const request = new NextRequest("http://localhost:3000/api/reviews/review-1", {
      method: "DELETE",
    })

    const response = await deleteReview(request, { params: { id: "review-1" } })
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.success).toBe(true)
  })

  it("User without approved business claim gets 403 on business reply", async () => {
    // User C is authenticated
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      authUser: { id: "user-c", app_metadata: {} } as any,
      user: { id: "user-c", displayName: "User C" } as any,
    })

    // Review exists for place-1
    vi.mocked(prisma.review.findUnique).mockResolvedValue({
      id: "review-1",
      placeId: "place-1",
      bizReply: null,
    } as any)

    // No approved claim exists for User C on place-1
    vi.mocked(prisma.businessClaim.findFirst).mockResolvedValue(null)

    const request = new NextRequest("http://localhost:3000/api/reviews/review-1/reply", {
      method: "POST",
      body: JSON.stringify({ text: "Thank you for the review" }),
    })

    const response = await replyReview(request, { params: { id: "review-1" } })
    expect(response.status).toBe(403)
    const json = await response.json()
    expect(json.error).toContain("Forbidden")
  })

  it("User with approved business claim CAN reply to review", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      authUser: { id: "biz-owner", app_metadata: {} } as any,
      user: { id: "biz-owner", displayName: "Owner" } as any,
    })

    vi.mocked(prisma.review.findUnique).mockResolvedValue({
      id: "review-1",
      placeId: "place-1",
      bizReply: null,
    } as any)

    // Approved claim exists
    vi.mocked(prisma.businessClaim.findFirst).mockResolvedValue({
      id: "claim-1",
      placeId: "place-1",
      userId: "biz-owner",
      status: "VERIFIED",
    } as any)

    vi.mocked(prisma.bizReply.create).mockResolvedValue({
      id: "reply-1",
      reviewId: "review-1",
      text: "Thank you for the visit!",
    } as any)

    const request = new NextRequest("http://localhost:3000/api/reviews/review-1/reply", {
      method: "POST",
      body: JSON.stringify({ text: "Thank you for the visit!" }),
    })

    const response = await replyReview(request, { params: { id: "review-1" } })
    expect(response.status).toBe(201)
    const json = await response.json()
    expect(json.success).toBe(true)
  })

  it("User B gets 403 on modifying User A's list", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      authUser: { id: "user-b", app_metadata: {} } as any,
      user: { id: "user-b", displayName: "User B" } as any,
    })

    vi.mocked(prisma.list.findUnique).mockResolvedValue({
      id: "list-1",
      userId: "user-a",
    } as any)

    const request = new NextRequest("http://localhost:3000/api/lists/list-1", {
      method: "PUT",
      body: JSON.stringify({ name: "Hacked List" }),
    })

    const response = await editList(request, { params: { id: "list-1" } })
    expect(response.status).toBe(403)
    const json = await response.json()
    expect(json.error).toContain("Forbidden")
  })

  it("Non-admin gets 403 on moderation endpoint", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      authUser: { id: "user-regular", app_metadata: { role: "user" } } as any,
      user: { id: "user-regular", displayName: "Regular User" } as any,
    })
    vi.mocked(isAdmin).mockReturnValue(false)

    const request = new NextRequest("http://localhost:3000/api/admin/moderation", {
      method: "POST",
      body: JSON.stringify({
        action: "hide",
        targetType: "review",
        targetId: "11111111-1111-1111-1111-111111111111",
        reason: "Spam content",
      }),
    })

    const response = await moderateAction(request)
    expect(response.status).toBe(403)
    const json = await response.json()
    expect(json.error).toContain("Forbidden")
  })
})
