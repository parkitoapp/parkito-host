"use client"

import { useMobileDeepLinkPrompt } from "@/hooks/use-mobile-deep-link-prompt"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

/**
 * Renders a fixed top banner on mobile prompting the user to open the app via deep-link.
 * Used in the root layout so it can show even before login.
 */
export function MobileDeepLinkBanner() {
  const { showPrompt, dismiss, openApp } = useMobileDeepLinkPrompt()

  if (!showPrompt) return null

  return (
    <div
      className="sticky top-0 left-0 right-0 z-50 flex items-center justify-between gap-2 px-4 py-2 bg-primary/10 text-primary border-b text-sm shrink-0"
      role="banner"
    >
      <span className="font-medium min-w-0">
        Apri la dashboard nell&apos;app per un&apos;esperienza migliore.
      </span>
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" variant="default" onClick={openApp}>
          Apri nell&apos;app
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={dismiss}
          className="h-8 w-8 p-0"
          aria-label="Chiudi"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
