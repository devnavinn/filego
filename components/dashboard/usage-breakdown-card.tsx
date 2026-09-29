import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBytesSafe } from "@/lib/dashboard-formatters";
import { findToolBySlug } from "@/lib/tools-data";
import type { ToolBreakdownItem } from "@/lib/dashboard";

type UsageBreakdownCardProps = {
    items: ToolBreakdownItem[];
    limit?: number;
};

export function UsageBreakdownCard({ items, limit }: UsageBreakdownCardProps) {
    const shown = limit ? items.slice(0, limit) : items;
    const maxJobs = Math.max(1, ...shown.map((item) => item.jobs));

    return (
        <Card className="rounded-3xl border border-border bg-card shadow-sm">
            <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">
                    Most used tools
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
                {shown.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-sm text-muted-foreground">
                        Usage breakdown will appear after a few completed jobs.
                    </div>
                ) : (
                    shown.map((item) => {
                        const tool = item.toolSlug ? findToolBySlug(item.toolSlug) : null;
                        const saved = Number(item.savedBytes);

                        return (
                            <div
                                key={item.tool}
                                className="rounded-2xl border border-border bg-background p-4"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        {tool ? (
                                            <Link
                                                href={`/tools/${tool.categorySlug}/${tool.slug}`}
                                                className="truncate text-sm font-medium text-foreground underline-offset-4 hover:underline"
                                            >
                                                {item.tool}
                                            </Link>
                                        ) : (
                                            <p className="truncate text-sm font-medium text-foreground">{item.tool}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            {item.jobs} {item.jobs === 1 ? "job" : "jobs"} · {item.files} {item.files === 1 ? "file" : "files"}
                                        </p>
                                    </div>

                                    {saved > 0 ? (
                                        <div className="shrink-0 text-right">
                                            <p className="text-sm font-semibold text-foreground">
                                                {formatBytesSafe(saved)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">saved</p>
                                        </div>
                                    ) : null}
                                </div>

                                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                                    <div
                                        className="h-full rounded-full bg-primary"
                                        style={{ width: `${(item.jobs / maxJobs) * 100}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })
                )}
            </CardContent>
        </Card>
    );
}
