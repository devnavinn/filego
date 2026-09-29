import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UpgradeButton } from "@/components/dashboard/upgrade-button";
import { PLAN_LIMITS, PRO_PASSES, formatLimitBytes, type PassKey, type PlanTier } from "@/lib/plans";
import { cn } from "@/lib/utils";

const freeFeatures = [
    `${PLAN_LIMITS.free.aiDaily} AI generations a day`,
    `Files up to ${formatLimitBytes(PLAN_LIMITS.free.maxFileBytes)}`,
    `Up to ${PLAN_LIMITS.free.maxBatchFiles} files per batch`,
    "All browser-based tools",
    "Activity history in your dashboard",
];

const proFeatures = [
    `${PLAN_LIMITS.pro.aiDaily} AI generations a day`,
    `Files up to ${formatLimitBytes(PLAN_LIMITS.pro.maxFileBytes)}`,
    "Unlimited files per batch",
    "No ads anywhere on Filego",
    "Everything in Free",
];

type PlanCardsProps = {
    tier: PlanTier;
    expiresAt?: Date | string | null;
    isLifetime?: boolean;
    /** Where to send guests after they sign in to buy. */
    callbackUrl?: string;
};

export function PlanCards({ tier, expiresAt, isLifetime, callbackUrl = "/pricing" }: PlanCardsProps) {
    const isPro = tier === "pro";
    const loginHref = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;

    return (
        <div className="grid gap-5 md:grid-cols-3">
            <div className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-sm">
                <p className="text-sm font-semibold text-muted-foreground">Free</p>
                <p className="mt-3 font-heading text-4xl font-bold tracking-tight">₹0</p>
                <p className="mt-1 text-sm text-muted-foreground">With a free account.</p>
                <FeatureList items={freeFeatures} />
                <div className="mt-auto pt-6">
                    {tier === "guest" ? (
                        <Button asChild variant="outline" className="w-full rounded-xl">
                            <Link href="/register">Create free account</Link>
                        </Button>
                    ) : (
                        <p className="text-center text-sm text-muted-foreground">
                            {isPro ? "Included in Pro" : "Your current plan"}
                        </p>
                    )}
                </div>
            </div>

            {(Object.keys(PRO_PASSES) as PassKey[]).map((key) => {
                const pass = PRO_PASSES[key];
                const featured = key === "PRO_YEARLY";
                const monthlyEquivalent = Math.round(pass.amount / 100 / 12);

                return (
                    <div
                        key={key}
                        className={cn(
                            "relative flex flex-col rounded-3xl border bg-card p-6 shadow-sm",
                            featured ? "border-primary/50 shadow-lg shadow-primary/10" : "border-border"
                        )}
                    >
                        {featured ? (
                            <span className="bg-gradient-brand absolute -top-3 left-6 rounded-full px-3 py-1 text-xs font-semibold text-white">
                                Best value
                            </span>
                        ) : null}
                        <p className="text-sm font-semibold text-muted-foreground">{pass.name}</p>
                        <p className="mt-3 font-heading text-4xl font-bold tracking-tight">
                            {pass.priceLabel}
                            <span className="text-base font-normal text-muted-foreground">/{pass.periodLabel}</span>
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {pass.period === "YEARLY"
                                ? `About ₹${monthlyEquivalent}/month. One payment, no auto-renew.`
                                : `${pass.days} days of Pro. One payment, no auto-renew.`}
                        </p>
                        <FeatureList items={proFeatures} />
                        <div className="mt-auto pt-6">
                            {isLifetime ? (
                                <p className="text-center text-sm text-muted-foreground">You have lifetime Pro</p>
                            ) : tier === "guest" ? (
                                <Button asChild className="w-full rounded-xl">
                                    <Link href={loginHref}>Sign in to buy</Link>
                                </Button>
                            ) : (
                                <UpgradeButton
                                    plan={key}
                                    label={isPro ? `Add ${pass.days} days` : `Get ${pass.name}`}
                                    className="w-full rounded-xl bg-primary text-primary-foreground hover:opacity-90"
                                />
                            )}
                        </div>
                    </div>
                );
            })}

            {isPro && !isLifetime && expiresAt ? (
                <p className="text-sm text-muted-foreground md:col-span-3">
                    Your Pro access runs until{" "}
                    <span className="font-medium text-foreground">
                        {new Date(expiresAt).toLocaleDateString("en-IN", { dateStyle: "long" })}
                    </span>
                    . Buying another pass adds its days after that date.
                </p>
            ) : null}
        </div>
    );
}

function FeatureList({ items }: { items: string[] }) {
    return (
        <ul className="mt-6 space-y-2.5">
            {items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );
}
