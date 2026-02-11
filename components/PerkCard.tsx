import { cn } from "@/lib/utils"
import { PERKS } from "@/constants/perks"
import { Card, CardContent, CardDescription, CardTitle } from "./ui/card"
import Image from "next/image"
export default function PerkCard({ selected, perk }: { selected: boolean, perk: typeof PERKS[number] }) {

  return (
    <Card
      className={cn(
        "flex flex-col items-start gap-1.5 rounded-md border px-3 py-2 text-md w-full",
        selected
          ? "border-primary bg-primary/5 text-primary"
          : "border-border text-muted-foreground"
      )}
    >
      <CardContent className="flex flex-row items-center gap-3 w-full p-4">
        <Image
          src={perk.url}
          alt={perk.title}
          width={64}
          height={64}
          className="rounded-md object-contain"
        />
        <div className="flex flex-col items-start gap-1">
          <CardTitle className="text-lg font-semibold leading-snug">
            {perk.title}
          </CardTitle>
          <CardDescription className="text-md text-muted-foreground">{perk.description}</CardDescription>
        </div>
      </CardContent>
    </Card>
  )
}