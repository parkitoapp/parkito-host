"use client"

import { useUser } from "@/providers/user-provider"
import { Spinner } from "@/components/ui/spinner"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import AppSidebar from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, driver, host, loading } = useUser()
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
  // We also check for !driver here to ensure AppSidebar has it
  if (loading || !user || !host || !driver) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="w-8 h-8" />
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar user={driver} parkings={[]} />
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