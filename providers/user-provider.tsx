"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react"
import { User } from "@supabase/supabase-js"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface UserContextType {
    user: User | null
    loading: boolean
    refreshUser: () => Promise<void>
    signOut: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

interface UserProviderProps {
    children: ReactNode
    initialUser: User | null
}

export function UserProvider({ children, initialUser }: UserProviderProps) {
    const [user, setUser] = useState<User | null>(initialUser)
    const [loading, setLoading] = useState(false)
    const supabase = getSupabaseBrowserClient()
    const router = useRouter()

    // Sign out and redirect to login
    const signOut = useCallback(async () => {
        setLoading(true)
        await supabase.auth.signOut()
        setUser(null)
        setLoading(false)
        // Force a full page reload to clear any cached state and let proxy handle redirect
        window.location.href = "/login"
    }, [supabase.auth])

    // Refresh user data from Supabase
    const refreshUser = useCallback(async () => {
        setLoading(true)
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) {
            // Session expired or invalid - redirect to login
            setUser(null)
            setLoading(false)
            window.location.href = "/login"
            return
        }
        setUser(user)
        setLoading(false)
    }, [supabase.auth])

    // Listen for auth state changes
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log("[Auth Event]:", event)

                switch (event) {
                    case "SIGNED_IN":
                        setUser(session?.user ?? null)
                        break

                    case "TOKEN_REFRESHED":
                        // Token was successfully refreshed
                        setUser(session?.user ?? null)
                        break

                    case "SIGNED_OUT":
                        setUser(null)
                        // Redirect to login on sign out
                        window.location.href = "/login"
                        break

                    case "USER_UPDATED":
                        // User data was updated (e.g., email, metadata)
                        setUser(session?.user ?? null)
                        break

                    case "PASSWORD_RECOVERY":
                        // User clicked password recovery link
                        break

                    default:
                        // Handle any session issues
                        if (!session?.user) {
                            setUser(null)
                        }
                }
            }
        )

        return () => {
            subscription.unsubscribe()
        }
    }, [supabase.auth, router])

    // Periodically check if session is still valid (every 5 minutes)
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession()
            if (error || !session) {
                // Session expired
                setUser(null)
                window.location.href = "/login"
            }
        }

        // Check session every 5 minutes
        const interval = setInterval(checkSession, 5 * 60 * 1000)

        return () => clearInterval(interval)
    }, [supabase.auth])

    return (
        <UserContext.Provider value={{ user, loading, refreshUser, signOut }}>
            {children}
        </UserContext.Provider>
    )
}

export function useUser() {
    const context = useContext(UserContext)
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider")
    }
    return context
}

