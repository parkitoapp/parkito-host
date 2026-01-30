"use client"

import { useUser } from "@/providers/user-provider"
import { useParkings } from "@/hooks/use-parkings"
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
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, driver, host, loading } = useUser()
  const { parkings, refetch, isFetching } = useParkings(host?.id)
  const router = useRouter()
  const pathname = usePathname()

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

  const getBreadcrumbItems = () => {
    const pathSegments = pathname.split("/").filter((segment) => segment !== "")
    return pathSegments.map((segment, index) => {
      const href = "/" + pathSegments.slice(0, index + 1).join("/")
      return (
        <BreadcrumbItem key={href}>
          <BreadcrumbLink href={href}>{segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase()}</BreadcrumbLink>
        </BreadcrumbItem>
      )
    })
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
      <AppSidebar user={driver} parkings={parkings} onRefreshParkings={refetch} isRefreshingParkings={isFetching} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                {getBreadcrumbItems().map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <BreadcrumbSeparator />
                    {item}
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="px-2">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}