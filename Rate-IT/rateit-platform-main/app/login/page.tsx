"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowLeft,
  Phone,
  Mail,
  Lock,
  Shield,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Eye,
  EyeOff,
  Info,
} from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { auth } from "@/lib/userAuth"
import { Turnstile } from "@marsidev/react-turnstile"

export default function LoginPage() {
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email")
  const [step, setStep] = useState<"input" | "otp" | "name" | "consent">("input")
  
  // Email fields
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  
  // Phone fields
  const [phone, setPhone] = useState("")
  const [otpCode, setOtpCode] = useState("")
  
  // Profile & state
  const [displayName, setDisplayName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [consentChecked, setConsentChecked] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const reason = searchParams.get("reason")
  const redirectPath = searchParams.get("redirect") || "/"

  useEffect(() => {
    if (reason === "rate") {
      setError("Please log in with your email or phone to post reviews.")
    } else if (reason === "create_list") {
      setError("Please log in with your email or phone to create custom lists.")
    } else if (reason === "favorite") {
      setError("Please log in to save favorites to your profile.")
    }
  }, [reason])

  // Email Submit
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.")
      setIsLoading(false)
      return
    }

    try {
      const result = await auth.signInWithEmail(email, password || undefined)
      if (result.success) {
        if (result.user) {
          setSuccess("Login successful! Redirecting...")
          setTimeout(() => router.push(redirectPath), 1000)
        } else {
          setSuccess("Check your email for the magic login link!")
        }
      } else {
        setError(result.error || "Authentication failed. Please try again.")
      }
    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Phone OTP Submit
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!turnstileToken) {
      setError("Please complete the security check.")
      setIsLoading(false)
      return
    }

    const cleanPhone = phone.replace(/\s+/g, "")
    if (!/^\+91\d{10}$/.test(cleanPhone) && !/^\d{10}$/.test(cleanPhone)) {
      setError("Please enter a valid 10-digit Indian mobile number.")
      setIsLoading(false)
      return
    }

    const formattedPhone = cleanPhone.startsWith("+91") ? cleanPhone : `+91${cleanPhone}`

    try {
      const result = await auth.sendOTP(formattedPhone)
      if (result.success) {
        setPhone(formattedPhone)
        setStep("otp")
        setSuccess("OTP sent to your phone.")
      } else {
        setError(result.error || "Failed to send OTP. Please try again.")
        setTurnstileToken(null)
      }
    } catch {
      setError("Network error. Please check your connection.")
      setTurnstileToken(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await auth.verifyOTP(phone, otpCode)
      if (result.success && result.user) {
        if (result.isNewUser) {
          setStep("name")
        } else {
          setStep("consent")
          setSuccess("Welcome back!")
        }
      } else {
        setError(result.error || "Invalid OTP. Please try again.")
      }
    } catch {
      setError("Verification failed.")
    } finally {
      setIsLoading(false)
    }
  }

  // Set display name
  const handleSetName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) {
      setError("Please enter a display name.")
      return
    }
    setIsLoading(true)

    try {
      const result = await auth.setDisplayName(displayName.trim())
      if (result.success) {
        setStep("consent")
      } else {
        setError(result.error || "Failed to save name.")
      }
    } catch {
      setError("An error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  // Consent
  const handleConsent = async () => {
    if (!consentChecked) return
    setIsLoading(true)

    try {
      await auth.recordConsent()
      setSuccess("Account ready! Redirecting...")
      setTimeout(() => router.push(redirectPath), 1000)
    } catch {
      router.push(redirectPath)
    }
  }

  const handleGuestAccess = () => {
    router.push("/?guest=true")
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/50 to-gray-100 opacity-50" />

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <Link href="/">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-2 -left-2 text-gray-600 hover:text-black"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-yellow-500" />
            <h1 className="text-3xl font-bold text-black">RateIT</h1>
          </div>
          <p className="text-gray-600 text-sm">
            Sign in with email or phone to rate places and create lists
          </p>
        </div>

        {reason && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-800 text-xs">
            <Info className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <span>Authentication required to perform this action.</span>
          </div>
        )}

        {/* Login Card */}
        <Card className="bg-white border border-gray-200 shadow-xl rounded-2xl">
          <CardContent className="p-6 md:p-8">

            {/* Auth Method Switcher (Email vs Phone) */}
            {step === "input" && (
              <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => { setAuthMethod("email"); setError(""); setSuccess("") }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    authMethod === "email"
                      ? "bg-white text-black shadow-sm"
                      : "text-gray-500 hover:text-black"
                  }`}
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Email Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setAuthMethod("phone"); setError(""); setSuccess("") }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    authMethod === "phone"
                      ? "bg-white text-black shadow-sm"
                      : "text-gray-500 hover:text-black"
                  }`}
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>Phone OTP</span>
                </button>
              </div>
            )}

            {/* ===== EMAIL LOGIN FORM ===== */}
            {step === "input" && authMethod === "email" && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-semibold text-gray-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-9 pr-4 h-11 bg-gray-50 border border-gray-200 rounded-xl text-black text-sm placeholder:text-gray-400 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-100"
                      required
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-xs font-semibold text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full pl-9 pr-10 h-11 bg-gray-50 border border-gray-200 rounded-xl text-black text-sm placeholder:text-gray-400 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-100"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-green-600">{success}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 h-11 rounded-xl font-medium transition-all"
                >
                  {isLoading ? "Signing in..." : "Continue with Email"}
                </Button>
              </form>
            )}

            {/* ===== PHONE OTP FORM ===== */}
            {step === "input" && authMethod === "phone" && (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-xs font-semibold text-gray-700">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <div className="absolute left-9 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-mono">
                      +91
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
                      placeholder="98765 43210"
                      className="w-full pl-16 pr-4 h-11 bg-gray-50 border border-gray-200 rounded-xl text-black text-sm placeholder:text-gray-400 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-100"
                      required
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex justify-center my-2">
                  <Turnstile
                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"}
                    onSuccess={(token) => setTurnstileToken(token)}
                    onError={() => setError("Security check failed.")}
                    options={{ theme: "light" }}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || phone.length < 10}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 h-11 rounded-xl font-medium"
                >
                  {isLoading ? "Sending OTP..." : "Send Verification Code"}
                </Button>
              </form>
            )}

            {/* OTP VERIFICATION STEP */}
            {step === "otp" && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="otp" className="text-xs font-semibold text-gray-700">
                    Verification Code
                  </label>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="w-full px-4 h-12 bg-gray-50 border border-gray-200 rounded-xl text-black text-center text-xl tracking-[0.4em] font-mono focus:border-yellow-400 focus:outline-none"
                    required
                    disabled={isLoading}
                    autoFocus
                    maxLength={6}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || otpCode.length < 6}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 h-11 rounded-xl font-medium"
                >
                  {isLoading ? "Verifying..." : "Verify & Continue"}
                </Button>
              </form>
            )}

            {/* DISPLAY NAME STEP */}
            {step === "name" && (
              <form onSubmit={handleSetName} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="displayName" className="text-xs font-semibold text-gray-700">
                    Set Display Name
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name or nickname"
                    className="w-full px-4 h-11 bg-gray-50 border border-gray-200 rounded-xl text-black text-sm"
                    required
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || !displayName.trim()}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 h-11 rounded-xl font-medium"
                >
                  Save & Continue
                </Button>
              </form>
            )}

            {/* CONSENT STEP */}
            {step === "consent" && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 space-y-1">
                  <p className="font-semibold">DPDP Consent</p>
                  <p>By proceeding, you consent to RateIT storing your profile and review data.</p>
                </div>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-yellow-500"
                  />
                  <span className="text-xs text-gray-600">I agree to the Terms of Service & Privacy Policy.</span>
                </label>

                <Button
                  onClick={handleConsent}
                  disabled={!consentChecked || isLoading}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 h-11 rounded-xl font-medium"
                >
                  Accept & Continue
                </Button>
              </div>
            )}

            {/* Divider + Guest Access */}
            {step === "input" && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-gray-400">or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGuestAccess}
                  className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 h-11 rounded-xl font-medium text-xs bg-transparent"
                >
                  Browse as Guest (Read-Only)
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
