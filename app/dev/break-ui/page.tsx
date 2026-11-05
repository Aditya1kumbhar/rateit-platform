import { ItemClient } from "@/app/item/[id]/item-client"
import { BreakUIToggle } from "@/components/break-ui-toggle"
import { WORST_CASE_PLACE, EMPTY_PLACE, SINGLE_REVIEW_PLACE } from "@/lib/mock-worst-case"
import { PUNE_SEED_PLACES, PUNE_SEED_REVIEWS } from "@/lib/mock"

export const dynamic = "force-dynamic"

interface BreakUIPageProps {
  searchParams?: {
    data?: string
  }
}

export default function BreakUIPage({ searchParams }: BreakUIPageProps) {
  const mode = searchParams?.data || "worst" // default to worst case for this route

  let place: any
  if (mode === "demo") {
    const demo = PUNE_SEED_PLACES[0]
    place = {
      ...demo,
      isVerifiedBiz: true,
      reviews: PUNE_SEED_REVIEWS.slice(0, 2).map((r, i) => ({
        id: `demo_rev_${i}`,
        rating: r.rating,
        text: r.text,
        tags: r.tags,
        photoUrls: [],
        checkinVerified: r.checkinVerified,
        publishDate: new Date(Date.now() - i * 86400000),
        user: {
          id: `demo_user_${i}`,
          displayName: r.displayName,
          avatarUrl: null,
          trustScore: r.trustTier === "trusted" ? 85 : 55,
        },
        bizReply: null,
      })),
    }
  } else if (mode === "empty") {
    place = EMPTY_PLACE
  } else if (mode === "single") {
    place = SINGLE_REVIEW_PLACE
  } else {
    place = WORST_CASE_PLACE
  }

  return (
    <main className="min-h-screen pb-24">
      <div className="bg-amber-950/40 border-b border-amber-800/40 px-4 py-2 text-center text-xs text-amber-300 font-mono">
        Adversarial Break-UI Testing Harness &bull; Mode:{" "}
        <span className="font-bold uppercase tracking-wider text-amber-200">
          {mode}
        </span>
      </div>
      <ItemClient place={place} />
      <BreakUIToggle />
    </main>
  )
}

