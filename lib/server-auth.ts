import type { User as SupabaseUser } from "@supabase/supabase-js"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

export async function getAuthenticatedUser() {
  try {
    const supabase = await createClient()
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser()

    if (error || !authUser) return null

    const metadata = authUser.user_metadata || {}
    const rawDisplayName =
      metadata.display_name ||
      metadata.full_name ||
      metadata.name ||
      (authUser.email ? authUser.email.split("@")[0] : null)
    const displayName = typeof rawDisplayName === "string" && rawDisplayName.trim() ? rawDisplayName.trim() : "RateIT Member"

    const rawAvatarUrl = metadata.avatar_url || metadata.picture
    const avatarUrl = typeof rawAvatarUrl === "string" && rawAvatarUrl.trim() ? rawAvatarUrl.trim() : null

    const phone =
      authUser.phone && typeof authUser.phone === "string" && authUser.phone.trim() !== ""
        ? authUser.phone.trim()
        : null

    const email =
      authUser.email && typeof authUser.email === "string" && authUser.email.trim() !== ""
        ? authUser.email.trim().toLowerCase()
        : null

    // 1. Try finding by authUser.id
    let existingUser = await prisma.user.findUnique({
      where: { id: authUser.id },
    })

    // 2. If not found by ID, try finding by email or phone to link existing profile
    if (!existingUser && (email || phone)) {
      existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            ...(email ? [{ email }] : []),
            ...(phone ? [{ phone }] : []),
          ],
        },
      })
    }

    if (existingUser) {
      const user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          displayName,
          ...(phone ? { phone } : {}),
          ...(email ? { email } : {}),
          ...(avatarUrl ? { avatarUrl } : {}),
          phoneVerified: Boolean(authUser.phone_confirmed_at),
        },
      })
      return { authUser, user }
    }

    // 3. Otherwise create a new User record safely
    const user = await prisma.user.create({
      data: {
        id: authUser.id,
        phone,
        email,
        phoneVerified: Boolean(authUser.phone_confirmed_at),
        displayName,
        avatarUrl,
        trustScore: 50.0,
        consentGiven: true,
        consentDate: new Date(),
      },
    })

    return { authUser, user }
  } catch (err) {
    console.error("Error in getAuthenticatedUser:", err)
    return null
  }
}

export function isAdmin(authUser: SupabaseUser): boolean {
  const metadata = authUser.app_metadata as { role?: unknown; roles?: unknown }

  return (
    metadata.role === "admin" ||
    (Array.isArray(metadata.roles) && metadata.roles.includes("admin"))
  )
}
