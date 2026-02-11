"use client"


import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { useUser } from '@/providers/user-provider'
import { NeonAvatar } from './NeonAvatar'
import { Mail, Phone } from 'lucide-react'


export default function ProfileSection() {
  const [mode, setMode] = useState<"view" | "edit">("view")
  // const [isSaving, setIsSaving] = useState(false)
  const { user } = useUser()
  if (!user) return null

  console.log(user)

  const displayName = [user.user_metadata.name, user.user_metadata.surname].filter(Boolean).join(" ") || "Utente Parkito"
  const initials = [user.user_metadata.name, user.user_metadata.surname].filter(Boolean).map(n => n?.[0]).join("") || "PK"


  return (
    mode === "view" ? <Card className='flex flex-row items-center justify-evenly w-[60%] mx-auto'>
      <div className='flex flex-row items-center justify-center gap-4 w-full'>
        <CardHeader className='flex flex-row min-w-[40%] md:min-w-[15%]'>
          <NeonAvatar
            seed={user.id}
            src={user.user_metadata.avatar_url}
            alt={displayName}
            initials={initials}
            className='size-24'
            fallbackClassName='text-2xl w-full size-full'
          />
        </CardHeader>
        <CardContent className="w-full flex flex-col gap-2 items-center justify-start">
          <CardTitle className='w-full'>{displayName}</CardTitle>
          <CardDescription className="flex items-center gap-2 text-md w-full"><Mail className="size-4" /> {user.email}</CardDescription>
          <CardDescription className="flex items-center gap-2 text-md w-full"><Phone className="size-4" /> {user.user_metadata.phone}</CardDescription>
        </CardContent>
      </div>
      <CardFooter className='justify-end'>
        <Button variant="outline" onClick={() => setMode("edit")}>Modifica</Button>
      </CardFooter>

    </Card>
      : <Card className='flex flex-row items-center justify-between w-[80%] mx-auto'>
        <CardHeader>

        </CardHeader>
        <CardContent>
          <CardTitle>Dati personali</CardTitle>
        </CardContent>
      </Card>
  )
}