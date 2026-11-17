// Client-safe AI Photo Editor credit settings. Server-side balance logic lives in lib/ai/photo-credit-ledger.ts.
//
// Costs (Gemini API, Nov 2026): a standard edit is about $0.067 (~₹6), an HD edit about $0.134 (~₹12).
// Packs are priced above that per credit in every region; see PRICING_REGIONS in lib/pricing.ts.

import type { PhotoEditQuality } from "@/lib/photo-edit"

export type CreditPackKey = "PHOTO_10" | "PHOTO_30" | "PHOTO_70"

export type CreditPack = { key: CreditPackKey; credits: number; name: string; popular?: boolean }

export const CREDIT_PACKS: Record<CreditPackKey, CreditPack> = {
    PHOTO_10: { key: "PHOTO_10", credits: 10, name: "10 photo edits" },
    PHOTO_30: { key: "PHOTO_30", credits: 30, name: "30 photo edits", popular: true },
    PHOTO_70: { key: "PHOTO_70", credits: 70, name: "70 photo edits" },
}

export const CREDIT_PACK_KEYS = Object.keys(CREDIT_PACKS) as CreditPackKey[]

export function isCreditPackKey(value: unknown): value is CreditPackKey {
    return typeof value === "string" && value in CREDIT_PACKS
}

/** Purchased credits expire this many days after purchase. */
export const CREDIT_VALIDITY_DAYS = 365

/** Free edits included with an active Pro pass, refilled every 30 days. */
export const PRO_PHOTO_BONUS = 15
export const PRO_PHOTO_BONUS_DAYS = 30

/** Credits one edit costs. HD uses the pricier model at 2K. */
export const PHOTO_EDIT_COST: Record<PhotoEditQuality, number> = { standard: 1, hd: 2 }

export type PhotoCreditBalance = {
    /** Pro bonus edits left in the current 30-day window (0 when not Pro). */
    bonus: number
    /** When the bonus refills; null when not Pro or not used yet. */
    bonusResetAt: string | null
    /** Purchased credits left across all unexpired packs. */
    purchased: number
    total: number
}
