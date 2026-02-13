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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL

function resolveAvatarSrc(src?: string | null) {
  if (!src) return ""

  // If it's already an absolute URL or data URI, use as-is
  if (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:")
  ) {
    return src
  }

  // Treat as path inside public "uploads" bucket in Supabase Storage
  if (SUPABASE_URL) {
    return `${SUPABASE_URL}/storage/v1/object/public/uploads/${src}`
  }

  // Fallback: return original string
  return src
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
  const resolvedSrc = resolveAvatarSrc(src)

  return (
    <div className="flex items-center justify-center">
      <Avatar className={cn("size-8 border", neon?.border, className)}>
        <AvatarImage
          src={resolvedSrc}
          alt={alt ?? initials}
          className={cn("object-cover", imageClassName)}
        />
        <AvatarFallback className={cn(neon?.avatar, fallbackClassName)}>
          {initials}
        </AvatarFallback>
      </Avatar>
    </div>
  )
}
