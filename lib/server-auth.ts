import type { User as SupabaseUser } from "@supabase/supabase-js"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser()

  if (error || !authUser) return null

  const displayName = authUser.user_metadata?.display_name

  const user = await prisma.user.upsert({
    where: { id: authUser.id },
    update: {
      phone: authUser.phone ?? null,
      email: authUser.email?.toLowerCase() ?? null,
      phoneVerified: Boolean(authUser.phone_confirmed_at),
    },
    create: {
      id: authUser.id,
      phone: authUser.phone ?? null,
      email: authUser.email?.toLowerCase() ?? null,
      phoneVerified: Boolean(authUser.phone_confirmed_at),
      displayName: typeof displayName === "string" ? displayName : authUser.email?.split("@")[0] ?? "RateIT Member",
    },
  })

  return { authUser, user }
}

export function isAdmin(authUser: SupabaseUser): boolean {
  const metadata = authUser.app_metadata as { role?: unknown; roles?: unknown }

  return (
    metadata.role === "admin" ||
    (Array.isArray(metadata.roles) && metadata.roles.includes("admin"))
  )
}
