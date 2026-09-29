import { BillingPeriod, BillingStatus, PlanType, type Subscription } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, PRO_PASSES, type PlanLimits, type PlanTier, type ProPass } from "@/lib/plans";

const DAY_MS = 24 * 60 * 60 * 1000;

export type UserPlan = {
    tier: PlanTier;
    limits: PlanLimits;
    /** The subscription row granting Pro, if any. */
    subscription: Subscription | null;
    /** Latest expiry across all active passes; null for lifetime or non-Pro. */
    expiresAt: Date | null;
    isLifetime: boolean;
};

/** Active subscriptions that currently grant Pro, latest expiry first. Legacy LIFETIME rows never expire. */
async function findProSubscriptions(userId: string) {
    const now = new Date();

    return prisma.subscription.findMany({
        where: {
            userId,
            billingStatus: BillingStatus.ACTIVE,
            OR: [
                { planType: PlanType.LIFETIME },
                { planType: PlanType.PRO, expiresAt: { gt: now } },
            ],
        },
        orderBy: { expiresAt: { sort: "desc", nulls: "first" } },
    });
}

export async function getUserPlan(userId: string | null | undefined): Promise<UserPlan> {
    if (!userId) {
        return { tier: "guest", limits: PLAN_LIMITS.guest, subscription: null, expiresAt: null, isLifetime: false };
    }

    const [latest] = await findProSubscriptions(userId);

    if (!latest) {
        return { tier: "free", limits: PLAN_LIMITS.free, subscription: null, expiresAt: null, isLifetime: false };
    }

    const isLifetime = latest.planType === PlanType.LIFETIME;

    return {
        tier: "pro",
        limits: PLAN_LIMITS.pro,
        subscription: latest,
        expiresAt: isLifetime ? null : latest.expiresAt,
        isLifetime,
    };
}

export async function isProUser(userId: string) {
    return (await getUserPlan(userId)).tier === "pro";
}

function passForSubscription(sub: Subscription): ProPass | null {
    if (sub.billingPeriod === BillingPeriod.MONTHLY) return PRO_PASSES.PRO_MONTHLY;
    if (sub.billingPeriod === BillingPeriod.YEARLY) return PRO_PASSES.PRO_YEARLY;
    // Orders created before billingPeriod existed.
    return Object.values(PRO_PASSES).find((pass) => pass.amount === sub.amount) ?? null;
}

export type ActivationResult =
    | { status: "activated"; subscription: Subscription }
    | { status: "already_active" }
    | { status: "not_found" };

/**
 * Marks a paid Razorpay order's pass as active. Safe to call from both the
 * checkout verify route and the webhook: only the first caller activates it.
 * A pass bought while Pro is active starts when the current one ends.
 */
export async function activatePass({
    orderId,
    paymentId,
    signature,
}: {
    orderId: string;
    paymentId: string;
    signature?: string;
}): Promise<ActivationResult> {
    const sub = await prisma.subscription.findFirst({
        where: { providerOrderId: orderId },
    });

    if (!sub) return { status: "not_found" };
    if (sub.billingStatus === BillingStatus.ACTIVE) return { status: "already_active" };

    const pass = passForSubscription(sub);
    if (!pass) {
        throw new Error(`No pass matches subscription ${sub.id}`);
    }

    const now = new Date();
    const current = await getUserPlan(sub.userId);
    const startsAt = current.expiresAt && current.expiresAt > now ? current.expiresAt : now;
    const expiresAt = new Date(startsAt.getTime() + pass.days * DAY_MS);

    // Conditional update so concurrent verify/webhook calls activate only once.
    const { count } = await prisma.subscription.updateMany({
        where: { id: sub.id, billingStatus: { not: BillingStatus.ACTIVE } },
        data: {
            billingStatus: BillingStatus.ACTIVE,
            providerPaymentId: paymentId,
            ...(signature ? { providerSignature: signature } : {}),
            purchasedAt: now,
            startsAt,
            expiresAt,
        },
    });

    if (count === 0) return { status: "already_active" };

    return {
        status: "activated",
        subscription: { ...sub, billingStatus: BillingStatus.ACTIVE, providerPaymentId: paymentId, purchasedAt: now, startsAt, expiresAt },
    };
}
