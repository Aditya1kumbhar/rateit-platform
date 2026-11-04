/**
 * Cloudflare Turnstile Server-Side Verification
 *
 * Verifies turnstile captcha tokens against Cloudflare Siteverify API.
 */

export async function verifyTurnstileToken(
  token: string | undefined | null,
  ip?: string
): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY

  // In development, if secret is unconfigured or placeholder, allow pass-through
  const isConfigured = Boolean(secretKey && !secretKey.startsWith("your-"))

  if (!isConfigured) {
    if (process.env.NODE_ENV === "production") {
      return { success: false, error: "Turnstile secret key is not configured on the server." }
    }
    // Permissive in dev/test when keys are not configured
    return { success: true }
  }

  if (!token) {
    return { success: false, error: "Missing Turnstile verification token." }
  }

  try {
    const formData = new URLSearchParams()
    formData.append("secret", secretKey!)
    formData.append("response", token)
    if (ip) {
      formData.append("remoteip", ip)
    }

    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })

    const data = await response.json()
    if (data.success) {
      return { success: true }
    }

    return {
      success: false,
      error: `Turnstile verification failed: ${(data["error-codes"] || []).join(", ") || "invalid token"}`,
    }
  } catch (err) {
    console.error("Turnstile verification request failed:", err)
    return { success: false, error: "Unable to verify anti-bot challenge. Please try again." }
  }
}

