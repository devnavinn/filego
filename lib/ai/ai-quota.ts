import { prisma } from "@/lib/prisma"
import { getUserPlan } from "@/lib/entitlements"

const ENTITLEMENT_KEY = "ai_generate"
const DAY_MS = 24 * 60 * 60 * 1000

export type AiQuotaResult = {
    allowed: boolean
    limit: number
    remaining: number
    isPro: boolean
}

/** Checks the caller's daily AI quota and consumes one unit if allowed. */
export async function consumeAiQuota(userId: string): Promise<AiQuotaResult> {
    const plan = await getUserPlan(userId)
    const isPro = plan.tier === "pro"
    const limit = plan.limits.aiDaily
    const now = new Date()

    const entitlement = await prisma.featureEntitlement.findUnique({
        where: { userId_key: { userId, key: ENTITLEMENT_KEY } },
    })

    if (!entitlement || !entitlement.resetAt || entitlement.resetAt <= now) {
        const updated = await prisma.featureEntitlement.upsert({
            where: { userId_key: { userId, key: ENTITLEMENT_KEY } },
            create: {
                userId,
                key: ENTITLEMENT_KEY,
                enabled: true,
                usageLimit: limit,
                usageConsumed: 1,
                resetAt: new Date(now.getTime() + DAY_MS),
            },
            update: {
                usageLimit: limit,
                usageConsumed: 1,
                resetAt: new Date(now.getTime() + DAY_MS),
            },
        })

        return { allowed: true, limit, remaining: Math.max(0, limit - updated.usageConsumed), isPro }
    }

    if (entitlement.usageConsumed >= limit) {
        return { allowed: false, limit, remaining: 0, isPro }
    }

    const updated = await prisma.featureEntitlement.update({
        where: { userId_key: { userId, key: ENTITLEMENT_KEY } },
        data: {
            usageLimit: limit,
            usageConsumed: { increment: 1 },
        },
    })

    return { allowed: true, limit, remaining: Math.max(0, limit - updated.usageConsumed), isPro }
}
