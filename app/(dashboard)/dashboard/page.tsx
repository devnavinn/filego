import {
    BarChart3,
    Crown,
    Files,
    HardDriveDownload,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getDashboardOverview } from "@/lib/dashboard";
import { formatBytesSafe, formatDateSafe } from "@/lib/dashboard-formatters";
import { StatCard } from "@/components/dashboard/stat-card";
import { RecentJobsTable } from "@/components/dashboard/recent-jobs-table";
import { UsageBreakdownCard } from "@/components/dashboard/usage-breakdown-card";
import { PremiumStatusCard } from "@/components/dashboard/premium-status-card";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";

export default async function DashboardPage() {
    const user = await requireUser();
    const data = await getDashboardOverview(user.id);
    const isPro = data.plan.tier === "pro";

    const hasAnyData = data.summary.totalJobs > 0 || data.recentJobs.length > 0;

    return (
        <div className="space-y-6">
            <section className="rounded-[28px] border bg-card p-6 shadow-sm md:p-8">
                <p className="text-sm text-muted-foreground">Overview</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                    Welcome back, {user.name?.split(" ")[0] || "there"}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                    {data.summary.lastActivityAt
                        ? `Your last file was processed on ${formatDateSafe(data.summary.lastActivityAt)}.`
                        : "Files you download from Filego tools while signed in show up here."}
                </p>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Files processed"
                    value={data.summary.totalFiles.toLocaleString("en-IN")}
                    description="Total files handled across your completed jobs."
                    icon={Files}
                />
                <StatCard
                    title="Space saved"
                    value={formatBytesSafe(data.summary.totalSavedBytes)}
                    description="Combined reduction from compression tools."
                    icon={HardDriveDownload}
                    tone="success"
                />
                <StatCard
                    title="Completed jobs"
                    value={data.summary.totalJobs.toLocaleString("en-IN")}
                    description="Finished processing runs tracked in your workspace."
                    icon={BarChart3}
                />
                <StatCard
                    title="Plan"
                    value={isPro ? "Pro" : "Free"}
                    description={
                        isPro
                            ? data.plan.isLifetime
                                ? "Lifetime Pro access."
                                : `Pro active until ${formatDateSafe(data.plan.expiresAt)}.`
                            : "Upgrade for no ads and higher limits."
                    }
                    icon={Crown}
                    tone="premium"
                />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                <div className="min-w-0 space-y-6">
                    {hasAnyData ? (
                        <>
                            <RecentJobsTable jobs={data.recentJobs} viewAllHref="/dashboard/activity" />
                            <UsageBreakdownCard items={data.toolBreakdown} limit={5} />
                        </>
                    ) : (
                        <DashboardEmptyState />
                    )}
                </div>
                <PremiumStatusCard plan={data.plan} aiUsage={data.aiUsage} />
            </section>
        </div>
    );
}
