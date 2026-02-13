"use client"

import Image from "next/image"
import { Edit, Play } from "lucide-react"

import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Label } from "./ui/label"
import { Spinner } from "./ui/spinner"
import { UploadDropzone } from "./ui/upload-dropzone"
import type { UploadHookControl } from "@better-upload/client"

type FieldType = "image" | "video"

export type GalleryFieldCardProps = {
  label: string
  required?: boolean
  type: FieldType
  isLoading: boolean
  isEditing: boolean
  url: string | null
  onToggleEdit: () => void
  onFilesSelected: (files: File[]) => void
  uploadControl: UploadHookControl<true>
}

export function GalleryFieldCard({
  label,
  required,
  type,
  isLoading,
  isEditing,
  url,
  onToggleEdit,
  onFilesSelected,
  uploadControl,
}: GalleryFieldCardProps) {
  const isVideo = type === "video"

  return (
    <div className="flex w-full flex-col gap-4">
      <Label className="text-lg font-semibold">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      <Card className="overflow-hidden py-0">
        <CardContent className="relative flex h-full items-center justify-center p-0">
          {isLoading ? (
            <div className="flex h-80 w-full items-center justify-center">
              <Spinner className="mr-2 h-5 w-5" />
              <span className="text-sm text-muted-foreground">
                Caricamento galleria...
              </span>
            </div>
          ) : isEditing ? (
            <div className="flex h-80 w-full items-center justify-center p-4">
              <UploadDropzone
                control={uploadControl}
                accept={
                  isVideo
                    ? "video/mp4,video/quicktime,video/mov"
                    : "image/jpeg,image/png,image/webp,image/jpg"
                }
                description={{
                  maxFiles: 1,
                  fileTypes: isVideo
                    ? "MP4, MOV, QuickTime"
                    : "JPEG, PNG, JPG, WEBP",
                }}
                uploadOverride={(files) => {
                  const list = Array.from(files as unknown as File[])
                  onFilesSelected(list)
                }}
              />
            </div>
          ) : url ? (
            <div className="relative h-80 w-full">
              {isVideo ? (
                <video
                  src={url}
                  className="h-full w-full object-cover"
                  controls
                />
              ) : (
                <Image
                  src={url}
                  alt={label}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              )}
              {isVideo && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
                  <Play className="h-10 w-10 text-white" />
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-80 w-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
              Nessun media caricato
            </div>
          )}

          <div className="absolute bottom-4 right-4 flex flex-row items-center justify-end gap-2">
            <Button
              aria-label="Modifica media"
              variant="secondary"
              size="icon"
              onClick={onToggleEdit}
            >
              <Edit className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

