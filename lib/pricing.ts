// Client-safe, country-based Pro pricing. The server picks the region from the visitor's IP country
// (see lib/geo.ts); the browser never chooses its own price.

import type { PassKey } from "@/lib/plans";
import { CREDIT_PACKS, CREDIT_PACK_KEYS, type CreditPackKey } from "@/lib/photo-credits";

export type PricingRegionId = "IN" | "EU" | "GB" | "CA" | "AU" | "SG" | "AE" | "US" | "REDUCED" | "LOW";

type PricingRegion = {
    id: PricingRegionId;
    /** ISO 4217 code; Razorpay orders are created in this currency. */
    currency: string;
    /** Locale used to format prices. en-US for CAD/AUD/SGD so they show CA$, A$, SGD rather than a bare "$". */
    locale: string;
    /** Prices in the currency's minor unit (paise, cents...). */
    amounts: Record<PassKey, number>;
    /** AI Photo Editor credit packs. Each credit costs us ~$0.067 in AI fees, so keep every pack above ~$0.11/credit. */
    packs: Record<CreditPackKey, number>;
};

/**
 * Edit prices here. India pays in INR (₹199/month, ₹999/year); major markets pay in their own currency;
 * other countries pay in USD at a level adjusted for local purchasing power.
 */
export const PRICING_REGIONS: Record<PricingRegionId, PricingRegion> = {
    IN: { id: "IN", currency: "INR", locale: "en-IN", amounts: { PRO_MONTHLY: 19900, PRO_YEARLY: 99900 }, packs: { PHOTO_10: 9900, PHOTO_30: 24900, PHOTO_70: 49900 } },
    US: { id: "US", currency: "USD", locale: "en-US", amounts: { PRO_MONTHLY: 499, PRO_YEARLY: 2499 }, packs: { PHOTO_10: 199, PHOTO_30: 499, PHOTO_70: 999 } },
    EU: { id: "EU", currency: "EUR", locale: "en-IE", amounts: { PRO_MONTHLY: 499, PRO_YEARLY: 2499 }, packs: { PHOTO_10: 199, PHOTO_30: 499, PHOTO_70: 999 } },
    GB: { id: "GB", currency: "GBP", locale: "en-GB", amounts: { PRO_MONTHLY: 399, PRO_YEARLY: 1999 }, packs: { PHOTO_10: 179, PHOTO_30: 399, PHOTO_70: 799 } },
    CA: { id: "CA", currency: "CAD", locale: "en-US", amounts: { PRO_MONTHLY: 699, PRO_YEARLY: 3499 }, packs: { PHOTO_10: 279, PHOTO_30: 699, PHOTO_70: 1399 } },
    AU: { id: "AU", currency: "AUD", locale: "en-US", amounts: { PRO_MONTHLY: 799, PRO_YEARLY: 3999 }, packs: { PHOTO_10: 299, PHOTO_30: 749, PHOTO_70: 1499 } },
    SG: { id: "SG", currency: "SGD", locale: "en-US", amounts: { PRO_MONTHLY: 699, PRO_YEARLY: 3499 }, packs: { PHOTO_10: 279, PHOTO_30: 699, PHOTO_70: 1349 } },
    AE: { id: "AE", currency: "AED", locale: "en-AE", amounts: { PRO_MONTHLY: 1899, PRO_YEARLY: 8999 }, packs: { PHOTO_10: 749, PHOTO_30: 1849, PHOTO_70: 3699 } },
    /** Upper-middle-income countries (Latin America, Southeast Asia, Eastern Europe, Türkiye, South Africa...). */
    REDUCED: { id: "REDUCED", currency: "USD", locale: "en-US", amounts: { PRO_MONTHLY: 299, PRO_YEARLY: 1499 }, packs: { PHOTO_10: 149, PHOTO_30: 399, PHOTO_70: 799 } },
    /** Lower-income countries (South Asia, most of Africa...). */
    LOW: { id: "LOW", currency: "USD", locale: "en-US", amounts: { PRO_MONTHLY: 199, PRO_YEARLY: 999 }, packs: { PHOTO_10: 149, PHOTO_30: 399, PHOTO_70: 799 } },
};

const EURO_COUNTRIES = "AT BE HR CY EE FI FR DE GR IE IT LV LT LU MT NL PT SK SI ES AD MC SM VA ME XK".split(" ");

