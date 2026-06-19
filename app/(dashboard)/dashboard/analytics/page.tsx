import { requireUser } from "@/lib/auth";
import { getDashboardOverview } from "@/lib/dashboard";
import { UsageBreakdownCard } from "@/components/dashboard/usage-breakdown-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBytesSafe } from "@/lib/dashboard-formatters";

export default async function AnalyticsPage() {
    const user = await requireUser();
    const data = await getDashboardOverview(user.id);

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

            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                <UsageBreakdownCard items={data.toolBreakdown ?? []} />

                <Card className="rounded-3xl border border-border bg-card shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold text-foreground">
                            Monthly usage
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-3">
                        {(data.monthlyJobs ?? []).length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-sm text-muted-foreground">
                                Monthly analytics will appear after more completed jobs.
                            </div>
                        ) : (
                            data.monthlyJobs.map(
                                (month: {
                                    month: string;
                                    jobs: string | number | bigint;
                                    files: string | number | bigint;
                                    savedBytes: string | number | bigint;
                                }) => (
                                    <div
                                        key={month.month}
                                        className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-foreground">
                                                {month.month}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {String(month.jobs)} jobs · {String(month.files)} files
                                            </p>
                                        </div>

                                        <div className="text-right text-sm font-semibold text-foreground">
                                            {formatBytesSafe(month.savedBytes)}
                                        </div>
                                    </div>
                                )
                            )
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}