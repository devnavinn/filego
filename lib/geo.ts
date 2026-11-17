// Server-only: reads request headers.
import { headers } from "next/headers";

/**
 * The visitor's country (ISO 3166 alpha-2) from the hosting platform's geo-IP header.
 * Vercel sets `x-vercel-ip-country`; Cloudflare sets `cf-ipcountry`.
 *
 * Without a header (local dev, or a host that doesn't send one) this falls back to
 * PRICING_DEV_COUNTRY outside production, then to India, which matches Filego's original
 * INR-only pricing.
 */
export function countryFromHeaders(h: Headers): string {
    const header = h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry")
    // "XX" / "T1" are Cloudflare's unknown/Tor markers.
    if (header && /^[A-Z]{2}$/i.test(header) && !/^(XX|T1)$/i.test(header)) return header.toUpperCase()
    if (header) return "US"

    const devCountry = process.env.NODE_ENV !== "production" ? process.env.PRICING_DEV_COUNTRY : undefined
    if (devCountry && /^[A-Z]{2}$/i.test(devCountry)) return devCountry.toUpperCase()
    return "IN"
}

/** For Server Components; makes the page render per request. */
export async function getRequestCountry(): Promise<string> {
    return countryFromHeaders(await headers())
}
