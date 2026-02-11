 "use client"

 import { useMemo, useState } from "react"
 import type { Parking } from "@/types"

 export type VehicleId = 1 | 2 | 3 | 4 | 5 | 6

 /**
  * View/edit state used by the Parking Info page.
  * Wraps the persisted `Parking` model with UI-only metadata.
  */
 export interface ParkingInfoState extends Parking {
   /**
    * Maximum vehicle type accepted for this parking, used for
    * vehicle picker and dimension validation.
    */
   maxVehicleId: VehicleId
   /**
    * Optional last updated iso timestamp – purely client-side for now.
    */
   lastUpdatedAt?: string
 }

 export interface UseParkingDraftResult {
   savedParkingInfo: ParkingInfoState
   draftParkingInfo: ParkingInfoState
   setDraftParkingInfo: React.Dispatch<React.SetStateAction<ParkingInfoState>>
   updateDraft: (patch: Partial<ParkingInfoState>) => void
   resetDraft: () => void
   commitDraft: () => void
   hasChanges: boolean
   lastUpdated: Date | null
 }

 function isEqualParkingInfo(a: ParkingInfoState, b: ParkingInfoState): boolean {
   // For this UI we can rely on a shallow JSON comparison.
   // If this becomes too large, replace with a smarter deep compare.
   return JSON.stringify(a) === JSON.stringify(b)
 }

 /**
  * Manages strict separation between saved parking info and an editable draft.
  *
  * - Never mutates saved state directly.
  * - Draft is a deep clone at the moment Edit Mode starts.
  * - `commitDraft` promotes the draft to saved state.
  */
 export function useParkingDraft(initial: ParkingInfoState): UseParkingDraftResult {
   const [savedParkingInfo, setSavedParkingInfo] = useState<ParkingInfoState>(initial)
   const [draftParkingInfo, setDraftParkingInfo] = useState<ParkingInfoState>(initial)
   const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

   const hasChanges = useMemo(
     () => !isEqualParkingInfo(savedParkingInfo, draftParkingInfo),
     [savedParkingInfo, draftParkingInfo]
   )

   const updateDraft = (patch: Partial<ParkingInfoState>) => {
     setDraftParkingInfo((prev) => ({
       ...prev,
       ...patch,
       dimensions: {
         ...prev.dimensions,
         ...(patch.dimensions ?? {}),
       },
       perks: patch.perks ?? prev.perks,
     }))
   }

   const resetDraft = () => {
     setDraftParkingInfo(structuredClone(savedParkingInfo))
   }

   const commitDraft = () => {
     setSavedParkingInfo((prev) => {
       const next = structuredClone(draftParkingInfo)
       setLastUpdated(new Date())
       return next
     })
   }

   return {
     savedParkingInfo,
     draftParkingInfo,
     setDraftParkingInfo,
     updateDraft,
     resetDraft,
     commitDraft,
     hasChanges,
     lastUpdated,
   }
 }

