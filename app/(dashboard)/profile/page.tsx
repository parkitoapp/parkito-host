import ProfileSection from "@/components/ProfileSection"

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold">Dati personali</h1>
          <p className="text-muted-foreground">Gestisci i tuoi dati personali</p>
        </div>
      </div>
      <ProfileSection />
    </div>
  )
}
