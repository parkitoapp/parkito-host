"use client"


import { useUser } from "@/providers/user-provider";
import WorkInProgress from "@/components/WorkInProgress";

export default function Home() {

  const { user } = useUser();

  if (!user) {
    return <div>Caricamento...</div>;
  }

  return (
    <div className="flex flex-1 flex-col">
      <WorkInProgress name='L&apos;Analitica' />
    </div>
  );
}
