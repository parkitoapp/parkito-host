import ServiceCard from "@/components/ServiceCard";
import { servicesType } from "@/types";
import Link from "next/link";

const services: servicesType[] = [
  {
    id: "allianz",
    src: "/card1.webp",
    title: "Assicurazione Parkito x Allianz",
    description: "Tutela il struttura e veicolo in caso di furto, incendio o eventi esterni con l'assicurazione Parkito x Allianz",
    url: "https://assicurazione.parkito.app"
  },
  {
    id: "dispositivi",
    src: "/card2.webp",
    title: "Automatizza gli accessi",
    description: "Acquista i dispositivi compatibili con la piattaforma Parkito e facilita gli ingressi al tuo parcheggio",
    url: "https://dispositivi.parkito.app"
  },
  {
    id: "servizio-foto",
    src: "/card3.webp",
    title: "Foto per il tuo parcheggio",
    description: "Foto professionali = più prenotazioni! Un membro del team verrà di persona per scattare e caricare le foto direttamente in app. ",
    url: "https://servizio-foto.parkito.app"
  },
]


export default function page() {
  return (
    <div className="flex flex-col gap-2 min-h-[calc(100dvh-2em)] items-center justify-center mb-4">
      <div className=" w-full flex flex-col gap-2 items-start justify-start mb-8">
        <h1 className="text-2xl font-bold">Servizi Aggiuntivi</h1>
        <p className="text-md text-muted-foreground">Servizi aggiuntivi per massimizzare le prenotazioni del tuo parcheggio</p>
      </div>
      <div className="flex flex-col gap-6">
        {services.map((service) => (
          <Link key={service.id} href={service.url} className="hover:scale-105 transition-scale duration-300 hover:cursor-pointer">
            <ServiceCard service={service} />
          </Link>
        ))}
      </div>

    </div>
  );
}