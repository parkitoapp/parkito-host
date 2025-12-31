"use client"

import { Button } from "@/components/ui/button";
import { useUser } from "@/providers/user-provider";

export default function Home() {
  const { user, signOut, loading } = useUser();

  if (!user) {
    return <div>Caricamento...</div>;
  }
  console.log(user)

  console.log(user.identities?.[0]?.identity_data?.surname)


  return (
    <div>
      <Button onClick={signOut} disabled={loading}>
        {loading ? "Uscita..." : "Esci"}
      </Button>
    </div>
  );
}
