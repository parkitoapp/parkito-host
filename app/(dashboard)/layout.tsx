"use client"

import { useUser } from "@/providers/user-provider"
import { Spinner } from "@/components/ui/spinner"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import AppSidebar from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"
import { fetchParkingByHostId } from "@/lib/getUser.client"
import { Parking } from "@/types"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, driver, host, loading } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const [parkings, setParkings] = useState<Parking[]>([])

  // Client-side protection as backup to server-side proxy
  useEffect(() => {
    // If we're not loading and we have no user, we might be in a logout flow
    // UserProvider will handle the redirect via window.location.href for a hard reset
    // but we keep this as a secondary check for router-based navigation if needed.
    if (!loading && !user && pathname !== "/login") {
      // Small delay to allow UserProvider's hard redirect to fire first
      const timer = setTimeout(() => {
        router.push("/login")
      }, 500)
      return () => clearTimeout(timer)
    }

    if (!loading && user && !host && pathname !== "/not-a-host") {
      router.push("/not-a-host")
    }
  }, [user, host, loading, router, pathname])

  // Fetch parkings when host is available
  useEffect(() => {
    const getParkings = async () => {
      if (host?.id) {
        const data = await fetchParkingByHostId(host.id)
        setParkings(data as Parking[])
      }
    }
    getParkings()
  }, [host])

  // Show loading state while checking auth
  // If loading is true OR if we have no user (and not currently on login page)
  if (loading || (!user && pathname !== "/login")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="w-8 h-8" />
          <p className="text-muted-foreground">
            {!user ? "Uscita in corso..." : "Caricamento..."}
          </p>
        </div>
      </div>
    )
  }

  // If we have user/host but are still waiting for driver/host data
  if (!user || !host || !driver) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="w-8 h-8" />
          <p className="text-muted-foreground">Caricamento dati...</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar user={driver} parkings={parkings} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
          </div>
        </header>
        <div>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}