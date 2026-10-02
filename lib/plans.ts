// Client-safe plan configuration. Server-side plan lookups live in lib/entitlements.ts.

export type PlanTier = "guest" | "free" | "pro";

export type PassKey = "PRO_MONTHLY" | "PRO_YEARLY";

export type ProPass = {
    key: PassKey;
    name: string;
    period: "MONTHLY" | "YEARLY";
    /** Price in paise. */
    amount: number;
    days: number;
    priceLabel: string;
    periodLabel: string;
};

/** Prepaid Pro passes. Buying another pass while active extends the current expiry. */
export const PRO_PASSES: Record<PassKey, ProPass> = {
    PRO_MONTHLY: {
        key: "PRO_MONTHLY",
        name: "Pro Monthly",
        period: "MONTHLY",
        amount: 19900,
        days: 30,
        priceLabel: "₹199",
        periodLabel: "month",
    },
    PRO_YEARLY: {
        key: "PRO_YEARLY",
        name: "Pro Yearly",
        period: "YEARLY",
        amount: 49900,
        days: 365,
        priceLabel: "₹499",
        periodLabel: "year",
    },
};

export function isPassKey(value: unknown): value is PassKey {
    return typeof value === "string" && value in PRO_PASSES;
}

export type PlanLimits = {
    /** AI generations per rolling day; 0 means AI tools need an account. */
    aiDaily: number;
    /** Largest single file a tool accepts, in bytes. */
    maxFileBytes: number;
    /** Files per batch; null means unlimited. */
    maxBatchFiles: number | null;
    showAds: boolean;
};

const MB = 1024 * 1024;

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
    guest: { aiDaily: 0, maxFileBytes: 50 * MB, maxBatchFiles: 5, showAds: true },
    free: { aiDaily: 5, maxFileBytes: 200 * MB, maxBatchFiles: 20, showAds: true },
    pro: { aiDaily: 500, maxFileBytes: 2048 * MB, maxBatchFiles: null, showAds: false },
};

/** Formats a size limit for display, e.g. "100 MB" or "2 GB". */
export function formatLimitBytes(bytes: number) {
    return bytes >= 1024 * MB ? `${bytes / (1024 * MB)} GB` : `${bytes / MB} MB`;
}
