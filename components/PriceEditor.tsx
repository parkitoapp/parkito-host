import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'
import { Button } from './ui/button'
import { CircleFadingPlusIcon, PencilIcon } from 'lucide-react'
import { ButtonGroup } from './ui/button-group'

export default function PriceEditor() {
  return (

    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className='flex flex-col w-1/2 mx-auto' size="lg">
          <div className='flex flex-row items-center justify-between w-full'>
            <span className="capitalize text-2xl">All&apos;ora</span>
            <PencilIcon className='size-6' />
          </div>

        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <CircleFadingPlusIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>Share this project?</AlertDialogTitle>
          <AlertDialogDescription>
            Anyone with the link will be able to view and edit this project.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Share</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}   