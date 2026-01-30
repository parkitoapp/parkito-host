"use client"

import {
  ChevronsUpDown,
  LogOut,
} from "lucide-react"
import { useUser } from "@/providers/user-provider"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { DriverData } from "@/types"
import ThemeSwitch from "./ThemeSwitch"
import Link from "next/link"

const navUserTriggerContent = (user: DriverData) => {
  const displayName = [user.name, user.surname].filter(Boolean).join(" ") || "Utente Parkito"
  const initials = [user.name, user.surname].filter(Boolean).map(n => n?.[0]).join("") || "PK"
  return (
    <>
      <Avatar className="h-8 w-8 rounded-lg">
        <AvatarImage src={user.avatar_url || ""} alt={displayName} />
        <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{displayName}</span>
        <span className="truncate text-xs">{user.email || ""}</span>
      </div>
      <ChevronsUpDown className="ml-auto size-4" />
    </>
  )
}

export function NavUser({
  user,
  interactive = true,
}: {
  user: DriverData
  interactive?: boolean
}) {
  const { isMobile } = useSidebar()
  const { signOut } = useUser()

  if (!user) return null

  const displayName = [user.name, user.surname].filter(Boolean).join(" ") || "Utente Parkito"
  const initials = [user.name, user.surname].filter(Boolean).map(n => n?.[0]).join("") || "PK"

  const triggerButton = (
    <SidebarMenuButton
      size="lg"
      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
    >
      {navUserTriggerContent(user)}
    </SidebarMenuButton>
  )

  if (!interactive) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>{triggerButton}</SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {triggerButton}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal hover:bg-sidebar-accent rounded-sm">
              <Link href="/account">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-10 w-10 rounded-lg">
                    <AvatarImage src={user.avatar_url || ""} alt={displayName} />
                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{displayName}</span>
                    <span className="truncate text-xs">{user.email || ""}</span>
                  </div>
                </div>
              </Link>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer items-center flex justify-center">
              <ThemeSwitch />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Esci</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
