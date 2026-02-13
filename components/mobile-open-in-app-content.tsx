"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import Logo from "@/components/Logo"
import { Smartphone, ArrowRight } from "lucide-react"
import Link from "next/link"
import { HOST_APP_DEEP_LINK } from "@/hooks/use-mobile-deep-link-prompt"

/**
 * Full-screen gate for mobile: replaces the entire app (including login).
 * User must open the host dashboard in the app; they cannot use the web on mobile.
 */
export function MobileOpenInAppContent() {
  function openApp() {
    try {
      window.location.href = HOST_APP_DEEP_LINK
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        <Card className="border-2">
          <CardHeader className="text-center pb-2 flex justify-center items-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Smartphone className="h-16 w-16 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-center">
            <p className="text-muted-foreground">
              La dashboard host è disponibile nell&apos;app Parkito. Apri l&apos;app per accedere e gestire i tuoi parcheggi.
            </p>

            <Button
              className="w-full mt-6 gap-2"
              size="lg"
              onClick={openApp}
            >
              <Smartphone className="w-4 h-4" />
              Apri nell&apos;app
              <ArrowRight className="w-4 h-4" />
            </Button>

            <Button asChild variant="link" className="w-full text-sm text-muted-foreground">
              <Link href="https://parkito.app">
                Scarica l&apos;app Parkito
              </Link>
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Per usare la dashboard da computer, apri questo sito da desktop.
        </p>
      </div>
    </div>
  )
}
