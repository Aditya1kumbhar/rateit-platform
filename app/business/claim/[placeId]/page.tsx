"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Building2, ShieldCheck, FileText, ArrowLeft, Upload, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function BusinessClaimPage({ params }: { params: { placeId: string } }) {
  const router = useRouter()
  const [step, setStep] = useState<"intro" | "verify" | "manual" | "success">("intro")
  const [documentUrl, setDocumentUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  // Mock data for UI development. In reality, we'd fetch Place details.
  const placeName = "IIT JEE Academy"
  const businessPhone = "+919876543210"

  const handleAutoVerify = async () => {
    setIsLoading(true)
    // Simulated API call to check if logged-in user's phone matches businessPhone
    setTimeout(() => {
      setIsLoading(false)
      // For demo, we assume failure to show manual flow. 
      // In prod, if match -> "success", else -> "manual"
      setStep("manual") 
    }, 1500)
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulated API call to submit manual claim request
    setTimeout(() => {
      setIsLoading(false)
      setStep("success")
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-50" />

      <div className="relative w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href={`/item/${params.placeId}`}>
            <Button variant="ghost" size="icon" className="absolute -top-2 -left-2 text-gray-600">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            <h1 className="text-3xl font-bold text-black">Claim Your Business</h1>
          </div>
          <p className="text-gray-600 max-w-md mx-auto">
            Verify ownership of {placeName} to unlock the Business Dashboard and respond to reviews.
          </p>
        </div>

        <Card className="bg-white border border-gray-200 shadow-lg">
          <CardContent className="p-8">
            {step === "intro" && (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-xl flex gap-3">
                  <ShieldCheck className="h-6 w-6 text-blue-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900 text-sm mb-1">Why do we require verification?</h3>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      To prevent fraud and maintain trust, we ensure that only authorized owners can reply to reviews on behalf of a business.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => setStep("verify")}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-xl font-medium"
                  >
                    Start Verification
                  </Button>
                </div>
              </div>
            )}

            {step === "verify" && (
              <div className="space-y-6">
                <h3 className="font-semibold text-gray-900">Step 1: Automated Verification</h3>
                <p className="text-sm text-gray-600">
                  We check if your verified RateIT account phone number matches the public phone number listed for this business.
                </p>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Listed Business Phone:</span>
                    <span className="font-medium">******3210</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Your Account Phone:</span>
                    <span className="font-medium">******3210</span>
                  </div>
                </div>

                <Button
                  onClick={handleAutoVerify}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-xl font-medium"
                >
                  {isLoading ? "Verifying..." : "Verify Match"}
                </Button>
              </div>
            )}

            {step === "manual" && (
              <form onSubmit={handleManualSubmit} className="space-y-6">
                <h3 className="font-semibold text-gray-900">Step 2: Manual Verification</h3>
                <p className="text-sm text-gray-600">
                  Your phone number doesn&apos;t match our public records. Please upload a document to prove ownership (e.g., GST Certificate, Utility Bill in business name).
                </p>

                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">Click to upload document</p>
                  <p className="text-xs text-gray-500 mt-1">PDF, JPG, or PNG (Max 5MB)</p>
                  
                  {/* Hidden file input would go here */}
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => setDocumentUrl(e.target.value)} 
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-xl font-medium"
                >
                  {isLoading ? "Submitting..." : "Submit for Manual Review"}
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep("verify")}
                  className="w-full text-gray-500"
                >
                  Back
                </Button>
              </form>
            )}

            {step === "success" && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Claim Request Submitted</h3>
                <p className="text-sm text-gray-600">
                  Our team will review your document within 48 hours. You will receive an SMS update once your business dashboard is unlocked.
                </p>
                <Link href="/">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-xl font-medium mt-4">
                    Return to Home
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
