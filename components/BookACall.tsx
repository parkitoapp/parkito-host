import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { ExternalLink, Headset, XIcon } from "lucide-react"
import Link from "next/link"

export default function AlertDialogSmallWithMedia() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="default">Suggerimenti sui prezzi</Button>
      </AlertDialogTrigger>

      <AlertDialogContent size="sm" className="flex flex-col">
        <AlertDialogCancel variant="outline" size={"icon"} className="self-end">
          <XIcon />
        </AlertDialogCancel>

        <AlertDialogHeader>
          <AlertDialogMedia>
            <Headset />
          </AlertDialogMedia>
          <AlertDialogTitle>Non sai che prezzo scegliere?</AlertDialogTitle>
          <AlertDialogDescription>
            Non ti preoccupare, ti aiutiamo noi!
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-1">
          <AlertDialogAction className="w-full" asChild>
            <Link href="">
              <ExternalLink />
              Contatta l&apos;esperto
            </Link>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
