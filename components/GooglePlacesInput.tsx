"use client"

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

const AUTOCOMPLETE_API = "/api/places/autocomplete"
const DETAILS_API = "/api/places/details"

export interface AddressComponents {
  street: string
  streetNumber: string
  city: string
  province: string
  region: string
  country: string
  postalCode: string
  lat: number
  lng: number
}

export interface GooglePlacesInputProps {
  selectedAddress?: string
  setSelectedAddress?: (value: string) => void
  setCoordinates?: (coords: { lat: number; lng: number }) => void
  setFullAddressDetails?: (details: AddressComponents) => void
  placeholder?: string
  onAddressSelected?: (address: string, coords: { lat: number; lng: number }) => void
  id?: string
  destructive?: boolean
  onFocus?: () => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  autoComplete?: string
  className?: string
  inputClassName?: string
}

function generateSessionToken(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function getComponentText(
  c: { long_name?: string; longText?: string; name?: string; types: string[] }
): string {
  return c.long_name ?? c.longText ?? c.name ?? ""
}

function extractFromFormattedAddress(
  formatted: string
): { city: string; postalCode: string } {
  const result = { city: "", postalCode: "" }
  const capMatch = formatted.match(/\b(\d{5})\b/)
  if (capMatch) result.postalCode = capMatch[1]
  const parts = formatted.split(",").map((p) => p.trim())
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i]
    if (/^\d{5}\s/.test(part)) {
      const afterCap = part.replace(/^\d{5}\s*/, "").trim()
      const cityPart = afterCap.split(/\s+[A-Z]{2}\b/)[0]?.trim()
      if (cityPart && !result.city) result.city = cityPart
      break
    }
    if (!/^(Italy|Italia|IT)$/i.test(part) && part.length > 2 && !result.city) {
      result.city = part.replace(/\s+[A-Z]{2}$/, "").trim()
      break
    }
  }
  return result
}

function extractAddressComponents(
  addressComponents: Array<{
    long_name?: string
    longText?: string
    name?: string
    types: string[]
  }>,
  lat: number,
  lng: number,
  formattedAddress?: string
): AddressComponents {
  const components: AddressComponents = {
    street: "",
    streetNumber: "",
    city: "",
    province: "",
    region: "",
    country: "",
    postalCode: "",
    lat,
    lng,
  }

  addressComponents.forEach((component) => {
    const text = getComponentText(component)
    if (component.types.includes("route")) components.street = text
    if (component.types.includes("street_number"))
      components.streetNumber = text
    if (component.types.includes("locality")) components.city = text
    if (component.types.includes("administrative_area_level_2"))
      components.province = text
    if (component.types.includes("administrative_area_level_1"))
      components.region = text
    if (component.types.includes("country")) components.country = text
    if (component.types.includes("postal_code")) components.postalCode = text
  })

  if (!components.city && components.province) components.city = components.province

  if (formattedAddress) {
    const fallback = extractFromFormattedAddress(formattedAddress)
    if (!components.city && fallback.city) components.city = fallback.city
    if (!components.postalCode && fallback.postalCode)
      components.postalCode = fallback.postalCode
  }

  return components
}

