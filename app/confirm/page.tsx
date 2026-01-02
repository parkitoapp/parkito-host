"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Logo from "@/components/Logo"

export default function ConfirmPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const supabase = getSupabaseBrowserClient()
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const handleConfirmation = async () => {
            const tokenHash = searchParams.get("token_hash")
            const type = searchParams.get("type")
            const next = searchParams.get("next") || "/"

            if (!tokenHash || !type) {
                setError("Link non valido o scaduto.")
                return
            }

            // Verify the token with Supabase
            const { error } = await supabase.auth.verifyOtp({
                token_hash: tokenHash,
                type: type as "recovery" | "signup" | "invite" | "magiclink" | "email_change",
            })

            if (error) {
                setError(error.message)
                return
            }

            // Success - redirect to the next page
            router.push(next)
        }

        handleConfirmation()
    }, [searchParams, router, supabase.auth])

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
                <Card className="max-w-md w-full mx-auto">
                    <Logo />
                    <CardHeader className="text-center">
                        <CardTitle className="text-xl text-destructive">Errore</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <a href="/login" className="text-primary underline">
                            Torna al login
                        </a>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
            <Card className="max-w-md w-full mx-auto">
                <Logo />
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Verifica in corso...</CardTitle>
                    <CardDescription>
                        Stiamo verificando il tuo link. Attendi un momento.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center py-8">
                    <Spinner className="w-8 h-8" />
                </CardContent>
            </Card>
        </div>
    )
}

