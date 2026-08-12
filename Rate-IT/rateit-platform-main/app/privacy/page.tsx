import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — RateIT',
  description: 'Privacy Policy for RateIT, compliant with the Digital Personal Data Protection Act, 2023.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold text-black mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-2">Last updated: August 2026</p>
        <p className="text-sm text-gray-500 mb-8">
          Compliant with the Digital Personal Data Protection Act, 2023 (DPDP Act) and
          DPDP Rules, 2025.
        </p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-black mt-8 mb-3">1. Data We Collect</h2>
            <p>We collect only the minimum data necessary for the Platform to function (DPDP: purpose limitation):</p>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-semibold text-gray-700 border-b">Data</th>
                    <th className="text-left p-3 font-semibold text-gray-700 border-b">Purpose</th>
                    <th className="text-left p-3 font-semibold text-gray-700 border-b">Retention</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="p-3">Phone number</td>
                    <td className="p-3">Account verification (IS 19000)</td>
                    <td className="p-3">Until account deletion</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-3">Display name</td>
                    <td className="p-3">Public profile display</td>
                    <td className="p-3">Until account deletion</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-3">GPS location (at review time)</td>
                    <td className="p-3">Check-in verification only</td>
                    <td className="p-3">Stored as lat/lng with review</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-3">Photo EXIF metadata</td>
                    <td className="p-3">Fraud detection cross-check</td>
                    <td className="p-3">Stripped after verification; not stored permanently</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-3">Review content, rating, tags</td>
                    <td className="p-3">Core platform functionality</td>
                    <td className="p-3">Until review deletion or erasure request</td>
                  </tr>
                  <tr>
                    <td className="p-3">Trust score signals</td>
                    <td className="p-3">Fraud prevention and review weighting</td>
                    <td className="p-3">Computed; derived from activity</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mt-8 mb-3">2. What We Do NOT Collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>We do not collect data &quot;in case we need it later&quot; (DPDP: purpose limitation)</li>
              <li>We do not use Google Analytics, Meta Pixel, or any third-party ad tracker</li>
              <li>We do not sell or share personal data with third parties</li>
              <li>We do not perform behavioral tracking or ad profiling</li>
              <li>We do not track your location when you are not actively submitting a review</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mt-8 mb-3">3. Consent</h2>
            <p>
              We obtain explicit, itemized consent before collecting your data. Consent is not bundled —
              each data type has a clear purpose explained at the point of collection. You may withdraw
              consent at any time through your profile settings, which will stop future data collection
              (past reviews may be anonymized rather than deleted if they form part of aggregate ratings).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mt-8 mb-3">4. Your Rights (Data Principal Rights)</h2>
            <p>Under the DPDP Act 2023, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li><strong>Access</strong> — Request a copy of all personal data we hold about you</li>
              <li><strong>Correction</strong> — Request correction of inaccurate personal data</li>
              <li><strong>Erasure</strong> — Request deletion of your personal data and account</li>
              <li><strong>Withdraw Consent</strong> — Withdraw consent for future data processing</li>
              <li><strong>Grievance Redressal</strong> — File complaints about data handling</li>
              <li><strong>Nominate</strong> — Nominate another person to exercise your rights on your behalf</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact our Grievance Officer via the{' '}
              <a href="/grievance" className="text-blue-600 underline">Grievance page</a>.
              We will acknowledge your request within 24 hours and process it within 15 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mt-8 mb-3">5. Data Security</h2>
            <p>
              We use industry-standard security measures including encrypted data transmission (HTTPS/TLS 1.3),
              encrypted database storage, and secure authentication via Supabase. Access to personal data is
              restricted to essential platform operations only.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mt-8 mb-3">6. Data Breach Notification</h2>
            <p>
              In the event of a personal data breach, we will notify affected users and the Data Protection
              Board of India as required under the DPDP Act, 2023. Notification will include the nature of
              the breach, data affected, and remedial actions taken.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mt-8 mb-3">7. Children&apos;s Data</h2>
            <p>
              RateIT is not intended for users under 18 years of age. We do not knowingly collect personal
              data from minors. If we become aware that a user is under 18, we will take steps to delete
              their data and restrict their account, in compliance with the DPDP Act&apos;s provisions on
              children&apos;s data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mt-8 mb-3">8. Changes to This Policy</h2>
            <p>
              We will notify users of material changes to this Privacy Policy via in-app notification
              and update the &quot;Last updated&quot; date. Continued use after notification constitutes acceptance
              of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mt-8 mb-3">9. Contact</h2>
            <p>
              For privacy-related queries or to exercise your data rights, contact our Grievance Officer
              at the{' '}
              <a href="/grievance" className="text-blue-600 underline">Grievance page</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
