"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteAvailabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleteJustThisOne: () => void;
  onDeleteAllFuture: () => void;
}

export function DeleteAvailabilityDialog({
  open,
  onOpenChange,
  onDeleteJustThisOne,
  onDeleteAllFuture,
}: DeleteAvailabilityDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-destructive/50">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">
            Elimina disponibilità
          </AlertDialogTitle>
          <AlertDialogDescription>
            Questa disponibilità si ripete. Vuoi eliminare solo questo giorno o tutte le date
            future?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annulla</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(e) => {
              e.preventDefault();
              onDeleteJustThisOne();
            }}
          >
            Solo questo giorno
          </AlertDialogAction>
          <AlertDialogAction
            variant="destructive"
            onClick={(e) => {
              e.preventDefault();
              onDeleteAllFuture();
            }}
          >
            Tutte le date future
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
