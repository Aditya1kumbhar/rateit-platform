import { Metadata } from 'next'
import Link from 'next/link'
import { FileText, ChevronRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service: RateIT Pune',
  description: 'Terms of Service for RateIT, compliant with Information Technology Act, 2000 and IS 19000:2022.',
}

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-fg-subtle">
        <Link href="/" className="hover:text-accent-link transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-fg-subtle/60" />
        <span className="text-fg font-medium">Terms of Service</span>
      </nav>

      {/* Hero Header */}
      <div className="p-6 sm:p-8 rounded-modal bg-surface relative overflow-hidden space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs text-accent-link font-semibold uppercase tracking-wider">
          <FileText className="w-3.5 h-3.5" />
          Statutory Agreement
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.022em] text-fg">Terms of Service</h1>
        <p className="text-xs text-fg-subtle">Last updated: August 2026 • IT Act 2000 Section 79 Compliant</p>
      </div>

      <div className="p-6 sm:p-8 rounded-modal bg-surface space-y-6 text-xs sm:text-sm text-fg-muted leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-fg">1. Acceptance of Terms</h2>
          <p>
            By accessing or using RateIT (&quot;the Platform&quot;), you agree to be bound by these Terms of Service.
            RateIT is operated as an intermediary platform under the Information Technology Act, 2000 (India)
            and the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-fg">2. User Accounts & Identity Verification</h2>
          <p>
            To post reviews on RateIT, you must create an account verified via phone OTP or verified identity. In accordance with
            IS 19000:2022 (BIS Online Consumer Reviews Standard), reviewer identity must be verifiable. You agree
            to provide accurate phone number or email information. Multiple accounts per person are not permitted and may
            result in account restriction.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-fg">3. User-Generated Content & Reviews</h2>
          <p>
            You retain ownership of the reviews you post. By posting, you grant RateIT a non-exclusive,
            royalty-free license to display and distribute your content on the Platform.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-fg-muted mt-2">
            <li>Reviews must reflect your genuine, personal experience with the reviewed entity.</li>
            <li>Factual claims in reviews must be substantiated. Opinions clearly stated as opinions are protected.</li>
            <li>Fake reviews, paid reviews, or reviews posted without genuine interaction are prohibited.</li>
            <li>Reviews cannot be silently edited after publication. All edits are versioned and timestamped (IS 19000:2022 compliance).</li>
            <li>Repeat fraudulent reviewers will be restricted from future posting.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-fg">4. Intermediary Status & Safe Harbour</h2>
          <p>
            RateIT functions solely as an intermediary under Section 79 of the Information Technology Act, 2000.
            We do not initiate the transmission, select the receiver, or select or modify the information contained
            in the transmission. RateIT observes due diligence as prescribed under the IT Rules, 2021.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-fg">5. Business Claims & Right of Reply</h2>
          <p>
            Owners of listed entities may claim their listing upon providing verification of ownership.
            Claimed businesses may post verified official replies to reviews. Business replies must remain professional
            and cannot contain threats, abusive language, or defamatory statements.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-fg">6. Grievance Redressal</h2>
          <p>
            Any complaints regarding content or user conduct should be directed to the Grievance Officer via
            the <Link href="/grievance" className="text-accent-link underline font-semibold">Grievance Desk</Link>.
            We acknowledge complaints within 24 hours and resolve them within 15 days as mandated by Indian law.
          </p>
        </section>
      </div>
    </div>
  )
}
