import { BillingStatus, JobStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/bigint";

const EMPTY_DASHBOARD_DATA = {
    summary: {
        totalJobs: 0,
        totalFiles: 0,
        totalOriginalBytes: "0",
        totalOutputBytes: "0",
        totalSavedBytes: "0",
        totalImageCompressions: 0,
        totalPdfOperations: 0,
        lastActivityAt: null,
    },
    recentJobs: [],
    toolBreakdown: [],
    monthlyJobs: [],
    activePlan: null,
};

export async function getDashboardOverview(userId?: string) {
    if (!userId) {
        return EMPTY_DASHBOARD_DATA;
    }

    const [summary, recentJobs, toolBreakdown, monthlyJobs, activePlan] =
        await Promise.all([
            prisma.userUsageSummary.findUnique({
                where: { userId },
            }),
            prisma.toolJob.findMany({
                where: {
                    userId,
                    status: JobStatus.COMPLETED,
                },
                orderBy: { createdAt: "desc" },
                take: 10,
                select: {
                    id: true,
                    toolType: true,
                    status: true,
                    filesCount: true,
                    originalBytes: true,
                    outputBytes: true,
                    savedBytes: true,
                    compressionRate: true,
                    createdAt: true,
                    completedAt: true,
                },
            }),
            prisma.toolJob.groupBy({
                by: ["toolType"],
                where: {
                    userId,
                    status: JobStatus.COMPLETED,
                },
                _count: {
                    _all: true,
                },
                _sum: {
                    savedBytes: true,
                    filesCount: true,
                },
            }),
            prisma.$queryRaw<
                Array<{
                    month: string;
                    jobs: bigint;
                    files: bigint;
                    savedBytes: bigint;
                }>
            >`
        SELECT
          to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS month,
          COUNT(*)::bigint AS jobs,
          COALESCE(SUM("filesCount"), 0)::bigint AS files,
          COALESCE(SUM("savedBytes"), 0)::bigint AS "savedBytes"
        FROM "ToolJob"
        WHERE "userId" = ${userId}
          AND "status" = 'COMPLETED'
          AND "createdAt" >= NOW() - INTERVAL '12 months'
        GROUP BY 1
        ORDER BY 1 ASC
      `,
            prisma.subscription.findFirst({
                where: {
                    userId,
                    billingStatus: BillingStatus.ACTIVE,
                },
                orderBy: { createdAt: "desc" },
            }),
        ]);

    return serializeBigInt({
        summary: summary ?? EMPTY_DASHBOARD_DATA.summary,
        recentJobs,
        toolBreakdown,
        monthlyJobs,
        activePlan,
    });
}