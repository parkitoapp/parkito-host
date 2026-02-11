"use client";

import { DriverData, HostData } from "@/types";
import { Card, CardTitle, CardHeader, CardContent } from "./ui/card";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { usePalette, PaletteId } from "@/providers/palette-provider";


export default function Preferences({ user, host }: { user: DriverData, host: HostData }) {

  const palettes: { id: PaletteId; label: string }[] = [
    { id: "default", label: "Default" },
    { id: "sage-green", label: "Verde Salvia" },
    { id: "amethyst-haze", label: "Ametista" },
    { id: "caffeine", label: "Caffeina" },
    { id: "amber", label: "Ambra" },
    { id: "burgundy", label: "Vino Tinto" },
  ];

  // Optional: hard-code preview colors for each palette.
  // You can tweak these to match your real tokens.
  const palettePreviewColor: Record<string, string> = {
    default: "oklch(0.4816 0.2581 265.7097)", // base --primary
    "sage-green": "oklch(0.783 0.0384 132.737)", // theme-sage-green --primary
    "amethyst-haze": "oklch(0.6104 0.0767 299.7335)", // theme-amethyst-haze --primary
    caffeine: "oklch(0.4341 0.0392 41.9938)", // theme-caffeine --primary
    amber: "oklch(0.7686 0.1647 70.0804)", // theme-amber --primary
    burgundy: "oklch(0.38 0.1523 18.6219)", // neutral mono-ish primary
  };

  const { palette, setPalette } = usePalette();

  return (
    <Card className="w-5xl mx-auto">
      <CardHeader>
        <CardTitle>Preferenze</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <div className="text-sm font-medium">
            Preferred theme
          </div>
          <div className="flex flex-wrap gap-2">
            {palettes.map((p) => (
              <Tooltip key={p.id}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="default"
                    variant={palette === p.id ? "default" : "outline"}
                    className="p-1 border-none"
                    onClick={() => setPalette(p.id)}
                    aria-label={p.label}
                  >
                    <span
                      className="size-8 rounded-md border border-border shadow-sm"
                      style={{
                        backgroundColor: palettePreviewColor[p.id] ?? "var(--primary)",
                      }}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {p.label}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
          <div className="text-xs text-foreground">
            Colore: <span className="font-medium">{palettes.find((p) => p.id === palette)?.label}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <ul className="flex flex-col gap-6 w-full">
            <li className="flex flex-row items-center gap-2 w-full justify-between">
              <Link target="_blank" className="hover:text-primary" href="https://www.parkito.app/privacy-policy">Privacy Policy</Link>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary " />
            </li>
            <li className="flex flex-row items-center gap-2 w-full justify-between">
              <Link target="_blank" className="hover:text-primary" href="https://www.parkito.app/terminiecondizioni">Termini e condizioni</Link>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary " />
            </li>
            <li className="flex flex-row items-center gap-2 w-full justify-between">
              <Link target="_blank" className="hover:text-primary" href="https://www.parkito.app/#2-cancellazioni-problemi-di-prenotazione-rimborsi-e-modifiche-alle-prenotazioni">Politiche di rimborso</Link>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary " />
            </li>
            <li className="flex flex-row items-center gap-2 w-full justify-between ">
              <Link target="_blank" className="hover:text-primary" href="">Reimposta password</Link>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary " />
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}