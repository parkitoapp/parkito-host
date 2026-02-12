"use client";

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
import { useRouter } from "next/navigation";

export default function Error({ title, message, onClick, src }: ErrorType) {
  const router = useRouter();

  const handleBack = () => {
    if (src) {
      router.push(src);
    } else {
      router.back();
    }
  };

  return (
    <Alert className="min-w-[50%] max-w-5xl mx-auto my-8 flex flex-col" variant="destructive">
      <AlertTitle className="flex items-center justify-center text-xl">
        <AlertCircle className="mr-2" /> Error: {title}
      </AlertTitle>
      <AlertDescription className="text-lg">{message}</AlertDescription>

      {onClick && (
        <Button
          className="mt-4 px-4 py-2 self-center"
          variant="destructive"
          onClick={onClick}
        >
          Retry
        </Button>
      )}

      <Button
        className="mt-4 px-4 py-2 w-full max-w-xs mx-auto gap-2"
        variant="outline"
        onClick={handleBack}
      >
        <ArrowLeftIcon className="inline-block" /> Torna indietro
      </Button>
    </Alert>
  );
}