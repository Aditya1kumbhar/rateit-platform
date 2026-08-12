import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Review Moderation Policy — RateIT',
  description: 'RateIT review moderation policy in compliance with IS 19000:2022.',
}

export default function ModerationPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold text-black mb-2">Review Moderation Policy</h1>
        <p className="text-sm text-gray-400 mb-2">Last updated: August 2026</p>
        <p className="text-sm text-gray-500 mb-8">
          In compliance with IS 19000:2022 (BIS Standard for Online Consumer Reviews)
          and the IT (Intermediary Guidelines) Rules, 2021.
        </p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-black mt-8 mb-3">1. Moderation Principles</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>RateIT does not initiate, modify, or editorially control user reviews</li>
              <li>Moderation is applied consistently, not selectively</li>
              <li>Legitimate negative reviews are never removed on business request alone</li>
              <li>All moderation actions are logged and auditable</li>
              <li>Reviewers are notified when their content is actioned</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mt-8 mb-3">2. Automated Fraud Detection</h2>
            <p>RateIT uses server-side heuristic checks (not opaque AI) to flag potentially fraudulent reviews:</p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li><strong>Duplicate text detection</strong> — Reviews with high text similarity to the user&apos;s own previous reviews are flagged</li>
              <li><strong>Velocity checks</strong> — More than 5 reviews in 60 minutes triggers a flag</li>
              <li><strong>Impossible travel</strong> — Check-ins at locations &gt;50km apart within 30 minutes</li>
              <li><strong>New account bursts</strong> — Accounts &lt;24 hours old posting &gt;3 reviews</li>
              <li><strong>EXIF cross-checks</strong> — Photo metadata inconsistent with review location or timing</li>
            </ul>
            <p className="mt-3">
              Flagged reviews are sent to the moderation queue for human review. They are not automatically
              removed — flags are indicators, not verdicts.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mt-8 mb-3">3. Community Flagging</h2>
            <p>Any verified user can flag a review for the following reasons:</p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li><strong>Fake Review</strong> — Suspected non-genuine review</li>
              <li><strong>Offensive Content</strong> — Hate speech, threats, harassment</li>
              <li><strong>Irrelevant</strong> — Not about the reviewed place/service</li>
              <li><strong>Spam</strong> — Promotional or commercial content</li>
              <li><strong>Defamatory</strong> — False factual claims that damage reputation</li>
            </ul>
            <p className="mt-3">
              Community flags are weighted by the flagger&apos;s own trust score to prevent brigading.
              A single flag does not hide a review — a threshold must be met or a moderator must act.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mt-8 mb-3">4. Review Versioning (IS 19000)</h2>
            <p>
              In compliance with IS 19000:2022, reviews cannot be silently edited after publication:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>All reviews display their original publish date</li>
              <li>If a review is edited, the edit timestamp is displayed alongside</li>
              <li>Each edit increments the version number</li>
              <li>Previous versions are retained internally for audit purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mt-8 mb-3">5. Business Right to Reply</h2>
            <p>
              Businesses reviewed on RateIT may respond publicly to any review. Business responses are
              clearly labeled as &quot;Owner Response&quot; and are displayed beneath the review.
              This is a right-to-reply mechanism, not a delete-on-complaint mechanism.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mt-8 mb-3">6. Content Removal</h2>
            <p>Content is removed only in the following cases:</p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>Court order or government notification (IT Act Section 79 obligation)</li>
              <li>Clear violation of Terms of Service confirmed through moderation review</li>
              <li>User&apos;s own request to delete their review</li>
              <li>Data erasure request under DPDP Act, 2023</li>
            </ul>
            <p className="mt-3">
              Takedown requests from businesses without legal basis are declined. The business is directed
              to use the right-to-reply mechanism or file a formal grievance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mt-8 mb-3">7. Repeat Offenders</h2>
            <p>
              Per IS 19000:2022, repeat fraudulent reviewers are restricted from future posting.
              Restriction follows a graduated process:
            </p>
            <ol className="list-decimal pl-5 space-y-2 mt-3">
              <li>First violation: Warning + trust score reduction</li>
              <li>Second violation: Temporary posting restriction (7 days)</li>
              <li>Third violation: Permanent posting ban (appealable through Grievance Officer)</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mt-8 mb-3">8. Grievance Redressal</h2>
            <p>
              If you disagree with a moderation decision, you may file a grievance with our Grievance Officer.
              As per IT Rules 2021: acknowledgment within 24 hours, resolution within 15 days.
              See the{' '}
              <a href="/grievance" className="text-blue-600 underline">Grievance page</a> for contact details.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
