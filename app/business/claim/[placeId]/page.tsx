"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Building2, ShieldCheck, ArrowLeft, Upload, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function BusinessClaimPage({ params }: { params: { placeId: string } }) {
  const router = useRouter()
  const [step, setStep] = useState<"intro" | "verify" | "manual" | "success">("intro")
  const [documentUrl, setDocumentUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleAutoVerify = async () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setStep("manual")
    }, 1200)
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setStep("success")
      toast.success("Claim submitted for compliance verification")
    }, 1200)
  }

  return (
    <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-12rem)] relative">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link
            href={`/item/${params.placeId}`}
            className="inline-flex items-center gap-1.5 text-xs text-fg-subtle hover:text-fg transition-colors mb-2 apple-focus rounded-full px-3 py-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Place</span>
          </Link>

          <div className="w-12 h-12 rounded-full bg-accent-tint text-accent-link flex items-center justify-center mx-auto shadow-md">
            <Building2 className="w-6 h-6" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold text-fg tracking-[-0.022em]">
            Claim Your Business
          </h1>
          <p className="text-xs sm:text-sm text-fg-muted max-w-md mx-auto leading-relaxed">
            Verify official ownership to unlock the Business Dashboard, respond to student reviews, and display an Approved Business badge.
          </p>
        </div>

        {/* Card */}
        <div className="p-6 sm:p-8 rounded-modal bg-surface border border-hairline shadow-[0_24px_70px_rgba(0,0,0,0.65)] text-fg">
          {step === "intro" && (
            <div className="space-y-6">
              <div className="bg-accent-tint border border-accent-link/20 p-4 rounded-card flex gap-3 text-xs">
                <ShieldCheck className="h-5 w-5 text-accent-link flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-semibold text-accent-link">Why is business claim verification required?</h3>
                  <p className="text-fg-muted leading-relaxed text-[11px]">
                    Under Indian IT Act 2021 Safe Harbour guidelines, business replies must be verified to prevent impersonation and fraud.
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setStep("verify")}
                className="w-full bg-accent hover:bg-accent-hover text-white font-semibold py-3 rounded-full text-xs apple-press apple-focus shadow-md shadow-accent/20"
              >
                Begin Automated Verification &rarr;
              </Button>
            </div>
          )}

          {step === "verify" && (
            <div className="space-y-5 text-xs">
              <div>
                <h3 className="text-sm font-semibold text-fg mb-1">Step 1: Phone Record Matching</h3>
                <p className="text-fg-muted">
                  We check if your verified account phone matches public listing records for this venue.
                </p>
              </div>

              <div className="p-4 rounded-card bg-surface-2 border border-hairline space-y-2">
                <div className="flex justify-between">
                  <span className="text-fg-subtle">Listed Business Phone:</span>
                  <span className="font-mono text-fg">******3210</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-fg-subtle">Your Account Phone:</span>
                  <span className="font-mono text-fg">******3210</span>
                </div>
              </div>

              <Button
                onClick={handleAutoVerify}
                disabled={isLoading}
                className="w-full bg-accent hover:bg-accent-hover text-white font-semibold py-3 rounded-full text-xs apple-press apple-focus"
              >
                {isLoading ? "Validating Records..." : "Verify Record Match"}
              </Button>
            </div>
          )}

          {step === "manual" && (
            <form onSubmit={handleManualSubmit} className="space-y-5 text-xs">
              <div>
                <h3 className="text-sm font-semibold text-fg mb-1">Step 2: Proof of Ownership</h3>
                <p className="text-fg-muted">
                  Please upload a business registration, GST Certificate, Shop Act license, or utility bill in the business name.
                </p>
              </div>

              <label className="border border-dashed border-hairline rounded-card p-6 text-center bg-surface-2 hover:bg-surface-3 transition-colors cursor-pointer block apple-focus">
                <Upload className="h-6 w-6 text-accent-link mx-auto mb-2" />
                <p className="font-semibold text-fg">Upload Ownership Document</p>
                <p className="text-[11px] text-fg-subtle mt-1">PDF, JPG, or PNG (Max 5MB)</p>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setDocumentUrl(e.target.value)}
                />
              </label>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep("verify")}
                  className="flex-1 rounded-full text-fg-subtle hover:text-fg apple-focus"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-accent hover:bg-accent-hover text-white font-semibold py-2.5 rounded-full apple-press apple-focus"
                >
                  {isLoading ? "Submitting..." : "Submit Claim"}
                </Button>
              </div>
            </form>
          )}

          {step === "success" && (
            <div className="text-center space-y-4 text-xs">
              <div className="w-14 h-14 bg-success/10 border border-success/20 text-success rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-semibold text-fg">Claim In Review</h3>
              <p className="text-fg-muted leading-relaxed max-w-sm mx-auto">
                Our verification desk will review your business credentials within 24 to 48 hours. You will receive an SMS and dashboard access upon approval.
              </p>
              <Link href={`/item/${params.placeId}`} className="block pt-2">
                <Button className="w-full bg-accent hover:bg-accent-hover text-white font-semibold py-2.5 rounded-full apple-press apple-focus">
                  Return to Place Listing
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
