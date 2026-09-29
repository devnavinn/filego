import { Clock, FileImage, FileText, Percent } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getDashboardOverview } from "@/lib/dashboard";
import { formatDateSafe } from "@/lib/dashboard-formatters";
import { StatCard } from "@/components/dashboard/stat-card";
import { UsageBreakdownCard } from "@/components/dashboard/usage-breakdown-card";
import { MonthlyUsageChart } from "@/components/dashboard/monthly-usage-chart";

export default async function AnalyticsPage() {
    const user = await requireUser();
    const data = await getDashboardOverview(user.id);

    const original = Number(data.summary.totalOriginalBytes);
    const saved = Number(data.summary.totalSavedBytes);
    const reduction = original > 0 ? Math.round((saved / original) * 100) : null;

    return (
        <div className="space-y-6">
            <section className="rounded-[28px] border border-border bg-card p-6 shadow-sm md:p-8">
                <p className="text-sm text-muted-foreground">Analytics</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                    Usage insights
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                    See which tools you use most and how much storage you’ve saved.
                </p>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Average reduction"
                    value={reduction === null ? "—" : `${reduction}%`}
                    description="Size saved across compression jobs."
                    icon={Percent}
                    tone="success"
                />
                <StatCard
                    title="Image jobs"
                    value={String(data.summary.totalImageCompressions)}
                    description="Image compression runs."
                    icon={FileImage}
                />
                <StatCard
                    title="PDF jobs"
                    value={String(data.summary.totalPdfOperations)}
                    description="Merges, splits, conversions and more."
                    icon={FileText}
                />
                <StatCard
                    title="Last active"
                    value={formatDateSafe(data.summary.lastActivityAt)}
                    description="Your most recent completed job."
                    icon={Clock}
                />
            </section>

            <div className="grid gap-6 xl:grid-cols-2">
                <MonthlyUsageChart months={data.monthlyJobs} />
                <UsageBreakdownCard items={data.toolBreakdown} />
            </div>
        </div>
    );
}
