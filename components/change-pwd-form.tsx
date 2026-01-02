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
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group"
import { Check, Eye, EyeOff, Lock } from "lucide-react"
import Logo from "@/components/Logo"
import { FormEvent, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"

export function ChangePwdForm() {
    const supabase = getSupabaseBrowserClient()
    const [password, setPassword] = useState<string>("")
    const [confirmPassword, setConfirmPassword] = useState<string>("")
    const [showPassword, setShowPassword] = useState<boolean>(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false)
    const passwordType = showPassword ? "text" : "password"
    const confirmPasswordType = showConfirmPassword ? "text" : "password"
    const [loading, setLoading] = useState<boolean>(false)

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            })
            if (error) {
                toast.error(error.message)
                setLoading(false)
                return
            }
            toast.success("Password cambiata con successo. Verrai reindirizzato.")
            setTimeout(() => {
                window.location.href = "/"
            }, 1500)
        } catch (error) {
            toast.error((error as Error).message)
            setLoading(false)
        }
    }

    const hasMinChar: boolean = password.length >= 8
    const hasUpper: boolean = /[A-Z]/.test(password || '')
    const hasNumber: boolean = /[0-9]/.test(password || '')
    const hasSpecialChar: boolean = /[!@#$%^&*(),.?":{}|<>]/.test(password || '')

    const disabled = password.length === 0 || confirmPassword.length === 0 || password !== confirmPassword || !hasMinChar || !hasUpper || !hasNumber || !hasSpecialChar

    const pwdReq = [
        { label: "8 caratteri", check: hasMinChar },
        { label: "Una lettera maiuscola", check: hasUpper },
        { label: "Un numero", check: hasNumber },
        { label: "Un carattere speciale", check: hasSpecialChar },
    ]

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
            <Card className="w-full max-w-md mx-auto">
                <Logo />
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Cambia la tua password</CardTitle>
                    <CardDescription>
                        Inserisci la nuova password per il tuo account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="password">Password</FieldLabel>
                                <InputGroup>
                                    <InputGroupAddon>
                                        <Lock />
                                    </InputGroupAddon>
                                    <InputGroupInput
                                        id="password"
                                        type={passwordType}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="la tua password"
                                        required
                                        className="rounded-none focus:placeholder-muted-foreground/50"
                                    />
                                    <InputGroupAddon align="inline-end">
                                        <Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)} className="hover:text-muted-foreground hover:bg-transparent hover:cursor-pointer">
                                            {showPassword ? <EyeOff /> : <Eye />}
                                        </Button>
                                    </InputGroupAddon>
                                </InputGroup>
                                <FieldDescription>
                                    La password deve contenere almeno:
                                    <ul>
                                        {pwdReq.map((req) => (
                                            <li key={req.label} className="flex items-center gap-2">
                                                {req.check && <Check className="size-4 text-green-500" />}
                                                <span className={cn(req.check && "text-green-500")}>{req.label}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </FieldDescription>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="confirmPassword">Conferma la password</FieldLabel>
                                <InputGroup>
                                    <InputGroupAddon>
                                        <Lock />
                                    </InputGroupAddon>
                                    <InputGroupInput
                                        id="confirmPassword"
                                        type={confirmPasswordType}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="conferma la password"
                                        required
                                        className="rounded-none focus:placeholder-muted-foreground/50"
                                    />
                                    <InputGroupAddon align="inline-end">
                                        <Button type="button" variant="ghost" size="icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="hover:text-muted-foreground hover:bg-transparent hover:cursor-pointer">
                                            {showConfirmPassword ? <EyeOff /> : <Eye />}
                                        </Button>
                                    </InputGroupAddon>
                                </InputGroup>
                            </Field>
                            <Field>
                                <Button type="submit" disabled={disabled}>
                                    {loading ? <Spinner /> : "Cambia password"}
                                </Button>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

