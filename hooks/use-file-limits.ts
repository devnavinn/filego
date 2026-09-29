"use client";

import { useCallback } from "react";
import { usePlan } from "@/hooks/use-plan";
import type { PlanLimits, PlanTier } from "@/lib/plans";

export type LimitHit = {
    tier: Exclude<PlanTier, "pro">;
    limits: PlanLimits;
    /** Names of files rejected for being over the size limit. */
    oversized: string[];
    /** Files dropped because the batch was full. */
    overBatch: number;
};

type Listener = (hit: LimitHit) => void;
const listeners = new Set<Listener>();

/** Used by LimitReachedDialog to hear about rejected files. */
export function subscribeToLimitHits(listener: Listener) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/**
 * Applies the viewer's plan limits to files a tool is about to accept.
 * Files over the size limit are dropped, and the rest are capped to the
 * remaining batch space. Anything dropped opens the upgrade dialog.
 *
 * These limits run in the browser, so they are upgrade prompts rather than
 * enforcement. Server-side costs (AI) are metered on the server.
 */
export function useFileLimits() {
    const { loading, tier, limits } = usePlan();

    const allowFiles = useCallback(
        (input: FileList | File[] | File | null | undefined, options?: { existing?: number }): File[] => {
            const files = !input ? [] : input instanceof File ? [input] : Array.from(input);

            // Don't block anyone while the plan is loading; Pro has no practical limits.
            if (loading || !tier || !limits || tier === "pro") return files;

            const oversized = files.filter((file) => file.size > limits.maxFileBytes);
            const sized = files.filter((file) => file.size <= limits.maxFileBytes);

            const room =
                limits.maxBatchFiles === null
                    ? sized.length
                    : Math.max(0, limits.maxBatchFiles - (options?.existing ?? 0));
            const accepted = sized.slice(0, room);
            const overBatch = sized.length - accepted.length;

            if (oversized.length || overBatch) {
                const hit: LimitHit = { tier, limits, oversized: oversized.map((f) => f.name), overBatch };
                listeners.forEach((listener) => listener(hit));
            }

            return accepted;
        },
        [loading, tier, limits]
    );

    return { allowFiles, limits, tier };
}
