"use client"

import { useState, useEffect, useCallback } from "react"
import { useIsMobile } from "@/hooks/use-mobile"

const STORAGE_KEY = "parkito-mobile-deep-link-dismissed"

/** Deep-link URL to open the host app. Replace with your real deep-link when ready. */
export const HOST_APP_DEEP_LINK = process.env.NEXT_PUBLIC_HOST_APP_DEEP_LINK ?? "parkito://dashboard"

export function useMobileDeepLinkPrompt() {
  const isMobile = useIsMobile()
  const [showPrompt, setShowPrompt] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !isMobile) {
      setShowPrompt(false)
      return
    }
    try {
      const dismissed = sessionStorage.getItem(STORAGE_KEY)
      if (!dismissed) {
        setShowPrompt(true)
      }
    } catch {
      setShowPrompt(true)
    }
  }, [mounted, isMobile])

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1")
    } catch {
      // ignore
    }
    setShowPrompt(false)
  }, [])

  const openApp = useCallback(() => {
    try {
      window.location.href = HOST_APP_DEEP_LINK
    } catch {
      // ignore
    }
    dismiss()
  }, [dismiss])

  return {
    isMobile,
    showPrompt,
    dismiss,
    openApp,
  }
}
