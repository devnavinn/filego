import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBytesSafe, formatDateSafe } from "@/lib/dashboard-formatters";

type Job = {
    id: string;
    toolType: string;
    status: string;
    filesCount: number;
    originalBytes: string | number | bigint;
    outputBytes: string | number | bigint;
    savedBytes: string | number | bigint;
    compressionRate?: number | null;
    createdAt: string | Date;
    completedAt?: string | Date | null;
};

export function RecentJobsTable({ jobs }: { jobs: Job[] }) {
    return (
        <Card className="rounded-3xl border border-border bg-card shadow-sm">
            <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">
                    Recent activity
                </CardTitle>
            </CardHeader>

            <CardContent>
                {jobs.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-sm text-muted-foreground">
                        No processing history yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[680px] text-sm">
                            <thead>
                                <tr className="border-b border-border text-left">
                                    <th className="pb-3 font-medium text-muted-foreground">Tool</th>
                                    <th className="pb-3 font-medium text-muted-foreground">Files</th>
                                    <th className="pb-3 font-medium text-muted-foreground">Original</th>
                                    <th className="pb-3 font-medium text-muted-foreground">Saved</th>
                                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                                    <th className="pb-3 font-medium text-muted-foreground">Date</th>
                                </tr>
                            </thead>

                            <tbody>
                                {jobs.map((job) => (
                                    <tr key={job.id} className="border-b border-border/60">
                                        <td className="py-4 font-medium text-foreground">
                                            {job.toolType.replaceAll("_", " ")}
                                        </td>
                                        <td className="py-4 text-muted-foreground">{job.filesCount}</td>
                                        <td className="py-4 text-muted-foreground">
                                            {formatBytesSafe(job.originalBytes)}
                                        </td>
                                        <td className="py-4 text-muted-foreground">
                                            {formatBytesSafe(job.savedBytes)}
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