import Link from "next/link"

import { Button } from "@/components/ui/button"
import { UpgradeButton } from "@/components/dashboard/upgrade-button"
import { CREDIT_PACKS, CREDIT_PACK_KEYS, CREDIT_VALIDITY_DAYS, PHOTO_EDIT_COST } from "@/lib/photo-credits"
import type { PackPrice } from "@/lib/pricing"
import type { CreditPackKey } from "@/lib/photo-credits"
import { cn } from "@/lib/utils"

export type CreditPackPricing = { currency: string; packs: Record<CreditPackKey, PackPrice> }

type CreditPacksProps = {
    pricing: CreditPackPricing
    signedIn: boolean
    /** Where to send guests after they sign in to buy. */
    callbackUrl?: string
    /** Called after a pack is paid for, e.g. to refresh the balance. */
    onPurchased?: () => void
    compact?: boolean
}

/** AI Photo Editor credit packs: one-time purchases, valid for a year. */
export function CreditPacks({ pricing, signedIn, callbackUrl = "/pricing", onPurchased, compact }: CreditPacksProps) {
    return (
        <div className="space-y-3">
            <div className={cn("grid gap-3", compact ? "grid-cols-1" : "sm:grid-cols-3")}>
                {CREDIT_PACK_KEYS.map((key) => {
                    const pack = CREDIT_PACKS[key]
                    const price = pricing.packs[key]
                    return (
                        <div
                            key={key}
                            className={cn(
                                "relative flex rounded-2xl border bg-card",
                                compact ? "items-center justify-between gap-3 p-3" : "flex-col p-5",
                                pack.popular ? "border-primary/50" : "border-border"
                            )}
                        >
                            {pack.popular && !compact ? (
                                <span className="bg-gradient-brand absolute -top-3 left-5 rounded-full px-3 py-0.5 text-xs font-semibold text-white">
                                    Popular
                                </span>
                            ) : null}
                            <div>
                                <p className={cn("font-semibold", compact ? "text-sm" : "text-base")}>
                                    {pack.name}
                                    {pack.popular && compact ? <span className="ms-1.5 text-xs font-normal text-primary">Popular</span> : null}
                                </p>
                                <p className="text-xs text-muted-foreground">{price.perCreditLabel} per edit</p>
                            </div>
                            {!compact ? <p className="mt-3 font-heading text-3xl font-bold tracking-tight">{price.label}</p> : null}
                            <div className={compact ? "shrink-0" : "mt-4"}>
                                {signedIn ? (
                                    <UpgradeButton
                                        pack={key}
                                        currency={pricing.currency}
                                        onSuccess={onPurchased}
                                        label={compact ? `Buy for ${price.label}` : "Buy credits"}
                                        className={cn("rounded-xl", compact ? "h-8 px-3 text-xs" : "w-full")}
                                    />
                                ) : (
                                    <Button asChild size={compact ? "sm" : "default"} className={cn("rounded-xl", !compact && "w-full")}>
                                        <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>Sign in to buy</Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
            <p className="text-xs text-muted-foreground">
                One-time payment, no subscription. Credits last {CREDIT_VALIDITY_DAYS / 365 === 1 ? "a year" : `${CREDIT_VALIDITY_DAYS} days`}. A
                standard edit uses {PHOTO_EDIT_COST.standard} credit, an HD edit uses {PHOTO_EDIT_COST.hd}. Failed edits are refunded.
            </p>
        </div>
    )
}
