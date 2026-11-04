"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Phone,
  Mail,
  Lock,
  Shield,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Info,
} from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { auth } from "@/lib/userAuth"
import { Turnstile } from "@marsidev/react-turnstile"
import { toast } from "sonner"

function LoginContent() {
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
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [consentChecked, setConsentChecked] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()

  const reason = searchParams.get("reason")
  const redirectPath = searchParams.get("redirect") || "/"
  const urlError = searchParams.get("error")

  useEffect(() => {
    if (urlError) {
      setError(decodeURIComponent(urlError))
    } else if (reason === "rate") {
      setError("Please sign in to rate venues and post check-in reviews.")
    } else if (reason === "create_list") {
      setError("Please sign in to create custom Pune lists.")
    }
  }, [reason, urlError])

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    try {
      setOauthLoading(provider)
      setError("")
      const res = await auth.signInWithOAuth(provider, redirectPath)
      if (res?.error) {
        setError(res.error)
        toast.error(`Sign in with ${provider} failed: ${res.error}`)
      }
    } catch {
      setError("An unexpected error occurred during social sign-in.")
    } finally {
      setOauthLoading(null)
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.")
      return
    }

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const res = await auth.signInWithEmail(email, password || undefined)
      if (res.success) {
        if (res.user) {
          setSuccess("Login successful! Redirecting...")
          toast.success("Welcome back to RateIT!")
          setTimeout(() => router.push(redirectPath), 1000)
        } else {
          setSuccess("Check your email for the magic login link!")
          toast.success("Magic sign-in link sent to your inbox.")
        }
      } else {
        setError(res.error || "Authentication failed")
      }
    } catch {
      setError("Connection failure during authentication.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (phone.length < 10) {
      setError("Please enter a valid 10-digit Indian phone number.")
      return
    }

    if (!turnstileToken) {
      setError("Please verify you are human via the security check below.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const fullPhone = phone.startsWith("+91") ? phone : `+91${phone}`
      const res = await auth.sendOTP(fullPhone)
      if (res.success) {
        setStep("otp")
        toast.success("OTP sent to your phone number!")
      } else {
        setError(res.error || "Failed to send SMS OTP.")
      }
    } catch {
      setError("Failed to send SMS OTP.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otpCode.length < 6) {
      setError("Please enter the 6-digit OTP code.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const fullPhone = phone.startsWith("+91") ? phone : `+91${phone}`
      const res = await auth.verifyOTP(fullPhone, otpCode)
      if (res.success) {
        if (res.isNewUser) {
          setStep("name")
        } else {
          toast.success("Welcome back to RateIT!")
          router.push(redirectPath)
        }
      } else {
        setError(res.error || "Verification failed. Please try again.")
      }
    } catch {
      setError("Verification failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetName = (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) {
      setError("Please enter a display name.")
      return
    }
    setStep("consent")
  }

  const handleConsent = async () => {
    if (!consentChecked) {
      setError("You must consent to the DPDP Act 2023 terms to use RateIT.")
      return
    }

    try {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          consentGiven: true,
        }),
      })
    } catch {
      // Non-fatal
    }
    toast.success("Account setup complete! Welcome to RateIT Pune.")
    router.push(redirectPath)
  }

  const handleGuestAccess = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("rateit_guest_mode", "true")
    }
    router.push("/?guest=true")
  }

  return (
    <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-10rem)] relative">
      <div className="w-full max-w-md space-y-6">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-fg-subtle hover:text-fg transition-colors apple-press min-h-[36px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-accent-tint text-accent-link text-[11px] font-semibold tracking-wider uppercase mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>IS 19000 Verifiable Identity</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.022em] text-fg">
            Sign in to RateIT
          </h1>
          <p className="text-xs sm:text-sm text-fg-muted max-w-sm mx-auto">
            Authentic Pune reviews, verified check-in badges, and personalized lists.
          </p>
        </div>

        {reason && (
          <div className="p-3 bg-surface rounded-card flex items-center gap-2.5 text-accent-link text-xs">
            <Info className="h-4 w-4 shrink-0" />
            <span>Authentication required to continue.</span>
          </div>
        )}

        {/* Surface Card */}
        <div className="p-6 sm:p-8 rounded-modal bg-surface shadow-2xl space-y-5 text-fg">
          {step === "input" && (
            <div className="space-y-3">
              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={() => handleOAuthSignIn("google")}
                disabled={Boolean(oauthLoading) || isLoading}
                className="w-full min-h-[48px] px-4 rounded-xl bg-surface-2 hover:bg-surface-3 border border-hairline text-fg font-semibold text-xs flex items-center justify-center gap-3 transition-colors apple-press disabled:opacity-60 cursor-pointer"
              >
                {oauthLoading === "google" ? (
                  <div className="w-4 h-4 border-2 border-accent-link border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              {/* GitHub OAuth Button */}
              <button
                type="button"
                onClick={() => handleOAuthSignIn("github")}
                disabled={Boolean(oauthLoading) || isLoading}
                className="w-full min-h-[48px] px-4 rounded-xl bg-surface-2 hover:bg-surface-3 border border-hairline text-fg font-semibold text-xs flex items-center justify-center gap-3 transition-colors apple-press disabled:opacity-60 cursor-pointer"
              >
                {oauthLoading === "github" ? (
                  <div className="w-4 h-4 border-2 border-accent-link border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                )}
                <span>Continue with GitHub</span>
              </button>

              {/* Divider */}
              <div className="relative py-2 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-hairline" />
                </div>
                <div className="relative px-3 bg-surface text-[10px] tracking-[0.08em] uppercase text-fg-subtle font-medium">
                  Or continue with
                </div>
              </div>

              {/* Method Switcher Tabs */}
              <div className="flex bg-surface-2 p-1 rounded-xl border border-hairline">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod("email")
                    setError("")
                    setSuccess("")
                  }}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 min-h-[36px] apple-press ${
                    authMethod === "email"
                      ? "bg-surface-3 text-fg font-semibold shadow-sm"
                      : "text-fg-muted hover:text-fg"
                  }`}
                >
                  <Mail className="h-3.5 w-3.5 text-accent-link" />
                  <span>Email</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod("phone")
                    setError("")
                    setSuccess("")
                  }}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 min-h-[36px] apple-press ${
                    authMethod === "phone"
                      ? "bg-surface-3 text-fg font-semibold shadow-sm"
                      : "text-fg-muted hover:text-fg"
                  }`}
                >
                  <Phone className="h-3.5 w-3.5 text-accent-link" />
                  <span>Phone OTP</span>
                </button>
              </div>
            </div>
          )}

          {/* EMAIL FORM */}
          {step === "input" && authMethod === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-fg-muted block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle h-4 w-4" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@pune.ac.in"
                    className="w-full pl-10 pr-4 py-2.5 min-h-[44px] bg-surface-2 border border-hairline rounded-input text-fg placeholder:text-fg-subtle text-xs apple-focus transition-colors"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-fg-muted block">Password (or leave blank for Magic Link)</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle h-4 w-4" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Optional password"
                    className="w-full pl-10 pr-10 py-2.5 min-h-[44px] bg-surface-2 border border-hairline rounded-input text-fg placeholder:text-fg-subtle text-xs apple-focus transition-colors"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-fg-subtle hover:text-fg"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-danger/10 border border-danger/20 rounded-card flex items-start gap-2.5 text-danger text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 bg-success/10 border border-success/20 rounded-card flex items-start gap-2.5 text-success text-xs">
                  <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !email}
                className="w-full min-h-[44px] liquid-glass-btn text-stone-950 font-semibold rounded-xl text-xs"
              >
                {isLoading ? "Signing in..." : "Continue with Email"}
              </Button>
            </form>
          )}

          {/* PHONE OTP FORM */}
          {step === "input" && authMethod === "phone" && (
            <form onSubmit={handleSendOTP} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-fg-muted block">Mobile Number (India +91)</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle h-4 w-4" />
                  <span className="absolute left-10 top-1/2 -translate-y-1/2 text-xs text-fg-subtle font-mono">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
                    placeholder="98765 43210"
                    className="w-full pl-18 pr-4 py-2.5 min-h-[44px] bg-surface-2 border border-hairline rounded-input text-fg placeholder:text-fg-subtle text-xs apple-focus transition-colors"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Turnstile Bot Verification */}
              <div className="flex justify-center pt-1">
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"}
                  onSuccess={(token) => setTurnstileToken(token)}
                  options={{ theme: "light" }}
                />
              </div>

              {error && (
                <div className="p-3 bg-danger/10 border border-danger/20 rounded-card flex items-start gap-2.5 text-danger text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || phone.length < 10 || !turnstileToken}
                className="w-full min-h-[44px] liquid-glass-btn text-stone-950 font-semibold rounded-xl text-xs"
              >
                {isLoading ? "Sending OTP..." : "Send Verification OTP"}
              </Button>
            </form>
          )}

          {/* OTP ENTRY STEP */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOTP} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-fg-muted block">Enter 6-Digit OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="123456"
                  className="w-full text-center text-xl tracking-widest font-mono py-2.5 min-h-[44px] bg-surface-2 border border-hairline rounded-input text-fg apple-focus"
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-3 bg-danger/10 border border-danger/20 rounded-card text-danger text-xs">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || otpCode.length < 6}
                className="w-full min-h-[44px] liquid-glass-btn text-stone-950 font-semibold rounded-xl text-xs"
              >
                {isLoading ? "Verifying..." : "Verify & Sign In"}
              </Button>
            </form>
          )}

          {/* NAME STEP */}
          {step === "name" && (
            <form onSubmit={handleSetName} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-fg-muted block">Your Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Aditya Kumbhar"
                  className="w-full px-4 py-2.5 min-h-[44px] bg-surface-2 border border-hairline rounded-input text-fg text-xs apple-focus"
                  required
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                disabled={!displayName.trim()}
                className="w-full min-h-[44px] liquid-glass-btn text-stone-950 font-semibold rounded-xl text-xs"
              >
                Continue
              </Button>
            </form>
          )}

          {/* CONSENT STEP */}
          {step === "consent" && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-surface-2 border border-hairline rounded-card text-fg-muted space-y-1.5 text-[11px]">
                <p className="font-semibold text-fg">Indian DPDP Act 2023 Consent</p>
                <p className="leading-relaxed">
                  By continuing, you consent to RateIT processing your verified check-in & review telemetry solely for anti-fraud scoring. You may erase or withdraw consent anytime from your profile.
                </p>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-hairline text-accent bg-surface-2"
                />
                <span className="text-fg-muted text-[11px] leading-relaxed">
                  I agree to the{" "}
                  <Link href="/terms" className="text-accent-link hover:underline">
                    Terms of Service
                  </Link>
                  .
                </span>
              </label>

              <Button
                onClick={handleConsent}
                disabled={!consentChecked}
                className="w-full min-h-[44px] liquid-glass-btn text-stone-950 font-semibold rounded-xl text-xs"
              >
                Accept & Enter RateIT
              </Button>
            </div>
          )}

          {/* GUEST ACCESS */}
          {step === "input" && (
            <div className="pt-2 border-t border-hairline text-center">
              <button
                type="button"
                onClick={handleGuestAccess}
                className="text-xs text-fg-subtle hover:text-accent-link transition-colors min-h-[36px] apple-press"
              >
                Or continue browsing as Guest &rarr;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-fg-muted text-sm font-medium">Loading Sign In...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
