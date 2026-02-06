"use client"

import * as React from "react"
import { MapPin, ChevronsUpDown, RefreshCw } from "lucide-react"

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
import { useSelectedParkingOptional } from "@/providers/selected-parking-provider"
import { Parking } from "@/types"
import Image from "next/image"

const teamSwitcherButtonContent = (activeTeam: Parking) => (
  <>
    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-transparent text-transparent-foreground group-data-[collapsible=icon]:mx-auto">
      <Image src={"/logo-cropped.webp"} alt="Logo" width={24} height={24} className="rounded-md" />
    </div>
    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
      <span className="truncate font-medium">{activeTeam.address}</span>
      <span className="truncate text-xs">{activeTeam.city}, ID: {activeTeam.id}</span>
    </div>
    <ChevronsUpDown className="ml-auto group-data-[collapsible=icon]:hidden" />
  </>
)

export function TeamSwitcher({
  teams,
  interactive = true,
  onRefresh,
  isRefreshing = false,
}: {
  teams: Parking[]
  interactive?: boolean
  onRefresh?: () => void
  isRefreshing?: boolean
}) {
  const { isMobile } = useSidebar()
  const selectedCtx = useSelectedParkingOptional()
  const [localTeam, setLocalTeam] = React.useState<Parking | null>(teams[0] || null)

  const activeTeam = selectedCtx?.selectedParking ?? localTeam ?? teams[0] ?? null

  // #region agent log
  React.useEffect(() => {
    fetch("http://127.0.0.1:7242/ingest/85070798-5b27-4ee4-bc65-240a7665c3d5", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "debug-session",
        runId: "initial",
        hypothesisId: "H3",
        location: "team-switcher.tsx:render",
        message: "TeamSwitcher activeTeam vs context",
        data: {
          teamsCount: teams.length,
          firstTeamId: teams[0]?.id ?? null,
          selectedCtxId: selectedCtx?.selectedParkingId ?? null,
          selectedCtxParkingId: selectedCtx?.selectedParking?.id ?? null,
          localTeamId: localTeam?.id ?? null,
          activeTeamId: activeTeam?.id ?? null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
  }, [teams, selectedCtx?.selectedParkingId, selectedCtx?.selectedParking, localTeam, activeTeam])
  // #endregion agent log

  React.useEffect(() => {
    if (!activeTeam && teams.length > 0) {
      const first = teams[0]
      if (selectedCtx) selectedCtx.setSelectedParkingId(first.id)
      else setLocalTeam(first)
    }
  }, [teams, activeTeam, selectedCtx])

  // Before client mount (interactive=false), show placeholder so we never paint
  // the wrong parking (SSR has no localStorage and would show teams[0]).
  const showPlaceholder = !interactive

  if (!activeTeam && !showPlaceholder) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <MapPin className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-medium">Nessun parcheggio</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const triggerButton = (
    <SidebarMenuButton
      size="lg"
      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
    >
      {showPlaceholder ? (
        <>
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-transparent text-transparent-foreground group-data-[collapsible=icon]:mx-auto">
            <Image src={"/logo-cropped.webp"} alt="Logo" width={24} height={24} className="rounded-md" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-medium text-muted-foreground">Caricamento...</span>
          </div>
        </>
      ) : (
        teamSwitcherButtonContent(activeTeam!)
      )}
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
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-lg">
              I miei parcheggi
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {onRefresh && (
              <DropdownMenuItem
                onClick={() => onRefresh()}
                disabled={isRefreshing}
                className="gap-2 p-2 text-muted-foreground"
              >
                <RefreshCw className={`size-4 shrink-0 ${isRefreshing ? "animate-spin" : ""}`} />
                <span>{isRefreshing ? "Aggiornamento..." : "Aggiorna lista"}</span>
              </DropdownMenuItem>
            )}
            {onRefresh && <DropdownMenuSeparator />}
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={index}
                onClick={() => {
                  if (selectedCtx) selectedCtx.setSelectedParkingId(team.id)
                  else setLocalTeam(team)
                }}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <MapPin className="size-3.5 shrink-0" />
                </div>
                {team.address}, ID: {team.id}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
