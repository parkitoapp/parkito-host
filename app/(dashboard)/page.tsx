import { Suspense } from "react";
import { SectionCards } from "@/components/SectionCards";
import { DashboardUpcomingBookings } from "@/components/dashboard-upcoming-bookings";
import { ChartAreaInteractive } from "@/components/ChartArea";

export default function Home() {

  return (
    <div className="flex flex-1 flex-col min-h-[calc(100vh-68px)]">
      <div className="@container/main flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
        </div>
        <div>
          <ChartAreaInteractive />
        </div>
        <div className="flex-1 min-h-full px-2 lg:px-2 flex w-full rounded-lg py-4">
          <Suspense fallback={<div className="flex-1 bg-background/5 rounded-lg p-4" />}>
            <DashboardUpcomingBookings />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
