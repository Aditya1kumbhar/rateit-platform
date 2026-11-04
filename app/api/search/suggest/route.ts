import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { searchSuggestQuerySchema } from "@/lib/validation"
import { searchRateLimit, enforceRateLimit, rateLimitResponse, getIpFromRequest } from "@/lib/ratelimit"
import { calculateTrigramSimilarity } from "@/lib/search/trigram"
import { CONFIG } from "@/lib/personalization-config"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const ip = getIpFromRequest(request)
    const rl = await enforceRateLimit(searchRateLimit, `suggest:ip:${ip}`)
    if (!rl.success) {
      return rateLimitResponse(rl)
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""

    const input = searchSuggestQuerySchema.safeParse({ q: query })
    if (!input.success) {
      return NextResponse.json(
        { success: false, error: "Suggest requires at least 2 characters", suggestions: [] },
        { status: 400 }
      )
    }

    const q = input.data.q.toLowerCase().trim()

    // 1. Fetch place name suggestions (prefix match prioritized, then trigram > 0.2)
    const places = await prisma.place.findMany({
      select: { id: true, name: true, category: true },
      take: 50,
    })

    const placeMatches: { text: string; type: "place"; id: string; category: string; sim: number }[] = []
    for (const p of places) {
      const lowerName = p.name.toLowerCase()
      if (lowerName.startsWith(q)) {
        placeMatches.push({ text: p.name, type: "place", id: p.id, category: p.category, sim: 1.0 })
      } else {
        const sim = calculateTrigramSimilarity(q, p.name)
        if (sim >= CONFIG.searchMinTrigramSimilarity) {
          placeMatches.push({ text: p.name, type: "place", id: p.id, category: p.category, sim })
        }
      }
    }

    placeMatches.sort((a, b) => b.sim - a.sim)

    // 2. Fetch trending queries from SearchLog
    const searchLogs = await prisma.searchLog.findMany({
      where: {
        city: "Pune",
        resultCount: { gt: 0 },
      },
      orderBy: { count: "desc" },
      take: 20,
    })

    const queryMatches: { text: string; type: "query"; sim: number }[] = []
    for (const log of searchLogs) {
      const lowerQuery = log.query.toLowerCase()
      if (lowerQuery.startsWith(q)) {
        queryMatches.push({ text: log.query, type: "query", sim: 0.95 })
      } else {
        const sim = calculateTrigramSimilarity(q, log.query)
        if (sim >= CONFIG.searchMinTrigramSimilarity) {
          queryMatches.push({ text: log.query, type: "query", sim })
        }
      }
    }

    queryMatches.sort((a, b) => b.sim - a.sim)

    // 3. Merge suggestions up to 8
    const merged: { text: string; type: string; category?: string; id?: string }[] = []
    const seenTexts = new Set<string>()

    // Interleave top place matches and top query matches
    let pIdx = 0
    let qIdx = 0

    while (merged.length < CONFIG.searchSuggestMax && (pIdx < placeMatches.length || qIdx < queryMatches.length)) {
      if (pIdx < placeMatches.length) {
        const p = placeMatches[pIdx++]
        const key = p.text.toLowerCase()
        if (!seenTexts.has(key)) {
          seenTexts.add(key)
          merged.push({ text: p.text, type: "place", category: p.category, id: p.id })
        }
      }

      if (merged.length >= CONFIG.searchSuggestMax) break

      if (qIdx < queryMatches.length) {
        const qm = queryMatches[qIdx++]
        const key = qm.text.toLowerCase()
        if (!seenTexts.has(key)) {
          seenTexts.add(key)
          merged.push({ text: qm.text, type: "query" })
        }
      }
    }

    return NextResponse.json({
      success: true,
      query: q,
      suggestions: merged,
    })
  } catch (error) {
    console.error("GET /api/search/suggest error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

