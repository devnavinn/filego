import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBytesSafe } from "@/lib/dashboard-formatters";

type BreakdownItem = {
    toolType: string;
    _count: { _all: number };
    _sum: {
        savedBytes: string | number | bigint | null;
        filesCount: number | null;
    };
};

export function UsageBreakdownCard({ items }: { items: BreakdownItem[] }) {
    return (
        <Card className="rounded-3xl border border-border bg-card shadow-sm">
            <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">
                    Tool breakdown
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {items.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-sm text-muted-foreground">
                        Usage breakdown will appear after a few completed jobs.
                    </div>
                ) : (
                    items.map((item) => (
                        <div
                            key={item.toolType}
                            className="flex items-center justify-between rounded-2xl border border-border bg-background p-4"
                        >
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">
                                    {item.toolType.replaceAll("_", " ")}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {item._count._all} jobs · {item._sum.filesCount ?? 0} files
                                </p>
                            </div>

                            <div className="text-right">
                                <p className="text-sm font-semibold text-foreground">
                                    {formatBytesSafe(item._sum.savedBytes ?? 0)}
                                </p>
                                <p className="text-xs text-muted-foreground">saved</p>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}