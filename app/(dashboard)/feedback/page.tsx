
import ContactFormClient from "@/components/ContactFormClient";
import TitleHeader from "@/components/TitleHeader";

export default function FeedbackPage() {
  return (
    <div className="flex flex-col gap-4">
      <TitleHeader title="La tua opinione conta!" description="Dacci un feedback su qualsiasi argomento! Il nostro prodotto è in continuo miglioramento grazie ai vostri feedback. " />
      <ContactFormClient />
    </div>
  )
}