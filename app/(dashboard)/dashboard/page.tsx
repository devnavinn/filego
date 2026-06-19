import {
    BarChart3,
    Crown,
    Files,
    HardDriveDownload,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getDashboardOverview } from "@/lib/dashboard";
import { formatBytesSafe } from "@/lib/dashboard-formatters";
import { StatCard } from "@/components/dashboard/stat-card";
import { RecentJobsTable } from "@/components/dashboard/recent-jobs-table";
import { UsageBreakdownCard } from "@/components/dashboard/usage-breakdown-card";
import { PremiumStatusCard } from "@/components/dashboard/premium-status-card";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";

export default async function DashboardPage() {
    const user = await requireUser();
    const data = await getDashboardOverview(user.id);

    const hasAnyData =
        (data.summary?.totalJobs ?? 0) > 0 || (data.recentJobs?.length ?? 0) > 0;

    return (
        <div className="space-y-6">
            <section className="rounded-[28px] border bg-card p-6 shadow-sm md:p-8">
                <p className="text-sm text-muted-foreground">Overview</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                    Welcome back, {user.name?.split(" ")[0] || "there"}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Track file processing, storage savings, premium access, and recent activity from one clean workspace.
                </p>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Files processed"
                    value={String(data.summary?.totalFiles ?? 0)}
                    description="Total files handled across your completed jobs."
                    icon={Files}
                />
                <StatCard
                    title="Space saved"
                    value={formatBytesSafe(data.summary?.totalSavedBytes ?? 0)}
                    description="Combined reduction from your optimization history."
                    icon={HardDriveDownload}
                    tone="success"
                />
                <StatCard
                    title="Completed jobs"
                    value={String(data.summary?.totalJobs ?? 0)}
                    description="Finished processing runs tracked in your workspace."
                    icon={BarChart3}
                />
                <StatCard
                    title="Premium"
                    value={data.activePlan?.billingStatus === "ACTIVE" ? "Active" : "Free"}
                    description="Your current access level for premium tools and limits."
                    icon={Crown}
                    tone="premium"
                />
            </section>

            {!hasAnyData ? (
                <DashboardEmptyState />
            ) : (
                <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                    <RecentJobsTable jobs={data.recentJobs ?? []} />
                    <div className="space-y-6">
                        <UsageBreakdownCard items={data.toolBreakdown ?? []} />
                        <PremiumStatusCard activePlan={data.activePlan} />
                    </div>
                </section>
            )}
        </div>
    );
}