"use client"

import * as React from "react"
import {
  LifeBuoy,
  ChartLine,
  Map,
  Euro,
  Send,
  BookMarked,
  Images,
  HandHeart,
  Calendar,
  CalendarRange,
} from "lucide-react"

import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { DriverData, Parking } from "@/types"

/**
 * Only becomes true after client mount. Use to avoid rendering Radix dropdowns
 * during SSR/first paint so server and client HTML match (prevents hydration
 * mismatch on Radix-generated IDs).
 */
function useMounted() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  return mounted
}

// This is sample data.
const data = {

  home: [{
    name: "Analitica🚧",
    url: "/",
    icon: ChartLine,
  }],

  projects: [
    {
      name: "Informazioni🚧",
      url: "/parking-info",
      icon: Map,
    },
    {
      name: "Prenotazioni🚧",
      url: "/bookings",
      icon: BookMarked,
    },
    {
      name: "Galleria🚧",
      url: "/gallery",
      icon: Images,
    }
  ],
  availability: [
    {
      name: "Prezzi e disponibilità",
      url: "/calendar",
      icon: CalendarRange,
    }
  ],
  secondary: [
    {
      name: "Supporto",
      url: "/contact",
      icon: LifeBuoy,
    },
    {
      name: "Feedback",
      url: "/feedback",
      icon: Send,
    }
  ],
  services: [
    {
      name: "Servizi🚧",
      url: "/services",
      icon: HandHeart
    }
  ]
}

export default function AppSidebar({
  parkings,
  user,
  onRefreshParkings,
  isRefreshingParkings = false,
  ...props
}: {
  parkings: Parking[]
  user: DriverData
  onRefreshParkings?: () => void
  isRefreshingParkings?: boolean
} & React.ComponentProps<typeof Sidebar>) {
  const mounted = useMounted()
  return (
    <Sidebar variant="floating" collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher
          teams={parkings}
          interactive={mounted}
          onRefresh={onRefreshParkings}
          isRefreshing={isRefreshingParkings}
        />
      </SidebarHeader>
      <SidebarContent className="relative">
        {/* <NavMain items={data.navMain} /> */}
        <NavProjects title="Home" projects={data.home} />
        <NavProjects title="Disponibilità&Prezzi" projects={data.availability} />
        <NavProjects title="Parcheggio" projects={data.projects} />
        <NavProjects title="Servizi" projects={data.services} />
        <div className="absolute bottom-0 w-full">
          <NavProjects title="" projects={data.secondary} />
        </div>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} interactive={mounted} />
      </SidebarFooter>
    </Sidebar>
  )
}
