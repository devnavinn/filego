import { BillingStatus } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getUserPlan } from "@/lib/entitlements"
import {
    CREDIT_VALIDITY_DAYS,
    PRO_PHOTO_BONUS,
    PRO_PHOTO_BONUS_DAYS,
    type PhotoCreditBalance,
} from "@/lib/photo-credits"

const BONUS_KEY = "photo_edit_bonus"
const DAY_MS = 24 * 60 * 60 * 1000

/** Where the credits for one edit came from, so they can be given back exactly. */
export type PhotoCreditCharge = {
    bonus: number
    /** Purchase rows and how many credits were taken from each, in the order they were taken. */
    purchases: { id: string; credits: number }[]
    total: number
}

function activePurchasesWhere(userId: string) {
    return {
        userId,
        status: BillingStatus.ACTIVE,
        creditsRemaining: { gt: 0 },
        expiresAt: { gt: new Date() },
    }
}

async function bonusLeft(userId: string, isPro: boolean): Promise<{ left: number; resetAt: Date | null }> {
    if (!isPro) return { left: 0, resetAt: null }
    const row = await prisma.featureEntitlement.findUnique({ where: { userId_key: { userId, key: BONUS_KEY } } })
    if (!row?.resetAt || row.resetAt <= new Date()) return { left: PRO_PHOTO_BONUS, resetAt: null }
    return { left: Math.max(0, PRO_PHOTO_BONUS - row.usageConsumed), resetAt: row.resetAt }
}

export async function getPhotoCreditBalance(userId: string): Promise<PhotoCreditBalance> {
    const plan = await getUserPlan(userId)
    const [bonus, purchased] = await Promise.all([
        bonusLeft(userId, plan.tier === "pro"),
        prisma.photoCreditPurchase.aggregate({ where: activePurchasesWhere(userId), _sum: { creditsRemaining: true } }),
    ])
    const bought = purchased._sum.creditsRemaining ?? 0
    return {
        bonus: bonus.left,
        bonusResetAt: bonus.resetAt?.toISOString() ?? null,
        purchased: bought,
        total: bonus.left + bought,
    }
}

/** Takes up to `wanted` Pro bonus edits; returns how many it got. */
async function takeBonus(userId: string, wanted: number): Promise<number> {
    const now = new Date()
    const row = await prisma.featureEntitlement.findUnique({ where: { userId_key: { userId, key: BONUS_KEY } } })

    if (!row?.resetAt || row.resetAt <= now) {
        const take = Math.min(wanted, PRO_PHOTO_BONUS)
        await prisma.featureEntitlement.upsert({
            where: { userId_key: { userId, key: BONUS_KEY } },
            create: {
                userId,
                key: BONUS_KEY,
                enabled: true,
                usageLimit: PRO_PHOTO_BONUS,
                usageConsumed: take,
                resetAt: new Date(now.getTime() + PRO_PHOTO_BONUS_DAYS * DAY_MS),
            },
            update: {
                usageLimit: PRO_PHOTO_BONUS,
                usageConsumed: take,
                resetAt: new Date(now.getTime() + PRO_PHOTO_BONUS_DAYS * DAY_MS),
            },
        })
        return take
    }

    const take = Math.min(wanted, PRO_PHOTO_BONUS - row.usageConsumed)
    if (take <= 0) return 0
    // Conditional, so two edits at once can't both spend the last bonus edit.
    const { count } = await prisma.featureEntitlement.updateMany({
        where: { id: row.id, usageConsumed: { lte: PRO_PHOTO_BONUS - take } },
        data: { usageConsumed: { increment: take } },
    })
    return count === 1 ? take : 0
}

