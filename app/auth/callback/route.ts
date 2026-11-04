import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/server-auth"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const rawNext = searchParams.get("next") ?? "/"

  // Prevent open redirect attacks: strictly allow relative internal paths
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/"

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.user) {
      // Synchronize authenticated user to Postgres User table
      try {
        await getAuthenticatedUser()
      } catch (dbErr) {
        console.error("Failed to sync authenticated OAuth user to database:", dbErr)
      }

      const forwardedHost = request.headers.get("x-forwarded-host")
      const isLocal = process.env.NODE_ENV === "development"

      if (isLocal) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Return to login with error state if authentication exchange failed
  return NextResponse.redirect(`${origin}/login?error=Could%20not%20authenticate%20with%20provider`)
}

