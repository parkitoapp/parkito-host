"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Logo from "@/components/Logo"
import { Smartphone, ArrowRight, Check } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"
import { useUser } from "@/providers/user-provider"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import Image from "next/image"

export function NotAHostContent() {
  const { signOut } = useUser()

  // Sign out the user when they land on this page
  // This ensures their session is cleared so they can try with a different account
  useEffect(() => {
    const signOutUser = async () => {
      const supabase = getSupabaseBrowserClient()
      await supabase.auth.signOut()
    }
    signOutUser()
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        {/* Main Card */}
        <Card className="border-2">
          <CardHeader className="text-center pb-2 flex flex-col justify-center items-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Image src={"/not-a-host.webp"} alt="Not a host" width={160} height={100} />
            </div>
            <CardTitle>Ops! Sembra che tu non sia un host</CardTitle>
            <CardDescription>
              Sei un cliente e vuoi affittare un parcheggio?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {/* Benefits list */}
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <div className="size-6 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="size-4" />
                </div>
                <span>Guadagna affittando il tuo parcheggio</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="size-6 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="size-4" />
                </div>
                <span>Gestisci le prenotazioni in totale autonomia</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="size-6 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="size-4" />
                </div>
                <span>Ricevi pagamenti sicuri direttamente sul tuo conto</span>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              asChild
              className="w-full mt-6 gap-2"
              size="lg"
            >
              <Link href="https://parkito.app">
                <Smartphone className="w-4 h-4" />
                Vai all&apos;app per registrarti
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>

            {/* Back to login */}
            <div className="text-center pt-2">
              <Button
                variant={"link"}
                onClick={() => signOut()}
                className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                Torna al login
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer text */}
        <p className="text-center text-xs text-muted-foreground">
          Hai già un account host? Assicurati di accedere con lo stesso account
          usato per la registrazione nell&apos;app.
        </p>
      </div>
    </div>
  )
}

