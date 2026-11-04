import { Metadata } from 'next'
import { GrievanceForm } from './grievance-form'
import Link from 'next/link'
import { ShieldCheck, Mail, MapPin, Scale, ChevronRight, FileText, Lock, Building2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Grievance Officer: RateIT Pune',
  description: 'Official Grievance Officer desk for complaints, appeals, and data requests under Indian IT Act 2021 and DPDP Act 2023.',
}

export default function GrievancePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-fg-subtle">
        <Link href="/" className="hover:text-accent-link transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-fg-subtle/60" />
        <span className="text-fg font-medium">Grievance Officer Desk</span>
      </nav>

      {/* Hero Header */}
      <div className="p-6 sm:p-8 rounded-modal bg-surface relative overflow-hidden space-y-3">
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent-tint rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="inline-flex items-center gap-1.5 text-xs text-accent-link font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          Statutory Compliance Desk
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.022em] text-fg">
          Grievance Officer & Legal Redressal
        </h1>
        <p className="text-fg-muted text-sm max-w-2xl leading-relaxed">
          Established in accordance with Rule 3(2) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 and the Digital Personal Data Protection Act, 2023.
        </p>
      </div>

      <div className="space-y-8">
        {/* Contact Card */}
        <div className="p-6 rounded-modal bg-surface space-y-4">
          <h2 className="text-base font-semibold text-fg flex items-center gap-2">
            <Mail className="w-4 h-4 text-accent-link" />
            <span>Designated Grievance Officer Contact</span>
          </h2>
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-card bg-surface-2">
              <span className="text-fg-subtle block text-[11px]">Designation:</span>
              <span className="font-semibold text-fg">Chief Compliance & Grievance Officer</span>
            </div>
            <div className="p-3.5 rounded-card bg-surface-2">
              <span className="text-fg-subtle block text-[11px]">Direct Official Email:</span>
              <a href="mailto:grievance@rateit.in" className="font-semibold text-accent-link hover:underline">
                grievance@rateit.in
              </a>
            </div>
            <div className="p-3.5 rounded-card bg-surface-2">
              <span className="text-fg-subtle block text-[11px]">Registered Address:</span>
              <span className="font-semibold text-fg">FC Road, Shivajinagar, Pune, Maharashtra 411005</span>
            </div>
            <div className="p-3.5 rounded-card bg-surface-2">
              <span className="text-fg-subtle block text-[11px]">Statutory SLA Timelines:</span>
              <span className="font-semibold text-success">24h Acknowledgment • 15d Resolution</span>
            </div>
          </div>
        </div>

        {/* Interactive Grievance Form */}
        <GrievanceForm />

        {/* What You Can File */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-[-0.022em] text-fg">What You Can Report</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                title: 'Defamatory or Fraudulent Content',
                description: 'Report reviews that contain false claims, abusive language, or unverified paid attacks.',
                icon: FileText,
              },
              {
                title: 'DPDP 2023 Data Rights Request',
                description: 'Request formal erasure or extraction of your phone records, check-in history, or user profile.',
                icon: Lock,
              },
              {
                title: 'Moderation Decision Appeal',
                description: 'Appeal a hidden review or trust penalty if you believe your review was mistakenly flagged.',
                icon: Scale,
              },
              {
                title: 'Business Owner Dispute & Claim',
                description: 'Claim right-of-reply or report coordinated competitor review bombing against your Pune establishment.',
                icon: Building2,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-5 rounded-modal bg-surface space-y-2.5"
              >
                <div className="w-9 h-9 rounded-lg bg-accent-tint text-accent-link flex items-center justify-center">
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-fg text-sm">{item.title}</h3>
                <p className="text-xs text-fg-muted leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Process Steps */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-[-0.022em] text-fg">Statutory Grievance Process</h2>
          <div className="space-y-3">
            {[
              {
                step: '1',
                title: 'Ticket Submission & Audit Ingest',
                description: 'Your complaint is assigned a cryptographically signed ticket ID in our audit ledger.',
                timeline: 'Instant',
              },
              {
                step: '2',
                title: 'Formal Acknowledgment',
                description: 'The Grievance Officer reviews the filing and acknowledges receipt via registered email.',
                timeline: 'Within 24 Hours',
              },
              {
                step: '3',
                title: 'Investigation & Resolution Order',
                description: 'Evidence, EXIF headers, and geofence logs are analyzed. A written resolution order is issued.',
                timeline: 'Within 15 Days',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="p-4 rounded-card bg-surface flex items-start gap-4"
              >
                <div className="w-8 h-8 rounded-lg bg-accent text-stone-950 font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                  {item.step}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-fg text-sm">{item.title}</h3>
                    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-md bg-accent-tint text-accent-link">
                      {item.timeline}
                    </span>
                  </div>
                  <p className="text-xs text-fg-muted leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legal Framework References */}
        <div className="p-5 rounded-modal bg-surface space-y-2 text-xs">
          <h3 className="font-semibold text-fg">Applicable Legal Framework (India)</h3>
          <ul className="text-fg-muted space-y-1 list-disc pl-4 text-[11px]">
            <li>Information Technology Act, 2000: Section 79 Intermediary Safe Harbour</li>
            <li>Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</li>
            <li>Digital Personal Data Protection Act, 2023 & DPDP Rules 2025</li>
            <li>IS 19000:2022 (Bureau of Indian Standards - Online Consumer Reviews Standard)</li>
            <li>Consumer Protection Act, 2019 (Prevention of Misleading Advertisements and Endorsements)</li>
            <li>Bharatiya Nyaya Sanhita (BNS), 2023: Section 356</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
