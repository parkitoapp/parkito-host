import { Button } from "@/components/ui/button";
import Calendar from "@/components/Calendar";
import { Card, CardContent } from "@/components/ui/card";

const legendItems = [

  {
    title: "Disponibile tutto il giorno con prezzo personalizzato",
    color: "bg-green-500",
  },
  {
    title: "Disponibile tutto il giorno con prezzo personalizzato per fascia oraria",
    color: "bg-blue-500",
  },
  {
    title: "Non disponibile",
    color: "bg-red-500",
  },
  {
    title: "Fascia/e oraria/e non disponibile/i",
    color: "bg-amber-500",
  },
];


export default function page() {
  return (
    <div className="">
      <div className="w-full flex flex-row justify-between items-center mb-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Calendario Delle Disponibilità</h1>
          <p className="text-sm text-gray-300">
            Gestisci prezzi giornalieri e disponibilità del tuo parcheggio
          </p>
        </div>
        <div className="flex flex-row gap-2">
          <Button variant="default">Suggerimenti sui prezzi</Button>
        </div>
      </div>
      <div className="w-full grid grid-cols-12 gap-4">
        <div className="col-span-9">
          <Calendar />
        </div>
        <div className="col-span-3">
          <div className="flex-col gap-2">
            <Card className="flex flex-col gap-2">
              <CardContent className="flex flex-col gap-2">
                <div className="flex flex-col gap-2">
                  {legendItems.map((item, idx) => (
                    <div className="flex flex-row items-center gap-2" key={idx}>
                      <div
                        className={`w-3 h-3 rounded-full shrink-0 ${item.color} ${item.color === "bg-white" ? "border-2 border-neutral-300" : ""
                          }`}
                      />
                      <p className="text-sm">{item.title}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  )
}