import { BillingStatus, JobStatus, PlanType, Prisma, ToolType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/bigint";
import { getUserPlan } from "@/lib/entitlements";
import { TOOL_TYPE_LABELS } from "@/lib/tool-labels";

const AI_ENTITLEMENT_KEY = "ai_generate";
const DAY_MS = 24 * 60 * 60 * 1000;
const CHART_MONTHS = 6;

const jobSelect = {
    id: true,
    toolType: true,
    status: true,
    filesCount: true,
    originalBytes: true,
    outputBytes: true,
    savedBytes: true,
    compressionRate: true,
    metadata: true,
    createdAt: true,
    completedAt: true,
} satisfies Prisma.ToolJobSelect;

export type DashboardPlan = {
    tier: "free" | "pro";
    expiresAt: string | null;
    /** Whole days of Pro remaining; null for lifetime or free. */
    daysLeft: number | null;
    isLifetime: boolean;
    aiDaily: number;
    maxFileBytes: number;
    maxBatchFiles: number | null;
};

async function getPlanSummary(userId: string): Promise<DashboardPlan> {
    const plan = await getUserPlan(userId);

    return {
        tier: plan.tier === "pro" ? "pro" : "free",
        expiresAt: plan.expiresAt?.toISOString() ?? null,
        daysLeft: plan.expiresAt
            ? Math.max(0, Math.ceil((plan.expiresAt.getTime() - Date.now()) / DAY_MS))
            : null,
        isLifetime: plan.isLifetime,
        aiDaily: plan.limits.aiDaily,
        maxFileBytes: plan.limits.maxFileBytes,
        maxBatchFiles: plan.limits.maxBatchFiles,
    };
}

/** AI generations used in the current daily window (see lib/ai/ai-quota.ts). */
async function getAiUsage(userId: string) {
    const entitlement = await prisma.featureEntitlement.findUnique({
        where: { userId_key: { userId, key: AI_ENTITLEMENT_KEY } },
        select: { usageConsumed: true, resetAt: true },
    });

    const active = entitlement?.resetAt && entitlement.resetAt > new Date();

    return {
        used: active ? entitlement.usageConsumed : 0,
        resetAt: active ? entitlement.resetAt!.toISOString() : null,
    };
}

/** Jobs, files and savings per month for the last few months, including empty months. */
async function getMonthlyUsage(userId: string) {
    const now = new Date();
    const since = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (CHART_MONTHS - 1), 1));

    const rows = await prisma.$queryRaw<
        Array<{ month: string; jobs: bigint; files: bigint; savedBytes: bigint }>
    >`
        SELECT
          to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS month,
          COUNT(*)::bigint AS jobs,
          COALESCE(SUM("filesCount"), 0)::bigint AS files,
          COALESCE(SUM("savedBytes"), 0)::bigint AS "savedBytes"
        FROM "ToolJob"
        WHERE "userId" = ${userId}
          AND "status" = 'COMPLETED'
          AND "createdAt" >= ${since}
        GROUP BY 1
    `;

    const byMonth = new Map(rows.map((row) => [row.month, row]));

    return Array.from({ length: CHART_MONTHS }, (_, index) => {
        const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (CHART_MONTHS - 1 - index), 1));
        const key = date.toISOString().slice(0, 7);
        const row = byMonth.get(key);

        return {
            month: key,
            label: date.toLocaleDateString("en-IN", { month: "short", year: "numeric", timeZone: "UTC" }),
            jobs: Number(row?.jobs ?? 0),
            files: Number(row?.files ?? 0),
            savedBytes: String(row?.savedBytes ?? 0),
        };
    });
}

/** Completed jobs grouped by tool name, most used first. */
async function getToolBreakdown(userId: string) {
    const rows = await prisma.$queryRaw<
        Array<{ toolType: string; toolName: string | null; toolSlug: string | null; jobs: bigint; files: bigint; savedBytes: bigint }>
    >`
        SELECT
          "toolType"::text AS "toolType",
          "metadata"->>'toolName' AS "toolName",
          MAX("metadata"->>'toolSlug') AS "toolSlug",
          COUNT(*)::bigint AS jobs,
          COALESCE(SUM("filesCount"), 0)::bigint AS files,
          COALESCE(SUM("savedBytes"), 0)::bigint AS "savedBytes"
        FROM "ToolJob"
        WHERE "userId" = ${userId}
          AND "status" = 'COMPLETED'
        GROUP BY 1, 2
        ORDER BY jobs DESC
        LIMIT 20
    `;

    return rows.map((row) => ({
        tool: row.toolName ?? TOOL_TYPE_LABELS[row.toolType] ?? row.toolType,
        toolSlug: row.toolSlug,
        jobs: Number(row.jobs),
        files: Number(row.files),
        savedBytes: String(row.savedBytes),
    }));
}

