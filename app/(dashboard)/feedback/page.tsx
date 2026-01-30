
import ContactFormClient from "@/components/ContactFormClient";

export default function FeedbackPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-6xl font-bold"> La tua opinione conta!</h1>
      <p className="text-lg">Dacci un feedback su qualsiasi argomento! Il nostro prodotto è in continuo miglioramento grazie ai vostri feedback. </p>
      <ContactFormClient />
    </div>
  )
}