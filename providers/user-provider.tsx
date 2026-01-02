"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react"
import { User } from "@supabase/supabase-js"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import { getDriverData, getHostData } from "@/lib/getUser.client"
import type { DriverData, HostData } from "@/types"

interface UserContextType {
    user: User | null
    driver: DriverData | null
    host: HostData | null
    loading: boolean
    isHost: boolean
    refreshUser: () => Promise<void>
    refreshDriver: () => Promise<void>
    signOut: () => Promise<void>
    signInWithGoogle: () => Promise<void>
    signInWithApple: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

interface UserProviderProps {
    children: ReactNode
    initialUser: User | null
    initialDriver: DriverData | null
    initialHost: HostData | null
}

export function UserProvider({ children, initialUser, initialDriver, initialHost }: UserProviderProps) {
    const [user, setUser] = useState<User | null>(initialUser)
    const [driver, setDriver] = useState<DriverData | null>(initialDriver)
    const [host, setHost] = useState<HostData | null>(initialHost)
    const [loading, setLoading] = useState(false)
    const supabase = getSupabaseBrowserClient()
    const router = useRouter()
    const pathname = usePathname()

    // Derived state: is the user a host?
    const isHost = host !== null

    // Fetch driver and host data for a user
    const fetchUserData = useCallback(async (userId: string) => {
        const [driverData, hostData] = await Promise.all([
            getDriverData(userId),
            getHostData(userId)
        ])
        setDriver(driverData)
        setHost(hostData)
        return { driver: driverData, host: hostData }
    }, [])

    // Refresh driver data
    const refreshDriver = useCallback(async () => {
        if (!user?.id) return
        await fetchUserData(user.id)
    }, [user, fetchUserData])

    // Sign in with Google OAuth
    const signInWithGoogle = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/`,
            },
        })
        console.log("[Google OAuth] URL:", data?.url)
        if (error) {
            setLoading(false)
            throw error
        }
    }, [supabase.auth])

    // Sign in with Apple OAuth
    const signInWithApple = useCallback(async () => {
        setLoading(true)
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "apple",
            options: {
                redirectTo: `https://annabella-unbroiled-exchangeably.ngrok-free.dev`,
            },
        })
        if (error) {
            setLoading(false)
            throw error
        }
    }, [supabase.auth])

    // Sign out and redirect to login
    const signOut = useCallback(async () => {
        setLoading(true)
        await supabase.auth.signOut()
        setUser(null)
        setDriver(null)
        setHost(null)
        setLoading(false)
        // Force a full page reload to clear any cached state and let proxy handle redirect
        window.location.href = "/login"
    }, [supabase.auth])

    // Refresh user data from Supabase
    const refreshUser = useCallback(async () => {
        setLoading(true)
        const { data: { user: fetchedUser }, error } = await supabase.auth.getUser()
        if (error || !fetchedUser) {
            // Session expired or invalid - redirect to login
            setUser(null)
            setDriver(null)
            setHost(null)
            setLoading(false)
            window.location.href = "/login"
            return
        }
        setUser(fetchedUser)
        // Fetch driver and host data
        const { host: hostData } = await fetchUserData(fetchedUser.id)
        setLoading(false)

        // Check if user is a host - if not, redirect to not-a-host page
        if (!hostData && pathname !== "/not-a-host" && pathname !== "/login") {
            window.location.href = "/not-a-host"
        }
    }, [supabase.auth, fetchUserData, pathname])

    // Listen for auth state changes
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log("[Auth Event]:", event)

                switch (event) {
                    case "SIGNED_IN":
                        setUser(session?.user ?? null)
                        // Fetch driver and host data on sign in
                        if (session?.user?.id) {
                            const { host: hostData } = await fetchUserData(session.user.id)

                            // Check if user is a host - if not, redirect to not-a-host page
                            if (!hostData) {
                                // Sign out the user since they're not authorized
                                await supabase.auth.signOut()
                                window.location.href = "/not-a-host"
                                return
                            }

                            // User is a host, redirect to dashboard
                            router.push("/")
                        }
                        break

                    case "TOKEN_REFRESHED":
                        // Token was successfully refreshed
                        setUser(session?.user ?? null)
                        break

                    case "SIGNED_OUT":
                        setUser(null)
                        setDriver(null)
                        setHost(null)
                        // Only redirect to login if not already on not-a-host or login page
                        if (pathname !== "/not-a-host" && pathname !== "/login") {
                            window.location.href = "/login"
                        }
                        break

                    case "USER_UPDATED":
                        // User data was updated (e.g., email, metadata)
                        setUser(session?.user ?? null)
                        // Refresh driver and host data as well
                        if (session?.user?.id) {
                            await fetchUserData(session.user.id)
                        }
                        break

                    case "PASSWORD_RECOVERY":
                        // User clicked password recovery link
                        break

                    default:
                        // Handle any session issues
                        if (!session?.user) {
                            setUser(null)
                            setDriver(null)
                            setHost(null)
                        }
                }
            }
        )

        return () => {
            subscription.unsubscribe()
        }
    }, [supabase.auth, router, fetchUserData, pathname])

    // Periodically check if session is still valid (every 5 minutes)
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession()
            if (error || !session) {
                // Session expired
                setUser(null)
                setDriver(null)
                setHost(null)
                window.location.href = "/login"
            }
        }

        // Check session every 5 minutes
        const interval = setInterval(checkSession, 5 * 60 * 1000)

        return () => clearInterval(interval)
    }, [supabase.auth])

    // Check host status on initial load (for page refreshes)
    useEffect(() => {
        // Skip if on login or not-a-host pages, or if no user
        if (!user || pathname === "/login" || pathname === "/not-a-host") {
            return
        }

        // If user exists but host is null, they're not a host
        if (host === null && initialHost === null) {
            window.location.href = "/not-a-host"
        }
    }, [user, host, initialHost, pathname])

    return (
        <UserContext.Provider value={{ user, driver, host, loading, isHost, refreshUser, refreshDriver, signOut, signInWithGoogle, signInWithApple }}>
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

