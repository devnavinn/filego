"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { PLAN_LIMITS, type PlanLimits, type PlanTier } from "@/lib/plans";

export type ClientPlan = {
    tier: PlanTier;
    limits: PlanLimits;
    expiresAt: string | null;
    isLifetime: boolean;
};

let cached: { userId: string; plan: ClientPlan } | null = null;
let inflight: Promise<ClientPlan> | null = null;

function fetchPlan() {
    inflight ??= fetch("/api/me/plan", { credentials: "same-origin" })
        .then((res) => (res.ok ? (res.json() as Promise<ClientPlan>) : Promise.reject(res.status)))
        .finally(() => {
            inflight = null;
        });
    return inflight;
}

/** Drop the cached plan, e.g. right after a successful purchase. */
export function invalidatePlan() {
    cached = null;
}

/**
 * The viewer's plan tier and limits. `loading` is true until the tier is known,
 * so callers can avoid flashing ads or limit prompts at Pro users.
 */
export function usePlan() {
    const { data: session, status } = useSession();
    const userId = session?.user?.id ?? null;
    const [fetched, setFetched] = useState<{ userId: string; plan: ClientPlan } | null>(null);

    const known =
        (fetched && fetched.userId === userId && fetched) ||
        (cached && cached.userId === userId && cached) ||
        null;

    useEffect(() => {
        if (status === "loading" || !userId || cached?.userId === userId) return;

        let cancelled = false;
        fetchPlan()
            .then((plan) => {
                cached = { userId, plan };
                if (!cancelled) setFetched(cached);
            })
            .catch(() => {
                // Fall back to free limits rather than blocking the tool.
                const plan: ClientPlan = { tier: "free", limits: PLAN_LIMITS.free, expiresAt: null, isLifetime: false };
                if (!cancelled) setFetched({ userId, plan });
            });

        return () => {
            cancelled = true;
        };
    }, [status, userId]);

    if (status === "unauthenticated") {
        return { tier: "guest" as const, limits: PLAN_LIMITS.guest, expiresAt: null, isLifetime: false, loading: false };
    }

    if (!known) {
        return { tier: null, limits: null, expiresAt: null, isLifetime: false, loading: true };
    }

    return { ...known.plan, loading: false };
}
