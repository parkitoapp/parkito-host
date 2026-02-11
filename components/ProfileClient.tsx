"use client"
import ProfileSection from "./ProfileSection";
import { useUser } from "@/providers/user-provider";
import Invoices from "./Invoices";
import Preferences from "./Preferences";

export default function ProfileClient() {
  const { driver: user, host } = useUser()
  if (!user || !host) return null
  return (
    <div className="flex flex-col gap-4">
      <ProfileSection user={user} host={host} />
      <Invoices host={host} />
      <Preferences host={host} user={user} />
    </div>
  )
}