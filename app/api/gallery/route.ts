import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

type FieldKey =
  | "parkingSpotPhoto"
  | "video_access"
  | "streetPhoto"
  | "exitVideo"
  | "devicePhoto"
  | "pedestrianExitVideo"

type FieldConfig = {
  customName: string
  isImage: boolean
  inImagesFolder: boolean
}

const FIELD_CONFIGS: Record<FieldKey, FieldConfig> = {
  // Copertina -> entry, goes in /images folder
  parkingSpotPhoto: { customName: "entry", isImage: true, inImagesFolder: true },
  // Entry video
  video_access: { customName: "video_access", isImage: false, inImagesFolder: false },
  // Foto dalla strada -> parking (root)
  streetPhoto: { customName: "parking", isImage: true, inImagesFolder: false },
  // Video uscita veicolo
  exitVideo: { customName: "video_exit", isImage: false, inImagesFolder: false },
  // Foto dispositivo
  devicePhoto: { customName: "device_photo", isImage: true, inImagesFolder: false },
  // Uscita pedonale
  pedestrianExitVideo: { customName: "pedestrian_exit", isImage: false, inImagesFolder: false },
}

const LEGACY_FILE_NAMES: Partial<Record<FieldKey, string[]>> = {
  parkingSpotPhoto: ["parking_spot_photo"],
  streetPhoto: ["street_photo"],
  exitVideo: ["exit_video"],
  pedestrianExitVideo: ["pedestrian_exit_video"],
}

const IMAGE_EXTS = ["jpg", "jpeg", "png", "webp"]
const VIDEO_EXTS = ["mp4", "mov", "quicktime"]

function coerceParkingId(id: string): string | number {
  return /^\d+$/.test(id) ? parseInt(id, 10) : id
}

async function assertParkingOwnership(parkingIdRaw: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  // Find host row for this driver
  const { data: host, error: hostError } = await supabase
    .from("pkt_host")
    .select("id")
    .eq("driver_id", user.id)
    .maybeSingle()

  if (hostError || !host) {
    throw new NextResponse(JSON.stringify({ error: "Host non trovato" }), { status: 403 })
  }

  const idParam = coerceParkingId(parkingIdRaw)

  // Verify that parking belongs to this host
  const { data: parking, error: parkingError } = await supabase
    .from("pkt_parking")
    .select("id, host_id")
    .eq("id", idParam)
    .maybeSingle()

  if (parkingError || !parking) {
    throw new NextResponse(JSON.stringify({ error: "Parcheggio non trovato" }), {
      status: 404,
    })
  }

  if (String(parking.host_id) !== String(host.id)) {
    throw new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403 })
  }
}

