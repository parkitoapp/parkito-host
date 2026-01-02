"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldError,
} from "@/components/ui/field"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group"
import { Mail } from "lucide-react"
import Logo from "@/components/Logo"
import { FormEvent, useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"

const COOLDOWN_SECONDS = 90
const COOLDOWN_STORAGE_KEY = "reset-pwd-cooldown-expiry"

export function ResetPwdForm() {
    const supabase = getSupabaseBrowserClient()
    const [email, setEmail] = useState<string>("")
    const emailError = email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    const showEmailError = emailError
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<boolean>(false)
    const [shaking, setShaking] = useState<boolean>(false)
    const [cooldown, setCooldown] = useState<number>(0)
    const disabled = (email.length === 0 || emailError) || loading || cooldown > 0

    // Restore cooldown from localStorage on mount
    useEffect(() => {
        const storedExpiry = localStorage.getItem(COOLDOWN_STORAGE_KEY)
        if (storedExpiry) {
            const expiryTime = parseInt(storedExpiry, 10)
            const remainingSeconds = Math.floor((expiryTime - Date.now()) / 1000)
            if (remainingSeconds > 0) {
                setCooldown(remainingSeconds)
            } else {
                localStorage.removeItem(COOLDOWN_STORAGE_KEY)
            }
        }
    }, [])

    // Countdown timer effect
    useEffect(() => {
        if (cooldown <= 0) {
            localStorage.removeItem(COOLDOWN_STORAGE_KEY)
            return
        }

        const timer = setInterval(() => {
            setCooldown((prev) => prev - 1)
        }, 1000)

        return () => clearInterval(timer)
    }, [cooldown])

    // Format seconds to MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(false)

        try {
            // First, check if email belongs to a host
            const { data: driver } = await supabase
                .from("pkt_driver")
                .select("id")
                .eq("email", email.toLowerCase())
                .single() as { data: { id: string } | null }

            if (!driver) {
                toast.error("Email non trovata. Verifica di aver inserito l'email corretta.")
                setError(true)
                setShaking(true)
                setLoading(false)
                return
            }

            // Check if driver is a host
            const { data: host } = await supabase
                .from("pkt_host")
                .select("id")
                .eq("driver_id", driver.id)
                .single() as { data: { id: string } | null }

            if (!host) {
                toast.error("Questa email non è associata a un account host. Usa l'app mobile per gestire il tuo account.")
                setError(true)
                setShaking(true)
                setLoading(false)
                return
            }

            // User is a host, send reset email
            await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/change-pwd` })
            toast.success("Email inviata con successo. Controlla la tua casella di posta. Se non la trovi, controlla nello spam.")
            const expiryTime = Date.now() + (COOLDOWN_SECONDS * 1000)
            localStorage.setItem(COOLDOWN_STORAGE_KEY, expiryTime.toString())
            setCooldown(COOLDOWN_SECONDS)
        } catch (error) {
            toast.error((error as Error).message)
            setError(true)
            setShaking(true)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
            <Card className={cn(shaking && "animate-shake", error && "border-destructive", "max-w-md w-full mx-auto")}>
                <Logo />
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Hai dimenticato la password?</CardTitle>
                    <CardDescription>
                        Inserisci la tua email per ricevere il link di reset della password.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <InputGroup>
                                    <InputGroupAddon>
                                        <Mail className={cn(showEmailError && "text-destructive")} />
                                    </InputGroupAddon>
                                    <InputGroupInput
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onFocus={() => setError(false)}
                                        placeholder="m@example.com"
                                        required
                                        aria-invalid={showEmailError}
                                        className="rounded-none focus:placeholder-muted-foreground/50"
                                    />
                                </InputGroup>
                                {showEmailError && <FieldError errors={[{ message: "Email non valida" }]} />}
                            </Field>
                            <Field>
                                <Button type="submit" disabled={disabled}>
                                    {loading ? (
                                        <Spinner />
                                    ) : cooldown > 0 ? (
                                        `Riprova tra ${formatTime(cooldown)}`
                                    ) : (
                                        "Invia link"
                                    )}
                                </Button>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

