import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — RateIT',
  description: 'Terms of Service for RateIT, the trusted reviews platform for India.',
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold text-black mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: August 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-black mt-8 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using RateIT (&quot;the Platform&quot;), you agree to be bound by these Terms of Service.
              RateIT is operated as an intermediary platform under the Information Technology Act, 2000 (India)
              and the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mt-8 mb-3">2. User Accounts & Identity Verification</h2>
            <p>
              To post reviews on RateIT, you must create an account verified via phone OTP. In accordance with
              IS 19000:2022 (BIS Online Consumer Reviews Standard), reviewer identity must be verifiable. You agree
              to provide accurate phone number information. Multiple accounts per person are not permitted and may
              result in account restriction.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mt-8 mb-3">3. User-Generated Content & Reviews</h2>
            <p>
              You retain ownership of the reviews you post. By posting, you grant RateIT a non-exclusive,
              royalty-free license to display and distribute your content on the Platform.
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>Reviews must reflect your genuine, personal experience with the reviewed entity.</li>
              <li>Factual claims in reviews must be substantiated. Opinions clearly stated as opinions are protected.</li>
              <li>Fake reviews, paid reviews, or reviews posted without genuine interaction are prohibited.</li>
              <li>Reviews cannot be silently edited after publication. All edits are versioned and timestamped (IS 19000:2022 compliance).</li>
              <li>Repeat fraudulent reviewers will be restricted from future posting.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mt-8 mb-3">4. Intermediary Status</h2>
            <p>
              RateIT operates as an intermediary under Section 79 of the IT Act, 2000. We do not initiate
              transmission of, select the receiver of, or modify the information contained in user reviews.
              We are not liable for user-generated content, provided we act on valid takedown requests as per law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mt-8 mb-3">5. Business Right to Reply</h2>
            <p>
              Businesses reviewed on RateIT have the right to respond publicly to any review. Business responses
              are labeled as &quot;Owner Response&quot; and displayed alongside the review. RateIT does not delete
              legitimate negative reviews on business request alone — removal requires a valid legal order or a
              finding through our grievance process that the review violates these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mt-8 mb-3">6. Content Moderation</h2>
            <p>
              RateIT maintains a publicly accessible Review Moderation Policy. Content may be hidden or removed if
              it violates these Terms, applicable law, or receives sufficient community flags. Our moderation process
              is documented and consistently applied. See our{' '}
              <a href="/moderation-policy" className="text-blue-600 underline">Moderation Policy</a> for details.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mt-8 mb-3">7. Defamation & Disputes</h2>
            <p>
              Under the Bharatiya Nyaya Sanhita (BNS), Section 356, false and damaging statements may constitute
              defamation. If you believe a review on RateIT is defamatory, you may file a complaint through our
              Grievance Officer. We will process complaints as per the IT Rules 2021 — acknowledgment within 24 hours,
              resolution within 15 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mt-8 mb-3">8. Trust Score System</h2>
            <p>
              RateIT assigns trust scores to reviewers based on account age, verification status, review consistency,
              and community feedback. Trust scores affect the weight of reviews in aggregate ratings. The scoring
              methodology is heuristic-based and deterministic — no opaque AI models are used. Users may request
              an explanation of their trust score.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mt-8 mb-3">9. Prohibited Conduct</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Posting fake, paid, or incentivized reviews (violation of Consumer Protection Act, 2019)</li>
              <li>Creating multiple accounts to manipulate ratings</li>
              <li>GPS spoofing to fake check-in verification</li>
              <li>Harassment, hate speech, or threats in reviews</li>
              <li>Posting personally identifiable information of others</li>
              <li>Automated/bot-driven review posting</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mt-8 mb-3">10. Termination</h2>
            <p>
              We may suspend or ban accounts that violate these Terms, with explanation provided. Banned users
              may appeal through the Grievance Officer. Account data is handled per our Privacy Policy and the
              Digital Personal Data Protection Act, 2023.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mt-8 mb-3">11. Governing Law</h2>
            <p>
              These Terms are governed by the laws of India. Disputes shall be subject to the exclusive
              jurisdiction of the courts in Pune, Maharashtra.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mt-8 mb-3">12. Contact</h2>
            <p>
              For questions about these Terms, contact our Grievance Officer at{' '}
              <a href="/grievance" className="text-blue-600 underline">the Grievance page</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
