import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBytesSafe, formatDateSafe } from "@/lib/dashboard-formatters";
import { jobToolLabel } from "@/lib/tool-labels";

type Job = {
    id: string;
    toolType: string;
    status: string;
    filesCount: number;
    originalBytes: string | number | bigint;
    outputBytes: string | number | bigint;
    savedBytes: string | number | bigint;
    compressionRate?: number | null;
    metadata?: unknown;
    createdAt: string | Date;
    completedAt?: string | Date | null;
};

type RecentJobsTableProps = {
    jobs: Job[];
    title?: string;
    viewAllHref?: string;
    emptyMessage?: string;
};

export function RecentJobsTable({
    jobs,
    title = "Recent activity",
    viewAllHref,
    emptyMessage = "No processing history yet.",
}: RecentJobsTableProps) {
    return (
        <Card className="rounded-3xl border border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-semibold text-foreground">
                    {title}
                </CardTitle>
                {viewAllHref && jobs.length > 0 ? (
                    <Link href={viewAllHref} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                        View all
                    </Link>
                ) : null}
            </CardHeader>

            <CardContent>
                {jobs.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-sm text-muted-foreground">
                        {emptyMessage}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[680px] text-sm">
                            <thead>
                                <tr className="border-b border-border text-left">
                                    <th className="pb-3 font-medium text-muted-foreground">Tool</th>
                                    <th className="pb-3 font-medium text-muted-foreground">Files</th>
                                    <th className="pb-3 font-medium text-muted-foreground">Output</th>
                                    <th className="pb-3 font-medium text-muted-foreground">Saved</th>
                                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                                    <th className="pb-3 font-medium text-muted-foreground">Date</th>
                                </tr>
                            </thead>

                            <tbody>
                                {jobs.map((job) => (
                                    <tr key={job.id} className="border-b border-border/60 last:border-0">
                                        <td className="py-4 font-medium text-foreground">
                                            {jobToolLabel(job)}
                                        </td>
                                        <td className="py-4 text-muted-foreground">{job.filesCount}</td>
                                        <td className="py-4 text-muted-foreground">
                                            {formatBytesSafe(job.outputBytes)}
                                        </td>
                                        <td className="py-4 text-muted-foreground">
                                            {Number(job.savedBytes) > 0 ? (
                                                <>
                                                    {formatBytesSafe(job.savedBytes)}
                                                    {job.compressionRate ? (
                                                        <span className="ml-1 text-xs">(−{Math.round(job.compressionRate)}%)</span>
                                                    ) : null}
                                                </>
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                        <td className="py-4">
                                            <Badge
                                                variant="secondary"
                                                className={
                                                    job.status === "COMPLETED"
                                                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                                        : job.status === "FAILED"
                                                            ? "bg-red-500/10 text-red-700 dark:text-red-400"
                                                            : "bg-muted text-muted-foreground"
                                                }
                                            >
                                                {job.status.toLowerCase()}
                                            </Badge>
                                        </td>
                                        <td className="py-4 text-muted-foreground">
                                            {formatDateSafe(job.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
