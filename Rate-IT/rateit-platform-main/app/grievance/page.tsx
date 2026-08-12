import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Grievance Officer — RateIT',
  description: 'Contact the RateIT Grievance Officer for complaints and data requests.',
}

export default function GrievancePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold text-black mb-2">Grievance Officer</h1>
        <p className="text-sm text-gray-400 mb-8">
          As required under the IT (Intermediary Guidelines) Rules, 2021 and the
          Digital Personal Data Protection Act, 2023.
        </p>

        <div className="space-y-8">
          {/* Contact Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-black mb-4">Grievance Officer Contact</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-gray-500 w-24 flex-shrink-0">Name:</span>
                <span className="text-gray-800 font-medium">[Your Full Name]</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-gray-500 w-24 flex-shrink-0">Designation:</span>
                <span className="text-gray-800">Grievance Officer, RateIT</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-gray-500 w-24 flex-shrink-0">Email:</span>
                <span className="text-gray-800">grievance@rateit.in</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-gray-500 w-24 flex-shrink-0">Address:</span>
                <span className="text-gray-800">Pune, Maharashtra, India</span>
              </div>
            </div>
          </div>

          {/* What you can file */}
          <div>
            <h2 className="text-lg font-semibold text-black mb-4">What You Can Report</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  title: 'Content Complaint',
                  description: 'Report a review that you believe violates our Terms of Service or is defamatory.',
                  icon: '📝',
                },
                {
                  title: 'Data Rights Request',
                  description: 'Request access, correction, or erasure of your personal data under the DPDP Act.',
                  icon: '🔒',
                },
                {
                  title: 'Moderation Appeal',
                  description: 'Appeal a moderation decision if your review was hidden or your account restricted.',
                  icon: '⚖️',
                },
                {
                  title: 'Business Dispute',
                  description: 'As a reviewed business, report fake reviews or request right-to-reply access.',
                  icon: '🏪',
                },
              ].map((item) => (
                <div key={item.title} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <h3 className="font-semibold text-gray-800 text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Process */}
          <div>
            <h2 className="text-lg font-semibold text-black mb-4">Grievance Process</h2>
            <div className="space-y-4">
              {[
                {
                  step: '1',
                  title: 'Submit Your Complaint',
                  description: 'Email the Grievance Officer with your complaint details, your RateIT account phone number, and the specific review/content in question.',
                  timeline: '',
                },
                {
                  step: '2',
                  title: 'Acknowledgment',
                  description: 'We will acknowledge receipt of your complaint and assign a reference number.',
                  timeline: 'Within 24 hours',
                },
                {
                  step: '3',
                  title: 'Investigation & Resolution',
                  description: 'We will review the complaint, examine the content, and may contact the reviewer for their response. A decision will be communicated to you.',
                  timeline: 'Within 15 days',
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-sm">{item.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed mt-1">{item.description}</p>
                    {item.timeline && (
                      <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full font-medium">
                        ⏱ {item.timeline}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legal references */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Applicable Legal Framework</h3>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Information Technology Act, 2000 — Section 79</li>
              <li>• IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</li>
              <li>• Digital Personal Data Protection Act, 2023</li>
              <li>• DPDP Rules, 2025</li>
              <li>• IS 19000:2022 (BIS Online Consumer Reviews Standard)</li>
              <li>• Consumer Protection Act, 2019</li>
              <li>• Bharatiya Nyaya Sanhita (BNS), Section 356</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
