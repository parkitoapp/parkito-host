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
} from "lucide-react"

import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { DriverData, Parking } from "@/types"
import { NavSecondary } from "./nav-secondary"

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
      name: "Calendario",
      url: "/calendar",
      icon: Calendar,
    },
    {
      name: "Prezzi",
      url: "/price",
      icon: Euro,
    }
  ],
  secondary: [
    {
      title: "Supporto",
      url: "/contact",
      icon: LifeBuoy,
    },
    {
      title: "Feedback🚧",
      url: "/feedback",
      icon: Send,
    },
  ],
  services: [
    {
      name: "Servizi🚧",
      url: "/services",
      icon: HandHeart
    }
  ]
}

export default function AppSidebar({ parkings, user, ...props }: { parkings: Parking[], user: DriverData } & React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="floating" collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={parkings} />
      </SidebarHeader>
      <SidebarContent>
        {/* <NavMain items={data.navMain} /> */}
        <NavProjects title="Home" projects={data.home} />
        <NavProjects title="Parcheggio" projects={data.projects} />
        <NavProjects title="Disponibilità&Prezzi" projects={data.availability} />
        <NavProjects title="Servizi" projects={data.services} />
      </SidebarContent>
      <SidebarFooter>
        <NavSecondary items={data.secondary} />
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