const REDUCED_COUNTRIES = (
    "AR BR CL CO CR EC MX PE UY BO PY DO GT PA JM " +
    "TR ZA MY TH CN RU KZ UA BY PL RO HU BG RS BA MK AL MD GE AM AZ " +
    "JO LB MA TN DZ IQ IR LY BW NA MU"
).split(" ");

const LOW_COUNTRIES = (
    "PK BD NP LK BT MV MM KH LA VN PH ID MN AF UZ KG TJ TM " +
    "NG KE GH ET UG TZ EG ZW ZM RW SN CI CM MZ MW MG AO SD SS SO YE HT VE NI HN SV CU " +
    "BJ BF ML NE TD TG GN SL LR GM GW CF CD CG GA ER DJ KM LS SZ BI PS SY"
).split(" ");

const COUNTRY_REGION: Record<string, PricingRegionId> = {
    IN: "IN",
    US: "US",
    GB: "GB",
    IM: "GB",
    JE: "GB",
    GG: "GB",
    CA: "CA",
    AU: "AU",
    SG: "SG",
    AE: "AE",
    ...Object.fromEntries(EURO_COUNTRIES.map((c) => [c, "EU" as const])),
    ...Object.fromEntries(REDUCED_COUNTRIES.map((c) => [c, "REDUCED" as const])),
    ...Object.fromEntries(LOW_COUNTRIES.map((c) => [c, "LOW" as const])),
};

export type PassPrice = {
    /** Minor units, exactly what Razorpay is charged. */
    amount: number;
    label: string;
    /** Yearly only: rough per-month cost, for "About $2/month". */
    perMonthLabel: string | null;
};

export type PackPrice = {
    /** Minor units, exactly what Razorpay is charged. */
    amount: number;
    label: string;
    /** Price per edit, e.g. "₹8.30". */
    perCreditLabel: string;
};

export type Pricing = {
    /** ISO 3166 alpha-2, or null when unknown. */
    country: string | null;
    countryName: string | null;
    region: PricingRegionId;
    currency: string;
    passes: Record<PassKey, PassPrice>;
    packs: Record<CreditPackKey, PackPrice>;
    /** Formatted zero in this currency, for the Free plan card. */
    freeLabel: string;
};

export function formatMoney(minorAmount: number, currency: string, locale = "en-US"): string {
    const value = minorAmount / 100;
    const whole = Number.isInteger(value);
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: whole ? 0 : 2,
        maximumFractionDigits: whole ? 0 : 2,
    }).format(value);
}

function countryName(country: string | null): string | null {
    if (!country) return null;
    try {
        const name = new Intl.DisplayNames(["en"], { type: "region" }).of(country);
        return name && name !== country && name !== "Unknown Region" ? name : null;
    } catch {
        return null;
    }
}

/** Unknown countries pay the standard USD price. */
export function regionForCountry(country: string | null): PricingRegionId {
    return (country && COUNTRY_REGION[country.toUpperCase()]) || "US";
}

export function getPricing(country: string | null): Pricing {
    const code = country && /^[A-Za-z]{2}$/.test(country) ? country.toUpperCase() : null;
    const region = PRICING_REGIONS[regionForCountry(code)];
    const format = (amount: number) => formatMoney(amount, region.currency, region.locale);
    const yearly = region.amounts.PRO_YEARLY;

    return {
        country: code,
        countryName: countryName(code),
        region: region.id,
        currency: region.currency,
        passes: {
            PRO_MONTHLY: { amount: region.amounts.PRO_MONTHLY, label: format(region.amounts.PRO_MONTHLY), perMonthLabel: null },
            PRO_YEARLY: {
                amount: yearly,
                label: format(yearly),
                // Rounded to a whole unit for INR, to cents elsewhere.
                perMonthLabel: format(region.currency === "INR" ? Math.round(yearly / 12 / 100) * 100 : Math.round(yearly / 12)),
            },
        },
        packs: Object.fromEntries(
            CREDIT_PACK_KEYS.map((key) => {
                const amount = region.packs[key];
                const perCredit = new Intl.NumberFormat(region.locale, {
                    style: "currency",
                    currency: region.currency,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }).format(amount / 100 / CREDIT_PACKS[key].credits);
                return [key, { amount, label: format(amount), perCreditLabel: perCredit }];
            })
        ) as Record<CreditPackKey, PackPrice>,
        freeLabel: formatMoney(0, region.currency, region.locale),
    };
}
