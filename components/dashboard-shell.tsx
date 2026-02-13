"use client"

import { useUser } from "@/providers/user-provider"
import { useParkings } from "@/hooks/use-parkings"
import { SelectedParkingProvider } from "@/providers/selected-parking-provider"
import { GlobalLoading } from "@/components/global-loading"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import AppSidebar from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const { driver, host, loading } = useUser()
  const { parkings, refetch, isFetching } = useParkings(host?.id)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(id)
  }, [])

  // Client-side protection as backup to server-side proxy
  useEffect(() => {
    if (!mounted) return
    if (!loading && !driver && pathname !== "/login") {
      const timer = setTimeout(() => {
        router.push("/login")
      }, 500)
      return () => clearTimeout(timer)
    }

    if (!loading && driver && !host && pathname !== "/not-a-host") {
      router.push("/not-a-host")
    }
  }, [mounted, driver, host, loading, router, pathname])

  if (!mounted) {
    return <GlobalLoading message="Caricamento..." />
  }

  if (loading) {
    return <GlobalLoading message="Caricamento..." />
  }

  if (!driver && pathname !== "/login") {
    return null
  }

  const getBreadcrumbItems = () => {
    const pathSegments = pathname.split("/").filter((segment) => segment !== "")
    return pathSegments.map((segment, index) => {
      const href = "/" + pathSegments.slice(0, index + 1).join("/")
      return (
        <BreadcrumbLink key={index} href={href}>
          {segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase()}
        </BreadcrumbLink>
      )
    })
  }

  if (!driver || !host) {
    return <GlobalLoading message="Caricamento dati..." />
  }

  return (
    <SelectedParkingProvider parkings={parkings}>
      <SidebarProvider>
        <AppSidebar
          user={driver}
          parkings={parkings}
          onRefreshParkings={refetch}
          isRefreshingParkings={isFetching}
        />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex h-16 shrink-0 items-center gap-2 px-2">
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
                  <BreadcrumbSeparator />
                  {getBreadcrumbItems().map((item, index) => (
                    <BreadcrumbItem key={index}>{item}</BreadcrumbItem>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="px-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </SelectedParkingProvider>
  )
}
