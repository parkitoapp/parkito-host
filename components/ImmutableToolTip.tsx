import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"
import { Lock } from "lucide-react"

export default function ImmutableFieldTooltip({ fieldLabel }: { fieldLabel: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="ml-1 inline-flex size-3.5 items-center justify-center rounded-full border border-muted-foreground/40 text-muted-foreground hover:bg-muted/40"
        >
          <Lock className="size-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px] text-[11px] leading-snug text-left">
        Per motivi di sicurezza il campo <span className="font-semibold">{fieldLabel}</span> viene impostato una sola volta
        e non può essere modificato direttamente dall&apos;app.
      </TooltipContent>
    </Tooltip>
  )
}