/** Takes up to `wanted` purchased credits, soonest-expiring pack first. */
async function takePurchased(userId: string, wanted: number): Promise<PhotoCreditCharge["purchases"]> {
    const taken: PhotoCreditCharge["purchases"] = []
    let need = wanted

    // A few passes in case another request drains a pack between the read and the update.
    for (let attempt = 0; attempt < 3 && need > 0; attempt++) {
        const rows = await prisma.photoCreditPurchase.findMany({
            where: activePurchasesWhere(userId),
            orderBy: { expiresAt: "asc" },
            select: { id: true, creditsRemaining: true },
        })
        if (rows.length === 0) break

        for (const row of rows) {
            if (need <= 0) break
            const take = Math.min(need, row.creditsRemaining)
            const { count } = await prisma.photoCreditPurchase.updateMany({
                where: { id: row.id, creditsRemaining: { gte: take } },
                data: { creditsRemaining: { decrement: take } },
            })
            if (count === 1) {
                taken.push({ id: row.id, credits: take })
                need -= take
            }
        }
    }
    return taken
}

/**
 * Spends `cost` credits for one edit: Pro bonus first, then purchased packs.
 * All or nothing: if the user can't cover the full cost, nothing is spent.
 */
export async function consumePhotoCredits(
    userId: string,
    cost: number
): Promise<{ ok: true; charge: PhotoCreditCharge } | { ok: false; balance: PhotoCreditBalance }> {
    const plan = await getUserPlan(userId)
    const bonus = plan.tier === "pro" ? await takeBonus(userId, cost) : 0
    const purchases = bonus < cost ? await takePurchased(userId, cost - bonus) : []
    const charge: PhotoCreditCharge = { bonus, purchases, total: bonus + purchases.reduce((sum, p) => sum + p.credits, 0) }

    if (charge.total < cost) {
        await refundPhotoCredits(userId, charge)
        return { ok: false, balance: await getPhotoCreditBalance(userId) }
    }
    return { ok: true, charge }
}

/**
 * Gives back `credits` (default: all) of a charge, e.g. when the AI failed, or one credit when an
 * HD edit fell back to the standard model. Purchased credits go back first, since they cost money.
 */
export async function refundPhotoCredits(userId: string, charge: PhotoCreditCharge, credits = charge.total): Promise<void> {
    let left = credits
    try {
        for (const purchase of [...charge.purchases].reverse()) {
            if (left <= 0) break
            const give = Math.min(left, purchase.credits)
            await prisma.photoCreditPurchase.update({
                where: { id: purchase.id },
                data: { creditsRemaining: { increment: give } },
            })
            left -= give
        }
        const bonus = Math.min(left, charge.bonus)
        if (bonus > 0) {
            await prisma.featureEntitlement.updateMany({
                where: { userId, key: BONUS_KEY, usageConsumed: { gte: bonus } },
                data: { usageConsumed: { decrement: bonus } },
            })
        }
    } catch (error) {
        console.error("[PHOTO_CREDIT_REFUND_ERROR]", { userId, credits }, error)
    }
}

export type CreditActivationResult = { status: "activated" } | { status: "already_active" } | { status: "not_found" }

/**
 * Adds a paid pack's credits. Safe to call from both the checkout verify route and the webhook:
 * only the first caller activates it.
 */
export async function activateCreditPurchase({
    orderId,
    paymentId,
    signature,
}: {
    orderId: string
    paymentId: string
    signature?: string
}): Promise<CreditActivationResult> {
    const purchase = await prisma.photoCreditPurchase.findUnique({ where: { providerOrderId: orderId } })
    if (!purchase) return { status: "not_found" }
    if (purchase.status === BillingStatus.ACTIVE) return { status: "already_active" }

    const now = new Date()
    const { count } = await prisma.photoCreditPurchase.updateMany({
        where: { id: purchase.id, status: { not: BillingStatus.ACTIVE } },
        data: {
            status: BillingStatus.ACTIVE,
            creditsRemaining: purchase.credits,
            providerPaymentId: paymentId,
            ...(signature ? { providerSignature: signature } : {}),
            purchasedAt: now,
            expiresAt: new Date(now.getTime() + CREDIT_VALIDITY_DAYS * DAY_MS),
        },
    })
    return count === 1 ? { status: "activated" } : { status: "already_active" }
}