export function GooglePlacesInput({
  selectedAddress,
  setSelectedAddress,
  setCoordinates,
  setFullAddressDetails,
  placeholder = "Cerca indirizzo...",
  onAddressSelected,
  id = "google-places-input",
  destructive,
  onFocus,
  onBlur,
  autoComplete = "off",
  className,
  inputClassName,
}: GooglePlacesInputProps) {
  const sessionTokenRef = useRef(generateSessionToken())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSelectingRef = useRef(false)
  const selectedQueryRef = useRef("")
  const hasUserTypedRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState(selectedAddress ?? "")
  const [predictions, setPredictions] = useState<
    Array<{ place_id: string; description: string }>
  >([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    if (
      !isSelectingRef.current &&
      selectedAddress !== undefined &&
      selectedAddress !== selectedQueryRef.current
    ) {
      setQuery(selectedAddress)
      selectedQueryRef.current = selectedAddress
    }
  }, [selectedAddress])

  const fetchPredictions = useCallback(async (inputText: string) => {
    try {
      setLoading(true)
      const url = `${AUTOCOMPLETE_API}?input=${encodeURIComponent(
        inputText
      )}&sessiontoken=${encodeURIComponent(sessionTokenRef.current)}`

      const response = await fetch(url)
      const json = await response.json()

      if (response.ok && json.suggestions) {
        const items = (json.suggestions as Array<{ placePrediction?: { placeId: string; text?: { text: string } } }>)
          .filter((s) => s.placePrediction)
          .map((s) => ({
            place_id: s.placePrediction!.placeId,
            description:
              s.placePrediction!.text?.text ?? s.placePrediction!.placeId,
          }))
        setPredictions(items)
      } else {
        const errMsg = json.error?.message ?? json.error ?? json.status
        console.warn("[GooglePlacesInput] Autocomplete error:", errMsg)
        setPredictions([])
      }
    } catch (error) {
      console.warn("Places autocomplete fetch error:", error)
      setPredictions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isSelectingRef.current) return
    if (!showSuggestions) return
    if (!hasUserTypedRef.current) return

    if (!query || query.trim().length < 3) {
      setPredictions([])
      setLoading(false)
      return
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      if (!isSelectingRef.current) {
        fetchPredictions(query)
      }
    }, 400)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, fetchPredictions, showSuggestions])

  const handleSelectPrediction = useCallback(
    async (prediction: { place_id: string; description: string }) => {
      isSelectingRef.current = true
      const selectedDescription = prediction.description
      selectedQueryRef.current = selectedDescription

      setPredictions([])
      setShowSuggestions(false)
      setQuery(selectedDescription)
      setSelectedAddress?.(selectedDescription)

      try {
        setLoading(true)
        const url = `${DETAILS_API}?place_id=${encodeURIComponent(
          prediction.place_id
        )}&sessiontoken=${encodeURIComponent(sessionTokenRef.current)}`

        const response = await fetch(url)
        const json = await response.json()

        if (response.ok && json.location) {
          const lat = json.location.latitude ?? json.location.lat
          const lng = json.location.longitude ?? json.location.lng
          const addressData = extractAddressComponents(
            json.addressComponents ?? json.address_components ?? [],
            lat,
            lng,
            json.formattedAddress ?? json.formatted_address
          )

          console.log("[GooglePlacesInput] Selected place coords", { lat, lng })
          setCoordinates?.({ lat, lng })
          setFullAddressDetails?.(addressData)
          onAddressSelected?.(selectedDescription, { lat, lng })
          sessionTokenRef.current = generateSessionToken()
        } else {
          console.warn(
            "Place details error:",
            json.error?.message ?? json.error ?? json.status
          )
        }
      } catch (error) {
        console.warn("Place details fetch error:", error)
      } finally {
        setLoading(false)
        setTimeout(() => {
          isSelectingRef.current = false
        }, 1000)
      }
    },
    [
      setSelectedAddress,
      setCoordinates,
      setFullAddressDetails,
      onAddressSelected,
    ]
  )

  const showList = predictions.length > 0

  useLayoutEffect(() => {
    if (showList && containerRef.current) {
      // force a reflow so the browser knows the size; no-op otherwise
      containerRef.current.getBoundingClientRect()
    }
  }, [showList, predictions])

  return (
    <div ref={containerRef} className={cn("relative overflow-visible", className)}>
      <div className="relative">
        <MapPin
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary"
          aria-hidden
        />
        <Input
          id={id}
          type="text"
          placeholder={placeholder}
          value={query}
          autoComplete={autoComplete}
          data-destructive={destructive}
          className={cn("pl-9 pr-10", inputClassName)}
          onFocus={() => {
            if (!isSelectingRef.current && hasUserTypedRef.current && predictions.length > 0) {
              setShowSuggestions(true)
            }
            onFocus?.()
          }}
          onBlur={(e) => {
            setTimeout(() => {
              if (!isSelectingRef.current) {
                setShowSuggestions(false)
                setPredictions([])
                setSelectedAddress?.(query)
                onBlur?.(e)
              }
            }, 200)
          }}
          onChange={(e) => {
            isSelectingRef.current = false
            selectedQueryRef.current = ""
            const text = e.target.value
            setQuery(text)
            hasUserTypedRef.current = true
            if (text && text.trim().length >= 3) {
              setShowSuggestions(true)
            } else {
              setShowSuggestions(false)
              setPredictions([])
            }
          }}
        />
        {loading && (
          <Spinner
            className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-primary"
            aria-hidden
          />
        )}
      </div>

      {showList && predictions.length > 0 && (
        <ul
          className="absolute z-50 mt-1 max-h-40 w-full min-w-[200px] overflow-auto rounded-lg border border-border bg-popover py-1 shadow-lg"
          role="listbox"
          aria-label="Suggerimenti indirizzo"
          onMouseDown={(e) => {
            e.preventDefault()
            isSelectingRef.current = true
          }}
        >
          {predictions.map((item) => (
            <li
              key={item.place_id}
              role="option"
              aria-selected={false}
              className="border-b border-border last:border-b-0"
            >
              <button
                type="button"
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                onMouseDown={() => {
                  isSelectingRef.current = true
                }}
                onClick={() => handleSelectPrediction(item)}
              >
                <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
                <span className="flex-1 truncate">{item.description}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default GooglePlacesInput
