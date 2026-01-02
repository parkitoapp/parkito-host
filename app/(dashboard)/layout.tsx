"use client"

import { useUser } from "@/providers/user-provider"
import { Spinner } from "@/components/ui/spinner"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, host, loading } = useUser()
    const router = useRouter()

    // Client-side protection as backup to server-side proxy
    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login")
            } else if (!host) {
                router.push("/not-a-host")
            }
        }
    }, [user, host, loading, router])

    // Show loading state while checking auth
    if (loading || !user || !host) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Spinner className="w-8 h-8" />
                    <p className="text-muted-foreground">Caricamento...</p>
                </div>
            </div>
        )
    }

    return <>{children}</>
}

