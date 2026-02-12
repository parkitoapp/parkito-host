"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "./ui/button"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { Spinner } from "./ui/spinner"
import { useSelectedParking } from "@/providers/selected-parking-provider"
import { useUploadFiles } from "@better-upload/client"
import { GalleryFieldCard } from "./GalleryFieldCard"

type FieldKey =
  | "parkingSpotPhoto"
  | "video_access"
  | "streetPhoto"
  | "exitVideo"
  | "pedestrianExitVideo"

type FieldType = "image" | "video"

type FieldConfig = {
  key: FieldKey
  label: string
  type: FieldType
  required?: boolean
}

const FIELD_CONFIGS: FieldConfig[] = [
  {
    key: "parkingSpotPhoto",
    label: "Immagine 1 (copertina)",
    type: "image",
    required: true,
  },
  {
    key: "video_access",
    label: "Video accesso",
    type: "video",
    required: true,
  },
  {
    key: "streetPhoto",
    label: "Foto dalla strada",
    type: "image",
  },
  {
    key: "exitVideo",
    label: "Video uscita veicolo",
    type: "video",
  },
  {
    key: "pedestrianExitVideo",
    label: "Video uscita pedonale",
    type: "video",
  },
]

type MediaState = Partial<Record<FieldKey, string | null>>

const initialMedia: MediaState = {
  parkingSpotPhoto: null,
  video_access: null,
  streetPhoto: null,
  exitVideo: null,
  pedestrianExitVideo: null,
}

