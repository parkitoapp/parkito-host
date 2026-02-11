/**
 * Error component to display error messages.
 * 
 * @param {ErrorType} props - The properties including title, message, and optional onClick handler.
 * @returns {JSX.Element} The rendered Error component.
 */

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowLeftIcon } from "lucide-react";
import { ErrorType } from "@/types";
import { Button } from "./ui/button";
import Link from "next/link";

export default function Error({ title, message, onClick, src }: ErrorType) {
  return (
    <Alert variant="destructive" className="min-w-[50%] max-w-5xl mx-auto my-8 flex flex-col">
      <AlertTitle className="flex items-center justify-center text-xl">
        <AlertCircle className="mr-2" /> Error: {title}
      </AlertTitle>
      <AlertDescription className="text-lg">{message}</AlertDescription>
      {onClick && <Button variant="destructive" className="mt-4 p-4 w-10" onClick={onClick}>Retry</Button>}
      {src && <Button variant="destructive" className="mt-4 p-4 w-full mx-auto" asChild>
        <Link href={src}><ArrowLeftIcon className="inline" /> Torna indietro</Link>
      </Button>}
    </Alert>
  )
}