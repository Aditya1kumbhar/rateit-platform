"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, Loader2, Send } from "lucide-react"
import { toast } from "sonner"

export function GrievanceForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [reportType, setReportType] = useState<string>("content_complaint")
  const [targetReviewId, setTargetReviewId] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedRef, setSubmittedRef] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/grievance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          reportType,
          targetReviewId: targetReviewId.trim() || undefined,
          description,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setSubmittedRef(data.referenceId)
        toast.success("Grievance registered in statutory queue!")
      } else {
        toast.error(data.error || "Failed to submit grievance")
      }
    } catch {
      toast.error("Network error submitting grievance")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submittedRef) {
    return (
      <div className="bg-success/10 rounded-[28px] p-6 text-center space-y-3 border-0">
        <CheckCircle2 className="h-10 w-10 text-success mx-auto" />
        <h3 className="text-lg font-semibold text-fg">Grievance Registered Successfully</h3>
        <p className="text-xs text-fg-muted">
          Your official complaint has been logged into the compliance audit ledger and assigned to the Grievance Officer.
        </p>
        <div className="bg-surface-2 px-4 py-2.5 rounded-[14px] inline-block border-0">
          <span className="text-[11px] text-fg-subtle block">Ticket Reference ID:</span>
          <p className="font-mono text-sm font-semibold text-accent-link">{submittedRef}</p>
        </div>
        <p className="text-[11px] text-fg-subtle mt-2">
          Under IT Rules 2021, receipt acknowledgment will be dispatched to {email} within 24 hours.
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmittedRef(null)
            setDescription("")
          }}
          className="mt-2 inline-flex items-center justify-center min-h-[44px] px-6 rounded-full bg-surface-2 hover:bg-surface-3 text-fg text-[14px] font-medium transition-[background-color,transform] duration-150 apple-press apple-focus"
        >
          Submit another inquiry
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-[28px] bg-surface border border-hairline/[0.08] space-y-4 text-xs">
      <div>
        <h3 className="text-base font-semibold text-fg">File an Official Grievance or Appeal</h3>
        <p className="text-xs text-fg-muted mt-0.5">
          All filings are logged into our immutable compliance audit trail and routed to the Grievance Officer.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="font-medium text-fg-muted mb-1 block">Full Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your legal name"
            required
            className="h-11 w-full rounded-[14px] bg-surface-2 border border-hairline/[0.08] px-4 text-[14px] text-fg placeholder:text-fg-subtle focus-visible:border-accent-link focus-visible:ring-2 focus-visible:ring-accent-link/30 outline-none"
          />
        </div>
        <div>
          <label className="font-medium text-fg-muted mb-1 block">Email Address</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
            required
            className="h-11 w-full rounded-[14px] bg-surface-2 border border-hairline/[0.08] px-4 text-[14px] text-fg placeholder:text-fg-subtle focus-visible:border-accent-link focus-visible:ring-2 focus-visible:ring-accent-link/30 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="font-medium text-fg-muted mb-1 block">Phone (Optional)</label>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91..."
            className="h-11 w-full rounded-[14px] bg-surface-2 border border-hairline/[0.08] px-4 text-[14px] text-fg placeholder:text-fg-subtle focus-visible:border-accent-link focus-visible:ring-2 focus-visible:ring-accent-link/30 outline-none"
          />
        </div>
        <div>
          <label className="font-medium text-fg-muted mb-1 block">Grievance Category</label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="h-11 w-full rounded-[14px] bg-surface-2 border border-hairline/[0.08] px-4 text-[14px] text-fg focus-visible:border-accent-link focus-visible:ring-2 focus-visible:ring-accent-link/30 outline-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-surface-2 border border-hairline/[0.08] text-fg rounded-[14px]">
              <SelectItem value="content_complaint">Content / Defamation Complaint</SelectItem>
              <SelectItem value="moderation_appeal">Moderation Appeal (Hidden Review)</SelectItem>
              <SelectItem value="data_rights">DPDP 2023 Data Erasure / Rights</SelectItem>
              <SelectItem value="business_dispute">Business Owner Dispute / Claim</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="font-medium text-fg-muted mb-1 block">Target Review ID (Optional)</label>
        <Input
          value={targetReviewId}
          onChange={(e) => setTargetReviewId(e.target.value)}
          placeholder="UUID of review if appealing a specific post"
          className="h-11 w-full rounded-[14px] bg-surface-2 border border-hairline/[0.08] px-4 text-[14px] text-fg placeholder:text-fg-subtle font-mono focus-visible:border-accent-link focus-visible:ring-2 focus-visible:ring-accent-link/30 outline-none"
        />
      </div>

      <div>
        <label className="font-medium text-fg-muted mb-1 block">Description & Supporting Context</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Please provide full details, context, and reasons for your request (minimum 10 characters)..."
          rows={4}
          required
          minLength={10}
          className="w-full p-3.5 bg-surface-2 border border-hairline/[0.08] rounded-[14px] text-[14px] text-fg placeholder:text-fg-subtle focus-visible:border-accent-link focus-visible:ring-2 focus-visible:ring-accent-link/30 outline-none leading-relaxed"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full inline-flex items-center justify-center min-h-[44px] px-6 rounded-full bg-accent hover:bg-accent-hover text-white text-[14px] font-semibold transition-[background-color,transform] duration-150 apple-press apple-focus disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting Statutory Filing...
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" /> Submit Formal Grievance
          </>
        )}
      </button>
    </form>
  )
}
