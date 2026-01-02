"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Logo from "@/components/Logo"
import { Car, Smartphone, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export function NotAHostContent() {
    const supabase = getSupabaseBrowserClient()

    // Sign out the user when they land on this page
    // This ensures their session is cleared so they can try with a different account
    useEffect(() => {
        const signOutUser = async () => {
            await supabase.auth.signOut()
        }
        signOutUser()
    }, [supabase.auth])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
            <div className="w-full max-w-md space-y-6">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Logo />
                </div>

                {/* Main Card */}
                <Card className="border-2">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Car className="w-8 h-8 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">Non sei ancora un Host</CardTitle>
                        <CardDescription className="text-base mt-2">
                            Questa piattaforma è riservata agli host di Parkito.
                            Per diventare un host e iniziare a guadagnare con il tuo parcheggio,
                            registrati dall&apos;app mobile.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        {/* Benefits list */}
                        <div className="space-y-3 text-sm text-muted-foreground">
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-secondary text-xs">✓</span>
                                </div>
                                <span>Guadagna affittando il tuo parcheggio</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-secondary text-xs">✓</span>
                                </div>
                                <span>Gestisci le prenotazioni in totale autonomia</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-secondary text-xs">✓</span>
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
                            <a
                                href="/login"
                                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                                Torna al login
                            </a>
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

