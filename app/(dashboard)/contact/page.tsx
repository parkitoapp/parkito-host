import { SelectOption, TeamMember } from "@/types";
import ContactCalendarClient from "@/components/ContactCalendarClient";
import TitleHeader from "@/components/TitleHeader";

export const teamMembers: Record<string, TeamMember> = {
  benedetta: {
    id: "benedetta",
    name: "Benedetta Sclano",
    url: "https://calendar.google.com/calendar/appointments/schedules/AcZssZ0WgIlL4rI3dp95elxxMKo6AQQ1H282lzryMyMBcFSx46NhCDYx7v-UQQypdzdGYYvqCODYxbFV?gv=true",
    image: "/benedetta.webp",
  },
  marco: {
    id: "marco",
    name: "Marco Lepore",
    url: "https://calendar.google.com/appointments/schedules/AcZssZ0O8OAVj6qSoJ8xNS6FC0KE9nRNDzj7Eg-VdeF5KdRkHgsXoXd0c6Tf_KH4xnJe1XjYDI1NnuJz",
    image: "/marco.webp",
  },
  davide: {
    id: "davide",
    name: "Davide Facchin",
    url: "https://calendar.google.com/calendar/appointments/schedules/AcZssZ1LvbiF0Z03OV9b0q_eXmOM257cDK2lfkROwib3lm-CSShGUrAk4tVJ2SgKy_4s_rGkjPA8Rwr6?gv=true",
    image: "/davide.webp",
  },
  nicolo: {
    id: "nicolo",
    name: "Nicolò Mignacca",
    url: "https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0q6crGA80PhHAfGJth6R0ZS67BPzJbCT7Q_q9L-aKrlvczUDU_bQ9kfvlOZmMX81ygv6FGtVaz",
    image: "/nicolo.webp",
  },
  parkito:
  {
    id: "parkito",
    name: "Team Parkito",
    url: "",
    image: "/logo-cropped.webp",
  }
}

export const selectOptions: SelectOption[] = [
  { label: "Non ho ricevuto il mio pagamento", memberId: "marco" },
  { label: "Il mio dispositivo non funziona", memberId: "marco" },
  { label: "Ho problemi con le disponbilità sul calendario", memberId: "benedetta" },
  { label: "Ho dubbi sul giusto prezzo da impostare", memberId: "davide" },
  { label: "Un driver ha danneggiato il mio parcheggio", memberId: "davide" },
];

export default function page() {
  return (
    <div className="w-full max-h-screen mx-auto">
      <TitleHeader title="Contattaci" description="Il nostro team è sempre disponibile per aiutarti." />
      <ContactCalendarClient teamMembers={teamMembers} selectOptions={selectOptions} />
    </div>
  )
}