export type ToolBreakdownItem = Awaited<ReturnType<typeof getToolBreakdown>>[number];
export type MonthlyUsageItem = Awaited<ReturnType<typeof getMonthlyUsage>>[number];

export async function getDashboardOverview(userId: string) {
    const [summary, recentJobs, toolBreakdown, monthlyJobs, plan, aiUsage] = await Promise.all([
        prisma.userUsageSummary.findUnique({ where: { userId } }),
        prisma.toolJob.findMany({
            where: { userId, status: JobStatus.COMPLETED },
            orderBy: { createdAt: "desc" },
            take: 6,
            select: jobSelect,
        }),
        getToolBreakdown(userId),
        getMonthlyUsage(userId),
        getPlanSummary(userId),
        getAiUsage(userId),
    ]);

    return serializeBigInt({
        summary: {
            totalJobs: summary?.totalJobs ?? 0,
            totalFiles: summary?.totalFiles ?? 0,
            totalOriginalBytes: String(summary?.totalOriginalBytes ?? 0),
            totalOutputBytes: String(summary?.totalOutputBytes ?? 0),
            totalSavedBytes: String(summary?.totalSavedBytes ?? 0),
            totalImageCompressions: summary?.totalImageCompressions ?? 0,
            totalPdfOperations: summary?.totalPdfOperations ?? 0,
            lastActivityAt: summary?.lastActivityAt?.toISOString() ?? null,
        },
        recentJobs,
        toolBreakdown,
        monthlyJobs,
        plan,
        aiUsage,
    });
}

export type DashboardJob = Awaited<ReturnType<typeof getDashboardOverview>>["recentJobs"][number];

export const ACTIVITY_PAGE_SIZE = 20;
export const ACTIVITY_STATUSES = ["COMPLETED", "FAILED"] as const;
export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number];

export async function getActivityPage(
    userId: string,
    { page, status, query }: { page: number; status: ActivityStatus | null; query: string }
) {
    const where: Prisma.ToolJobWhereInput = {
        userId,
        status: status ? JobStatus[status] : { in: [JobStatus.COMPLETED, JobStatus.FAILED] },
    };

    const q = query.trim().toLowerCase();
    if (q) {
        const matchingTypes = Object.entries(TOOL_TYPE_LABELS)
            .filter(([, label]) => label.toLowerCase().includes(q))
            .map(([type]) => type as ToolType);

        where.OR = [
            { toolType: { in: matchingTypes } },
            { metadata: { path: ["toolSlug"], string_contains: q.replace(/\s+/g, "-") } },
            { mimeTypes: { has: q.replace(/^\./, "") } },
        ];
    }

    const [total, jobs] = await Promise.all([
        prisma.toolJob.count({ where }),
        prisma.toolJob.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * ACTIVITY_PAGE_SIZE,
            take: ACTIVITY_PAGE_SIZE,
            select: jobSelect,
        }),
    ]);

    return serializeBigInt({
        total,
        pageCount: Math.max(1, Math.ceil(total / ACTIVITY_PAGE_SIZE)),
        jobs,
    });
}

/** Tool slugs the user ran most recently, newest first. */
export async function getRecentToolSlugs(userId: string, limit = 6) {
    const rows = await prisma.$queryRaw<Array<{ slug: string }>>`
        SELECT "metadata"->>'toolSlug' AS slug
        FROM "ToolJob"
        WHERE "userId" = ${userId}
          AND "metadata"->>'toolSlug' IS NOT NULL
        GROUP BY 1
        ORDER BY MAX("createdAt") DESC
        LIMIT ${limit}
    `;

    return rows.map((row) => row.slug);
}

/** Paid Pro passes, newest first. Abandoned checkouts stay INACTIVE and are left out. */
export async function getBillingHistory(userId: string) {
    return prisma.subscription.findMany({
        where: {
            userId,
            planType: { in: [PlanType.PRO, PlanType.LIFETIME] },
            billingStatus: { not: BillingStatus.INACTIVE },
        },
        orderBy: { createdAt: "desc" },
        take: 24,
        select: {
            id: true,
            planType: true,
            billingPeriod: true,
            billingStatus: true,
            amount: true,
            currency: true,
            providerPaymentId: true,
            purchasedAt: true,
            startsAt: true,
            expiresAt: true,
            createdAt: true,
        },
    });
}
