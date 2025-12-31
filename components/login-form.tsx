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
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Eye, EyeOff, Lock, Mail } from "lucide-react"
import Link from "next/link"
import Logo from "./Logo"
import React, { FormEvent, useEffect, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Spinner } from "./ui/spinner"
import GoogleAuth from "./GoogleAuth"
import AppleAuth from "./AppleAuth"
import { useUser } from "@/providers/user-provider"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {

  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const { user } = useUser();
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const passwordType = showPassword ? "text" : "password"
  const emailError = email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const showEmailError = emailError
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [shaking, setShaking] = useState<boolean>(false);
  const disabled = (email.length === 0 || emailError) || (password.length === 0) || loading;

  // Redirect to dashboard if user is already logged in
  // Middleware handles protection, but this provides immediate UX feedback
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  // Auto-clear shaking after animation completes (500ms)
  useEffect(() => {
    if (shaking) {
      const timer = setTimeout(() => setShaking(false), 500);
      return () => clearTimeout(timer);
    }
  }, [shaking]);


  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(false);

    // const startTime = Date.now();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // // Ensure minimum 1 second loading state
    // const elapsedTime = Date.now() - startTime;
    // const remainingTime = Math.max(0, 500 - elapsedTime);
    // await new Promise(resolve => setTimeout(resolve, remainingTime));

    if (error) {
      toast.error(error.message);
      setLoading(false);
      setError(true);
      setShaking(true);
      setEmail("");
      setPassword("");
      setShowPassword(false);
    }
    else {
      toast.success("Login Completato. Verrai reindirizzato alla dashboard.");
      setLoading(false);
      setError(false);
      router.push("/");
    }
  }


  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className={cn(shaking && "animate-shake", error && "border-destructive")}>
        <Logo />
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Benvenuto nella tua dashboard personale</CardTitle>
          <CardDescription>
            Accedi con il tuo account Apple o Google
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <AppleAuth />
                <GoogleAuth />
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Oppure continua con
              </FieldSeparator>
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
                    className="rounded-none"
                  />
                </InputGroup>
                {showEmailError && <FieldError errors={[{ message: "Email non valida" }]} />}
              </Field>
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
                    onFocus={() => setError(false)}
                    placeholder="la tua password"
                    required
                    className="rounded-none"
                  />
                  <InputGroupAddon align="inline-end">
                    <Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)} className="hover:text-muted-foreground hover:bg-transparent hover:cursor-pointer">
                      {showPassword ? <EyeOff /> : <Eye />}
                    </Button>
                  </InputGroupAddon>
                </InputGroup>
                <Link
                  href="/reset-pwd"
                  className="ml-auto text-sm underline-offset-4 text-muted-foreground underline"
                >
                  Hai dimenticato la password?
                </Link>
              </Field>
              <Field>
                {loading ? <Button type="submit" disabled={disabled}><Spinner /></Button> : <Button type="submit" disabled={disabled}>Accedi</Button>}
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        Cliccando su Continua, accetti i nostri <Link href="https://parkito.app/terminiecondizioni">Termini e Condizioni</Link>.
      </FieldDescription>
    </div>
  )
}