export default function GalleryClient() {
  const { selectedParkingId } = useSelectedParking()
  const [media, setMedia] = useState<MediaState>(initialMedia)
  const [isLoading, setIsLoading] = useState(false)
  const [pendingField, setPendingField] = useState<FieldKey | null>(null)
  const [pendingFiles, setPendingFiles] = useState<Partial<Record<FieldKey, File>>>({})
  const [pendingPreviews, setPendingPreviews] = useState<Partial<Record<FieldKey, string>>>({})
  const [isSaving, setIsSaving] = useState(false)
  const { control } = useUploadFiles({ route: "images" }) // route is unused, we override upload

  // Load current media from the server/bucket
  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!selectedParkingId) {
        setMedia(initialMedia)
        return
      }

      try {
        setIsLoading(true)
        const res = await fetch(`/api/gallery?parkingId=${encodeURIComponent(String(selectedParkingId))}`)

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? "Errore nel caricamento della galleria")
        }

        const data = (await res.json()) as { media?: Partial<Record<FieldKey, string>> }
        if (!cancelled) {
          setMedia({
            ...initialMedia,
            ...(data.media ?? {}),
          })
        }
      } catch (err) {
        if (cancelled) return
        const message =
          err instanceof Error ? err.message : "Errore nel caricamento della galleria"
        console.error("[Gallery] load error:", err)
        toast.error(message)
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [selectedParkingId])

  const handleSelectForField = (field: FieldKey, files: File[]) => {
    if (!selectedParkingId || files.length === 0) return

    const file = files[0]

    setPendingFiles((prev) => ({
      ...prev,
      [field]: file,
    }))

    const objectUrl = URL.createObjectURL(file)
    setPendingPreviews((prev) => {
      const previous = prev[field]
      if (previous) {
        URL.revokeObjectURL(previous)
      }
      return {
        ...prev,
        [field]: objectUrl,
      }
    })

    // Close the dropzone once a file has been chosen
    setPendingField(null)
  }

  const hasPendingChanges = Object.keys(pendingFiles).length > 0

  const handleSave = async () => {
    if (!selectedParkingId || !hasPendingChanges || isSaving) return

    setIsSaving(true)
    const entries = Object.entries(pendingFiles) as [FieldKey, File][]
    const updated: Partial<Record<FieldKey, string>> = {}
    const failed: FieldKey[] = []

    try {
      await Promise.all(
        entries.map(async ([field, file]) => {
          try {
            const formData = new FormData()
            formData.append("file", file)
            formData.append("parkingId", String(selectedParkingId))
            formData.append("field", field)

            const res = await fetch("/api/gallery", {
              method: "POST",
              body: formData,
            })

            const data = await res.json().catch(() => ({}))

            if (!res.ok) {
              const message =
                (data && (data.error as string)) ||
                "Errore durante il caricamento del media"
              console.error("[Gallery] upload error:", message)
              failed.push(field)
              return
            }

            const url = data.url as string | undefined
            if (!url) {
              console.error("[Gallery] upload error: URL mancante dalla risposta del server")
              failed.push(field)
              return
            }

            updated[field] = url
          } catch (err) {
            console.error("[Gallery] upload error:", err)
            failed.push(field)
          }
        }),
      )

      if (Object.keys(updated).length > 0) {
        setMedia((prev) => ({
          ...prev,
          ...updated,
        }))

        // Clear pending state for successfully updated fields
        setPendingFiles((prev) => {
          const next = { ...prev }
          for (const field of Object.keys(updated) as FieldKey[]) {
            delete next[field]
          }
          return next
        })

        setPendingPreviews((prev) => {
          const next = { ...prev }
          for (const field of Object.keys(updated) as FieldKey[]) {
            const url = next[field]
            if (url) URL.revokeObjectURL(url)
            delete next[field]
          }
          return next
        })
      }

      if (failed.length > 0) {
        const labels = FIELD_CONFIGS.filter((f) => failed.includes(f.key)).map(
          (f) => f.label,
        )
        toast.error(
          `Alcuni media non sono stati salvati correttamente: ${labels.join(
            ", ",
          )}`,
        )
      } else if (Object.keys(updated).length > 0) {
        toast.success("Media salvati con successo.")
      }
    } finally {
      setIsSaving(false)
      setPendingField(null)
    }
  }

  if (!selectedParkingId) {
    return (
      <div className="flex flex-1 items-center justify-center py-10">
        <Alert className="max-w-md">
          <AlertTitle className="text-sm font-semibold">Nessun parcheggio selezionato</AlertTitle>
          <AlertDescription className="text-sm text-muted-foreground">
            Seleziona un parcheggio dal menu laterale per gestire la galleria media.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const renderCard = (field: FieldConfig, large = false) => {
    const previewUrl = pendingPreviews[field.key] ?? null
    const url = previewUrl ?? media[field.key] ?? null

    return (
      <div className={large ? "w-[70%]" : "w-full"}>
        <GalleryFieldCard
          label={field.label}
          required={field.required}
          type={field.type}
          isLoading={isLoading}
          isEditing={pendingField === field.key}
          url={url}
          uploadControl={control}
          onToggleEdit={() =>
            setPendingField((current) =>
              current === field.key ? null : field.key,
            )
          }
          onFilesSelected={(files) => handleSelectForField(field.key, files)}
        />
      </div>
    )
  }

  const coverField = FIELD_CONFIGS[0]
  const otherFields = FIELD_CONFIGS.slice(1)

  return (
    <div className="mb-20 flex min-h-full w-full flex-col items-center justify-center gap-16">

      <div className="mx-auto flex w-[70%] justify-end">
        <Button
          type="button"
          onClick={handleSave}
          disabled={!hasPendingChanges || isSaving}
        >
          {isSaving ? <Spinner className="mr-2 h-4 w-4" /> : null}
          {isSaving ? "Salvataggio..." : "Salva media"}
        </Button>
      </div>
      {/* Cover image (parkingSpotPhoto) */}
      <div className="mx-auto flex w-full items-center justify-center flex-col gap-4">
        {renderCard(coverField, true)}
      </div>

      {/* Other media fields in existing 2x2 layout */}
      <div className="mx-auto flex w-[70%] flex-row gap-4">
        <div className="flex w-full flex-col gap-4">
          {renderCard(otherFields[0])}
        </div>
        <div className="flex w-full flex-col gap-4">
          {renderCard(otherFields[1])}
        </div>
      </div>

      <div className="mx-auto flex w-[70%] flex-row gap-4">
        <div className="flex w-full flex-col gap-4">
          {renderCard(otherFields[2])}
        </div>
        <div className="flex w-full flex-col gap-4">
          {renderCard(otherFields[3])}
        </div>
      </div>
    </div>
  )
}