function buildPath(parkingId: string, field: FieldKey, fileName: string): string {
  const cfg = FIELD_CONFIGS[field]
  const ext = fileName.includes(".") ? fileName.substring(fileName.lastIndexOf(".")) : ""
  const safeExt = ext || (cfg.isImage ? ".jpg" : ".mp4")
  const timestamp = Date.now()

  const folder = cfg.inImagesFolder
    ? `parking_media/parking_${parkingId}/images`
    : `parking_media/parking_${parkingId}`

  const baseName = cfg.customName
  return `${folder}/${baseName}_${timestamp}${safeExt}`
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const parkingId = searchParams.get("parkingId")

    if (!parkingId) {
      return NextResponse.json({ error: "Missing parkingId" }, { status: 400 })
    }

    await assertParkingOwnership(parkingId)

    const admin = getSupabaseAdmin()
    const bucket = admin.storage.from("uploads")

    const result: Partial<Record<FieldKey, string>> = {}

    // For each field, list the appropriate folder and pick the most recent matching file
    await Promise.all(
      (Object.keys(FIELD_CONFIGS) as FieldKey[]).map(async (field) => {
        const cfg = FIELD_CONFIGS[field]
        const folder = cfg.inImagesFolder
          ? `parking_media/parking_${parkingId}/images`
          : `parking_media/parking_${parkingId}`

        const exts = cfg.isImage ? IMAGE_EXTS : VIDEO_EXTS
        const baseNames = [cfg.customName, ...(LEGACY_FILE_NAMES[field] ?? [])]

        const { data: files, error } = await bucket.list(folder, { limit: 100 })
        if (error || !files) {
          if (error) {
            console.error(`[Gallery GET] Error listing folder for ${field}:`, error.message)
          }
          return
        }

        // Find all files that match customName or legacy names + allowed extensions
        const candidates = files.filter((f) => {
          return baseNames.some((base) =>
            exts.some((ext) => f.name === `${base}.${ext}` || f.name.startsWith(`${base}_`)),
          )
        })

        if (candidates.length === 0) return

        const latest = candidates
          .slice()
          .sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""))[candidates.length - 1]

        const { data } = bucket.getPublicUrl(`${folder}/${latest.name}`)
        if (data.publicUrl) {
          result[field] = data.publicUrl
        }
      }),
    )

    return NextResponse.json({ media: result })
  } catch (err) {
    if (err instanceof NextResponse) {
      return err
    }

    console.error("[API /api/gallery GET]", err)
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json(
      { error: "Failed to load gallery media", details: message },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const parkingId = formData.get("parkingId")
    const fieldRaw = formData.get("field")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File mancante o non valido" }, { status: 400 })
    }

    if (typeof parkingId !== "string" || !parkingId) {
      return NextResponse.json({ error: "parkingId mancante" }, { status: 400 })
    }

    if (typeof fieldRaw !== "string") {
      return NextResponse.json({ error: "field mancante" }, { status: 400 })
    }

    const field = fieldRaw as FieldKey
    if (!(field in FIELD_CONFIGS)) {
      return NextResponse.json({ error: "field non valido" }, { status: 400 })
    }

    const cfg = FIELD_CONFIGS[field]

    // Validate mime type according to field type
    if (cfg.isImage && !file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Questo campo accetta solo file immagine (jpeg, png, webp)." },
        { status: 400 },
      )
    }

    if (!cfg.isImage && !file.type.startsWith("video/")) {
      return NextResponse.json(
        { error: "Questo campo accetta solo file video (mp4, mov, quicktime)." },
        { status: 400 },
      )
    }

    await assertParkingOwnership(parkingId)

    const admin = getSupabaseAdmin()
    const bucket = admin.storage.from("uploads")

    const folder = cfg.inImagesFolder
      ? `parking_media/parking_${parkingId}/images`
      : `parking_media/parking_${parkingId}`

    const path = buildPath(parkingId, field, file.name)

    // Before uploading, remove any existing files for this field so we effectively "replace" it.
    const exts = cfg.isImage ? IMAGE_EXTS : VIDEO_EXTS
    const baseNames = [cfg.customName, ...(LEGACY_FILE_NAMES[field] ?? [])]

    const { data: existingFiles, error: listError } = await bucket.list(folder, { limit: 100 })
    if (!listError && existingFiles && existingFiles.length > 0) {
      const toRemove = existingFiles
        .filter((f) =>
          baseNames.some((base) =>
            exts.some(
              (ext) =>
                f.name === `${base}.${ext}` || f.name.startsWith(`${base}_`),
            ),
          ),
        )
        .map((f) => `${folder}/${f.name}`)

      if (toRemove.length > 0) {
        const { error: removeError } = await bucket.remove(toRemove)
        if (removeError) {
          console.error(
            `[API /api/gallery POST] Failed to remove old media for ${field}:`,
            removeError.message,
          )
        }
      }
    } else if (listError) {
      console.error(
        `[API /api/gallery POST] Error listing existing media for ${field}:`,
        listError.message,
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await bucket.upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    })

    if (uploadError) {
      console.error("[API /api/gallery POST] Upload error:", uploadError.message)
      return NextResponse.json(
        { error: "Errore durante il caricamento del file" },
        { status: 500 },
      )
    }

    const { data } = bucket.getPublicUrl(path)

    if (!data.publicUrl) {
      return NextResponse.json(
        { error: "Impossibile generare l'URL pubblico del media" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      url: data.publicUrl,
      path,
      field,
    })
  } catch (err) {
    if (err instanceof NextResponse) {
      return err
    }

    console.error("[API /api/gallery POST]", err)
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json(
      { error: "Errore durante il caricamento del media", details: message },
      { status: 500 },
    )
  }
}

