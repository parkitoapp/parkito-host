import BookACall from "@/components/BookACall";
import Calendar from "@/components/Calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar1, Euro } from "lucide-react";
import PriceEditor from "@/components/PriceEditor";
import TitleHeader from "@/components/TitleHeader";

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
    <div className="flex flex-1 flex-col min-h-[calc(100vh-4em)]">
      <div className="w-full flex flex-row justify-between items-center mb-6">
        <TitleHeader title="Gestisci prezzi e disponibilità del tuo parcheggio" description="Gestisci prezzi giornalieri e disponibilità del tuo parcheggio" />

        <BookACall />

      </div>
      <Tabs defaultValue="price">
        <TabsList className="w-full">
          <TabsTrigger value="price">
            <Euro />
            Prezzi
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar1 />
            Calendario
          </TabsTrigger>
        </TabsList>
        <TabsContent value="price" className="p-4">
          <PriceEditor />
        </TabsContent>
        <TabsContent value="calendar" className="p-4">
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
        </TabsContent>
      </Tabs>
    </div>
  )
}