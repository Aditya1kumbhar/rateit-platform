import { Metadata } from 'next'
import Link from 'next/link'
import { Shield, ChevronRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy: RateIT Pune',
  description: 'Privacy Policy for RateIT, compliant with the Digital Personal Data Protection Act, 2023.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-fg-subtle">
        <Link href="/" className="hover:text-accent-link transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-fg-subtle/60" />
        <span className="text-fg font-medium">Privacy Policy</span>
      </nav>

      {/* Hero Header */}
      <div className="p-6 sm:p-8 rounded-modal bg-surface relative overflow-hidden space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs text-accent-link font-semibold uppercase tracking-wider">
          <Shield className="w-3.5 h-3.5" />
          DPDP Act 2023 Compliant
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.022em] text-fg">Privacy Policy</h1>
        <p className="text-xs text-fg-subtle">
          Last updated: August 2026 • Compliant with DPDP Act, 2023 and DPDP Rules, 2025
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-modal bg-surface space-y-6 text-xs sm:text-sm text-fg-muted leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-fg">1. Data We Collect & Retention</h2>
          <p>We collect only the minimum data necessary for fraud-resistant hyperlocal reviews:</p>

          <div className="overflow-x-auto rounded-card bg-surface-2 p-1">
            <table className="w-full text-xs">
              <thead className="bg-surface-3 text-fg">
                <tr>
                  <th className="text-left p-3 font-semibold border-b border-hairline">Data Type</th>
                  <th className="text-left p-3 font-semibold border-b border-hairline">Processing Purpose</th>
                  <th className="text-left p-3 font-semibold border-b border-hairline">Retention Period</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline text-fg-muted">
                <tr>
                  <td className="p-3 font-medium text-fg">Mobile Phone Number</td>
                  <td className="p-3">IS 19000 Verifiable reviewer authentication</td>
                  <td className="p-3">Until user erasure request</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-fg">GPS Check-in Coordinates</td>
                  <td className="p-3">Physical geofence check-in verification</td>
                  <td className="p-3">Immediate distance verification only</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-fg">Photo EXIF Metadata</td>
                  <td className="p-3">Anti-fraud stock photo detection</td>
                  <td className="p-3">Stripped immediately after check</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-fg">IP & Device Hashes</td>
                  <td className="p-3">Collusion network and rate limit defense</td>
                  <td className="p-3">30 days salted hash, then pruned</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-fg">2. Your DPDP 2023 Rights</h2>
          <p>
            Under the Digital Personal Data Protection Act, 2023, you hold absolute rights to:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-fg-muted mt-2">
            <li><strong>Right to Access:</strong> View all personal data and reviews tied to your account.</li>
            <li><strong>Right to Correction:</strong> Update your display name, bio, and profile details anytime.</li>
            <li><strong>Right to Erasure:</strong> Permanently erase your telemetry and profile via one-click in your <Link href="/profile" className="text-accent-link underline font-semibold">Profile Settings</Link>.</li>
            <li><strong>Right of Grievance Redressal:</strong> Direct statutory complaints to our designated Grievance Officer.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-fg">3. Third-Party Disclosures & Security</h2>
          <p>
            We do not sell, rent, or trade your personal information. Reviews designated as &quot;Public&quot; are visible to visitors of the Platform. Database connections use encrypted TLS, salted SHA-256 telemetry hashing, and strict row-level authorization.
          </p>
        </section>
      </div>
    </div>
  )
}
