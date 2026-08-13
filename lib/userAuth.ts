/**
 * RateIT Auth — Phone OTP via Supabase
 * 
 * Replaces the old plaintext-password JSON file auth.
 * Uses Supabase's built-in phone auth for IS 19000 compliance
 * (verifiable reviewer identity without KYC-grade verification).
 */

import { createClient } from '@/lib/supabase/client'

export interface AuthUser {
  id: string
  email?: string
  phone: string
  displayName?: string | null
  phoneVerified: boolean
}

export const auth = {
  /**
   * Send OTP to the user's phone number.
   * Supabase handles rate limiting and SMS delivery.
   */
  sendOTP: async (phone: string): Promise<{ success: boolean; error?: string }> => {
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOtp({
      phone,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consentGiven: true }),
    })

    if (!response.ok) {
      return { success: false, error: 'Unable to record consent in your profile.' }
    }

    return { success: true }
  },

  /**
   * Verify OTP and sign the user in.
   * On first verification, a User record will be created via a Supabase trigger
   * or in the API route handler.
   */
  verifyOTP: async (
    phone: string,
    code: string
  ): Promise<{ success: boolean; user?: AuthUser; isNewUser?: boolean; error?: string }> => {
    const supabase = createClient()

    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: 'sms',
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data.user) {
      return { success: false, error: 'Verification failed.' }
    }

    // Check if this is a new user (first sign-in)
    const isNewUser = !data.user.user_metadata?.display_name

    return {
      success: true,
      user: {
        id: data.user.id,
        phone: data.user.phone || phone,
        displayName: data.user.user_metadata?.display_name || null,
        phoneVerified: true,
      },
      isNewUser,
    }
  },

  /**
   * Update user's display name after first sign-up.
   */
  setDisplayName: async (name: string): Promise<{ success: boolean; error?: string }> => {
    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({
      data: { display_name: name },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  },

  /**
   * Record DPDP consent (explicit, itemized, with timestamp).
   */
  recordConsent: async (): Promise<{ success: boolean; error?: string }> => {
    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({
      data: {
        consent_given: true,
        consent_date: new Date().toISOString(),
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  },

  /**
   * Get the current session user.
   */
  getSession: async (): Promise<AuthUser | null> => {
    try {
      const supabase = createClient()
      const fetchPromise = supabase.auth.getUser().then(({ data }) => data?.user || null)
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 200))
      const user = await Promise.race([fetchPromise, timeoutPromise])

      if (!user) return null

      return {
        id: user.id,
        phone: user.phone || '',
        displayName: user.user_metadata?.display_name || null,
        phoneVerified: !!user.phone_confirmed_at,
      }
    } catch {
      return null
    }
  },

  /**
   * Sign in with Email and Password or Send Magic Link.
   */
  signInWithEmail: async (
    email: string,
    password?: string
  ): Promise<{ success: boolean; user?: AuthUser; isNewUser?: boolean; error?: string }> => {
    const supabase = createClient()

    if (password) {
      // Password login / sign up
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // If user doesn't exist, try auto sign-up
        if (error.message.includes('Invalid login credentials')) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
          })

          if (signUpError) {
            return { success: false, error: signUpError.message }
          }

          if (signUpData.user) {
            const authUser: AuthUser = {
              id: signUpData.user.id,
              email: signUpData.user.email || email,
              phone: '',
              displayName: email.split('@')[0],
              phoneVerified: false,
            }
            if (typeof window !== 'undefined') {
              localStorage.setItem('rateit_user_session', JSON.stringify(authUser))
            }
            return { success: true, user: authUser, isNewUser: true }
          }
        }
        return { success: false, error: error.message }
      }

      if (data.user) {
        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email || email,
          phone: data.user.phone || '',
          displayName: data.user.user_metadata?.display_name || email.split('@')[0],
          phoneVerified: !!data.user.phone_confirmed_at,
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem('rateit_user_session', JSON.stringify(authUser))
        }
        return { success: true, user: authUser, isNewUser: false }
      }
    } else {
      // Magic Link
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) return { success: false, error: error.message }
      return { success: true }
    }

    return { success: false, error: 'Authentication failed' }
  },

  /**
   * Sign out the current user.
   */
  signOut: async (): Promise<void> => {
    const supabase = createClient()
    await supabase.auth.signOut()
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rateit_user_session')
    }
  },
}

/**
 * User session helpers for client-side state.
 * Uses Supabase's built-in JWT session management — no more localStorage passwords.
 */
export const userSession = {
  getUser: async (): Promise<AuthUser | null> => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('rateit_user_session')
      if (cached) {
        try { return JSON.parse(cached) } catch {}
      }
    }
    try {
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000))
      return await Promise.race([auth.getSession(), timeoutPromise])
    } catch {
      return null
    }
  },

  isLoggedIn: async (): Promise<boolean> => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('rateit_user_session')
      if (cached) return true
    }
    const user = await userSession.getUser()
    return user !== null
  },

  clearUser: async (): Promise<void> => {
    await auth.signOut()
  },
}
