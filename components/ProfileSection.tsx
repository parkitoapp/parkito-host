"use client"

import { useRef, useState } from "react"
import { CreditCard, IdCard, Mail, Phone, Edit } from "lucide-react"
import { NeonAvatar } from "./NeonAvatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "./ui/field"
import ImmutableFieldTooltip from "./ImmutableToolTip"
import { DriverData, HostData } from "@/types"
import { toast } from "sonner"

export default function ProfileSection({ user, host }: { user: DriverData, host: HostData }) {
  const [mode, setMode] = useState<"view" | "edit">("view")
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [phone, setPhone] = useState(user.phone ?? "")
  const [iban, setIban] = useState(host?.iban ?? "")
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)


  const displayName =
    [user.name, user.surname]
      .filter(Boolean)
      .join(" ") || "Utente Parkito"
  const initials =
    [user.name, user.surname]
      .filter(Boolean)
      .map((n) => n?.[0])
      .join("") || "PK"

  async function handleSave() {
    try {
      setSaving(true)

      const body = {
        phone: phone || null,
        // Only send IBAN if it actually changed; otherwise let API skip edge call
        iban: iban !== (host?.iban ?? "") ? (iban || null) : null,
      }

      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        toast.error("Failed to update profile: " + (await res.text()))
        return
      }

      setMode("view")
      toast.success("Profile updated successfully")
    } finally {
      setSaving(false)
    }
  }

  if (mode === "view") {
    return (
      <Card className="flex flex-col items-center justify-between w-full max-w-5xl mx-auto">

        <div className="flex flex-row items-center gap-4 w-full px-4 py-3">
          <CardHeader className="flex flex-row items-center justify-center min-w-[96px]">
            <NeonAvatar
              seed={user.id}
              src={previewImage ?? user.image}
              alt={displayName}
              initials={initials}
              className="size-20"
              fallbackClassName="text-2xl w-full size-full"
            />
          </CardHeader>
          <CardContent className="w-full flex flex-col gap-1 items-start justify-center">
            <CardTitle className="w-full text-lg">{displayName}</CardTitle>
            <CardDescription className="flex items-center gap-2 text-md w-full">
              <Mail className="size-4" /> {user.email}
            </CardDescription>
            <CardDescription className="flex items-center gap-2 text-md w-full">
              <Phone className="size-4" /> {user.phone ?? "Telefono non impostato"}
            </CardDescription>
            <CardDescription className="flex items-center gap-2 text-md w-full">
              <CreditCard className="size-4" /> {host?.iban ?? "IBAN non impostato"}
            </CardDescription>
            <CardDescription className="flex items-center gap-2 text-md w-full">
              <IdCard className="size-4" /> {user.TIN ?? "Codice Fiscale non impostato"}
            </CardDescription>
          </CardContent>
          <CardFooter className="pr-4">
            <Button variant="outline" size="sm" onClick={() => setMode("edit")}>
              Modifica profilo
            </Button>
          </CardFooter>
        </div>
        <p className="text-md text-muted-foreground">Host Parkito dal: {new Date(user.created_at ?? "").toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" })}</p>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <NeonAvatar
              seed={user.id}
              src={previewImage ?? user.image}
              alt={displayName}
              initials={initials}
              className="size-16"
              fallbackClassName="text-xl w-full size-full"
            />
            <Button
              type="button"
              size="icon-lg"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-2 size-8 rounded-full"
              aria-label="Cambia immagine profilo"
            >
              <Edit className="size-4" />
            </Button>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) return
                const url = URL.createObjectURL(file)
                setPreviewImage(url)
              }}
            />
          </div>
          <div className="flex flex-col">
            <CardTitle className="text-base">Modifica profilo</CardTitle>
            <CardDescription className="text-md">
              Aggiorna i tuoi dati personali e di fatturazione.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pb-6">
        <FieldSet>
          <FieldLegend>Dati personali</FieldLegend>
          <FieldGroup>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel className="flex items-center">
                  Nome
                  <ImmutableFieldTooltip fieldLabel="Nome" />
                </FieldLabel>
                <FieldContent>
                  <Input defaultValue={user.name ?? ""} disabled readOnly />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel className="flex items-center">
                  Cognome
                  <ImmutableFieldTooltip fieldLabel="Cognome" />
                </FieldLabel>
                <FieldContent>
                  <Input defaultValue={user.surname ?? ""} disabled readOnly />
                </FieldContent>
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Telefono</FieldLabel>
                <FieldContent>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+39 333 123 4567"
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel className="flex items-center">
                  Codice Fiscale / TIN
                  <ImmutableFieldTooltip fieldLabel="Codice Fiscale / TIN" />
                </FieldLabel>
                <FieldContent>
                  <Input
                    defaultValue={user.TIN}
                    placeholder="ABCDEF12G34H567I"
                    disabled
                    readOnly
                  />
                </FieldContent>
              </Field>
            </div>
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Dati pagamento</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel>IBAN</FieldLabel>
              <FieldContent>
                <Input
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  placeholder="IT00 A000 0000 0000 0000 0000 000"
                />
              </FieldContent>
            </Field>
          </FieldGroup>
        </FieldSet>
      </CardContent>
      <CardFooter className="flex justify-end">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode("view")}
          >
            Annulla
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            Salva
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
