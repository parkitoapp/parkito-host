"use client"


import { useUser } from "@/providers/user-provider";
import { SectionCards } from "@/components/SectionCards";



export default function Home() {

  const { user } = useUser();

  if (!user) {
    return <div>Caricamento...</div>;
  }

  return (
    <div className="flex flex-1 flex-col min-h-[calc(100vh-68px)]">
      <div className="@container/main flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
        </div>
        <div className="flex-1 min-h-full px-2 lg:px-2 bg-blue-950 flex w-full rounded-lg" />
      </div>
    </div>
  );
}
