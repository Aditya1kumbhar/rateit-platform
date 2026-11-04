import { Metadata } from 'next'
import Link from 'next/link'
import { ShieldAlert, ChevronRight, CheckCircle2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Review Moderation Policy: RateIT Pune',
  description: 'RateIT review moderation and anti-fraud policy in compliance with IS 19000:2022 and IT Rules 2021.',
}

export default function ModerationPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-fg-subtle">
        <Link href="/" className="hover:text-accent-link transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-fg-subtle/60" />
        <span className="text-fg font-medium">Review Moderation Policy</span>
      </nav>

      {/* Hero Header */}
      <div className="p-6 sm:p-8 rounded-modal bg-surface relative overflow-hidden space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs text-accent-link font-semibold uppercase tracking-wider">
          <ShieldAlert className="w-3.5 h-3.5" />
          IS 19000:2022 Standard
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.022em] text-fg">
          Review Moderation & Trust Engine
        </h1>
        <p className="text-xs text-fg-subtle">
          Last updated: August 2026 • Bureau of Indian Standards (BIS) IS 19000:2022 Standard
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-modal bg-surface space-y-6 text-xs sm:text-sm text-fg-muted leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-fg">1. Core Moderation Principles</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-fg-muted">
            <li>RateIT does not initiate, modify, or selectively curate genuine consumer reviews.</li>
            <li>Legitimate critical or negative reviews are never removed upon business request or payment.</li>
            <li>All moderation actions (hide, unhide, ban) are immutably logged in our audit ledger.</li>
            <li>Reviewers are provided notice and formal appeal channels upon content restriction.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-fg">2. Automated Anti-Fraud Heuristics Engine</h2>
          <p>RateIT enforces algorithmic safeguards against bot syndicates, competitor attacks, and paid farm networks:</p>

          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            {[
              {
                title: "Physical Geofence Verification",
                desc: "Reviews tagged with GPS coordinates within 100m of the venue receive Verified Check-in status.",
              },
              {
                title: "EXIF Hardware Extraction",
                desc: "Uploaded images are inspected for hardware capture time and location tags, blocking stock photos.",
              },
              {
                title: "Impossible Travel Velocity",
                desc: "Check-ins located >50km apart within 30 minutes are flagged as spoofed coordinates.",
              },
              {
                title: "Young Account Velocity Burst",
                desc: "New accounts (<24h old) submitting >3 reviews in rapid succession trigger automated hold.",
              },
              {
                title: "Bigram Jaccard Near-Duplicates",
                desc: "Reviews with text similarity >0.85 to other reviews are automatically flagged for inspection.",
              },
              {
                title: "Bayesian Rating Shrinkage",
                desc: "Venues with few reviews are shrunk toward the Pune category mean, preventing 1-review 5.0 distortions.",
              },
            ].map((rule, idx) => (
              <div key={idx} className="p-4 rounded-card bg-surface-2 space-y-1">
                <span className="font-semibold text-accent-link flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent-link" /> {rule.title}
                </span>
                <p className="text-[11px] text-fg-muted leading-relaxed">{rule.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-fg">3. Tipping Point Auto-Hide Rule</h2>
          <p>
            Any review that receives 3 distinct, independent community flags from unique verified users is automatically quarantined into <code className="px-1.5 py-0.5 rounded-md bg-surface-3 text-fg text-xs font-mono">Visibility.HIDDEN</code> pending Grievance Officer inspection. If a flag is upheld by admin moderation, the author incurs a -10 trust penalty.
          </p>
        </section>
      </div>
    </div>
  )
}
