"use client"

import { useEffect } from "react"
import { useLenis } from "@/lib/lenis"

export function LenisProvider({ children }: { children: React.ReactNode }) {
  useLenis()
  return <>{children}</>
}
