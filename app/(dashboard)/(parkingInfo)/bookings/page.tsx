import BookingsTab from "@/components/BookingsTab";
import TitleHeader from "@/components/TitleHeader";
export default function BookingsPage() {
  return (
    <div className="flex flex-1 flex-col min-h-[calc(100vh-4em)]">
      <TitleHeader title="Prenotazioni" description="Monitora e rivedi tutte le prenotazioni passate e future per questo parcheggio." />
      <BookingsTab />
    </div>
  )
}
