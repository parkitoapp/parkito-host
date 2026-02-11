"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { getNeonAvatarClasses } from "@/lib/bookings-table-utils"
import { cn } from "@/lib/utils"

type NeonAvatarProps = {
  seed?: string | null
  initials: string
  src?: string | null
  alt?: string
  className?: string
  imageClassName?: string
  fallbackClassName?: string
}

export function NeonAvatar({
  seed,
  initials,
  src,
  alt,
  className,
  imageClassName,
  fallbackClassName,
}: NeonAvatarProps) {
  const neon = seed ? getNeonAvatarClasses(seed) : undefined

  return (
    <div className="flex items-center justify-center">
      <Avatar className={cn("size-8 border", neon?.border, className)}>
        <AvatarImage
          src={src || ""}
          alt={alt ?? initials}
          className={imageClassName}
        />
        <AvatarFallback className={cn(neon?.avatar, fallbackClassName)}>
          {initials}
        </AvatarFallback>
      </Avatar>
    </div>
  )
}
