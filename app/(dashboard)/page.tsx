"use client"

import { Button } from "@/components/ui/button";
import { useUser } from "@/providers/user-provider";

export default function Home() {

  const { user, driver, signOut, loading } = useUser();

  if (!user) {
    return <div>Caricamento...</div>;
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <div>
        <p><strong>Ciao, {user.email}!</strong></p>
        {driver && (
          <p className="text-muted-foreground text-sm">
            {driver.name || "driver name"} {driver.surname || "driver surname"} {driver.phone || "driver phone"} {driver.email || "driver email"}
          </p>
        )}
      </div>
      <Button onClick={() => signOut()} disabled={loading}>
        {loading ? "Uscita..." : "Esci"}
      </Button>
    </div>
  );
}
