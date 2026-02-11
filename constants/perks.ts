export type PerkDefinition = {
  id: string;
  title: string;
  description: string;
  url: string;
};

export const PERKS: PerkDefinition[] = [
  {
    id: "custode",
    title: "Custode",
    description: "Condominio sorvegliato 24/7",
    url: "/perk1.webp",
  },
  {
    id: "telecamere",
    title: "Telecamere di sicurezza",
    description: "Condominio e/o posto auto dotato di telecamere",
    url: "/perk2.webp",
  },
  {
    id: "disabilita",
    title: "Accesso per persone con disabilità",
    description:
      "I parcheggi accessibili a persone con disabilità ricevono il 20% di prenotazioni in più",
    url: "/perk3.webp",
  },
  {
    id: "nessuno",
    title: "Nessuno",
    description: "Il parcheggio non offre nessuno dei vantaggi elencati sopra",
    url: "/perk4.webp",
  },
];
