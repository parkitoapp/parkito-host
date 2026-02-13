"use client"

import { useState, useEffect } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { MobileOpenInAppContent } from "@/components/mobile-open-in-app-content"
import { GlobalLoading } from "@/components/global-loading"

/**
 * When on mobile, renders the full-screen "open in app" gate and blocks the rest of the app (including login).
 * When on desktop, renders children as usual.
 */
export function MobileGate({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Wait for mount so we know isMobile is correct; avoid flashing login on mobile
  if (!mounted) {
    return <GlobalLoading message="Caricamento..." />
  }

  if (isMobile) {
    return <MobileOpenInAppContent />
  }

  return <>{children}</>
}
