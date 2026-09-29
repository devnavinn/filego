import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBytesSafe } from "@/lib/dashboard-formatters";
import type { MonthlyUsageItem } from "@/lib/dashboard";

const CHART_HEIGHT = 160;

export function MonthlyUsageChart({ months }: { months: MonthlyUsageItem[] }) {
    const maxJobs = Math.max(0, ...months.map((month) => month.jobs));
    const total = months.reduce((sum, month) => sum + month.jobs, 0);

    return (
        <Card className="rounded-3xl border border-border bg-card shadow-sm">
            <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">
                    Jobs per month
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    {total} completed {total === 1 ? "job" : "jobs"} in the last {months.length} months
                </p>
            </CardHeader>

            <CardContent>
                {total === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-sm text-muted-foreground">
                        Monthly analytics will appear after your first completed job.
                    </div>
                ) : (
                    <>
                        <div
                            className="flex items-end gap-2 border-b border-border"
                            style={{ height: CHART_HEIGHT + 24 }}
                            aria-hidden
                        >
                            {months.map((month) => {
                                const height = maxJobs > 0 ? (month.jobs / maxJobs) * CHART_HEIGHT : 0;

                                return (
                                    <div key={month.month} className="group relative flex h-full flex-1 flex-col items-center justify-end">
                                        {month.jobs === maxJobs ? (
                                            <span className="mb-1 text-xs font-medium text-foreground">{month.jobs}</span>
                                        ) : null}
                                        <div
                                            className="w-full max-w-12 rounded-t-[4px] bg-primary transition-opacity group-hover:opacity-80"
                                            style={{ height: Math.max(height, month.jobs > 0 ? 4 : 0) }}
                                        />
                                        <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden w-max -translate-x-1/2 rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md group-hover:block">
                                            <p className="font-medium">{month.label}</p>
                                            <p className="text-muted-foreground">
                                                {month.jobs} jobs · {month.files} files · {formatBytesSafe(month.savedBytes)} saved
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-2 flex gap-2" aria-hidden>
                            {months.map((month) => (
                                <span key={month.month} className="flex-1 text-center text-xs text-muted-foreground">
                                    {month.label.split(" ")[0]}
                                </span>
                            ))}
                        </div>

                        <table className="sr-only">
                            <caption>Completed jobs per month</caption>
                            <thead>
                                <tr>
                                    <th>Month</th>
                                    <th>Jobs</th>
                                    <th>Files</th>
                                    <th>Space saved</th>
                                </tr>
                            </thead>
                            <tbody>
                                {months.map((month) => (
                                    <tr key={month.month}>
                                        <td>{month.label}</td>
                                        <td>{month.jobs}</td>
                                        <td>{month.files}</td>
                                        <td>{formatBytesSafe(month.savedBytes)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
