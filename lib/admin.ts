import { BillingStatus, PlanType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { TOOL_TYPE_LABELS } from "@/lib/tool-labels";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Passes paid through Razorpay. Admin grants are free and excluded from revenue. */
const paidWhere = {
    // `not` alone would also drop rows whose provider is NULL.
    OR: [{ provider: null }, { provider: { not: "ADMIN" } }],
    planType: { in: [PlanType.PRO, PlanType.LIFETIME] },
    billingStatus: BillingStatus.ACTIVE,
} satisfies Prisma.SubscriptionWhereInput;

function activeProWhere(now: Date): Prisma.SubscriptionWhereInput {
    return {
        billingStatus: BillingStatus.ACTIVE,
        OR: [{ planType: PlanType.LIFETIME }, { planType: PlanType.PRO, expiresAt: { gt: now } }],
    };
}

export async function getAdminOverview() {
    const now = new Date();
    const since7d = new Date(now.getTime() - 7 * DAY_MS);
    const since30d = new Date(now.getTime() - 30 * DAY_MS);

    const [
        userCount,
        newUsers7d,
        proUsers,
        revenueAll,
        revenue30d,
        jobs30d,
        newContactCount,
        subscriberCount,
        publishedPosts,
        recentUsers,
        recentPayments,
        recentMessages,
        topTools,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: since7d } } }),
        prisma.subscription.findMany({
            where: activeProWhere(now),
            distinct: ["userId"],
            select: { userId: true },
        }),
        prisma.subscription.aggregate({ where: paidWhere, _sum: { amount: true }, _count: true }),
        prisma.subscription.aggregate({
            where: { ...paidWhere, purchasedAt: { gte: since30d } },
            _sum: { amount: true },
            _count: true,
        }),
        prisma.toolJob.count({ where: { status: "COMPLETED", createdAt: { gte: since30d } } }),
        prisma.contactSubmission.count({ where: { status: "NEW" } }),
        prisma.waitlistSubscriber.count(),
        prisma.blogPost.count({ where: { status: "PUBLISHED" } }),
        prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { id: true, name: true, email: true, createdAt: true },
        }),
        prisma.subscription.findMany({
            where: paidWhere,
            orderBy: { purchasedAt: "desc" },
            take: 5,
            select: {
                id: true,
                amount: true,
                currency: true,
                billingPeriod: true,
                planType: true,
                purchasedAt: true,
                user: { select: { email: true } },
            },
        }),
        prisma.contactSubmission.findMany({
            where: { status: "NEW" },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { id: true, name: true, subject: true, message: true, createdAt: true },
        }),
        prisma.$queryRaw<Array<{ toolType: string; toolName: string | null; jobs: bigint; users: bigint }>>`
            SELECT
              "toolType"::text AS "toolType",
              "metadata"->>'toolName' AS "toolName",
              COUNT(*)::bigint AS jobs,
              COUNT(DISTINCT "userId")::bigint AS users
            FROM "ToolJob"
            WHERE "status" = 'COMPLETED'
              AND "createdAt" >= ${since30d}
            GROUP BY 1, 2
            ORDER BY jobs DESC
            LIMIT 8
        `,
    ]);

    return {
        userCount,
        newUsers7d,
        proUserCount: proUsers.length,
        revenueAll: { amount: revenueAll._sum.amount ?? 0, count: revenueAll._count },
        revenue30d: { amount: revenue30d._sum.amount ?? 0, count: revenue30d._count },
        jobs30d,
        newContactCount,
        subscriberCount,
        publishedPosts,
        recentUsers,
        recentPayments,
        recentMessages,
        topTools: topTools.map((row) => ({
            tool: row.toolName ?? TOOL_TYPE_LABELS[row.toolType] ?? row.toolType,
            jobs: Number(row.jobs),
            users: Number(row.users),
        })),
    };
}

export const PAYMENT_FILTERS = ["active", "expired", "refunded", "granted"] as const;
export type PaymentFilter = (typeof PAYMENT_FILTERS)[number];

export async function getPaymentsPage({
    page,
    take,
    filter,
    query,
}: {
    page: number;
    take: number;
    filter: PaymentFilter | null;
    query: string;
}) {
    const now = new Date();

    // Abandoned checkouts stay INACTIVE and are never shown.
    const conditions: Prisma.SubscriptionWhereInput[] = [
        { planType: { in: [PlanType.PRO, PlanType.LIFETIME] } },
        { billingStatus: { not: BillingStatus.INACTIVE } },
    ];

    if (filter === "active") conditions.push(activeProWhere(now));
    if (filter === "expired") {
        conditions.push({ billingStatus: BillingStatus.ACTIVE, planType: PlanType.PRO, expiresAt: { lte: now } });
    }
    if (filter === "refunded") conditions.push({ billingStatus: BillingStatus.REFUNDED });
    if (filter === "granted") conditions.push({ provider: "ADMIN" });

    if (query) {
        conditions.push({
            OR: [
                { user: { email: { contains: query, mode: "insensitive" } } },
                { providerPaymentId: { contains: query } },
                { providerOrderId: { contains: query } },
            ],
        });
    }

    const where: Prisma.SubscriptionWhereInput = { AND: conditions };

    const [rows, total] = await Promise.all([
        prisma.subscription.findMany({
            where,
            orderBy: [{ purchasedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
            skip: (page - 1) * take,
            take,
            select: {
                id: true,
                planType: true,
                billingPeriod: true,
                billingStatus: true,
                provider: true,
                amount: true,
                currency: true,
                providerPaymentId: true,
                providerOrderId: true,
                purchasedAt: true,
                startsAt: true,
                expiresAt: true,
                createdAt: true,
                user: { select: { email: true, name: true } },
            },
        }),
        prisma.subscription.count({ where }),
    ]);

    return { rows, total, now };
}

export function passName(sub: { planType: string; billingPeriod: string | null; provider?: string | null }) {
    if (sub.planType === "LIFETIME") return "Pro Lifetime";
    if (sub.provider === "ADMIN") return "Pro (granted)";
    if (sub.billingPeriod === "YEARLY") return "Pro Yearly";
    if (sub.billingPeriod === "MONTHLY") return "Pro Monthly";
    return "Filego Pro";
}

export function formatPaise(amount: number | null | undefined, currency = "INR") {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format((amount ?? 0) / 100);
}
