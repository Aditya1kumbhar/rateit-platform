"use client"

import { useEffect } from "react"

declare global {
  interface Window {
    Lenis?: any
  }
}

export const useLenis = () => {
  useEffect(() => {
    let lenis: any

    const initLenis = async () => {
      // Dynamically import Lenis to avoid SSR issues
      const Lenis = (await import("@studio-freight/lenis")).default

      lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        // @ts-ignore - lenis options typing mismatch
        direction: "vertical",
        // @ts-ignore
        gestureDirection: "vertical",
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
      })

      function raf(time: number) {
        lenis.raf(time)
        requestAnimationFrame(raf)
      }

      requestAnimationFrame(raf)
    }

    initLenis()

    return () => {
      if (lenis) {
        lenis.destroy()
      }
    }
  }, [])
}
