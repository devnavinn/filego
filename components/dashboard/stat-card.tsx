import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
    title: string;
    value: string;
    description: string;
    icon: LucideIcon;
    tone?: "default" | "success" | "premium";
};

export function StatCard({
    title,
    value,
    description,
    icon: Icon,
    tone = "default",
}: StatCardProps) {
    return (
        <Card className="rounded-3xl border shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>

                <div
                    className={cn(
                        "rounded-2xl border p-2",
                        tone === "success" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                        tone === "premium" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                        tone === "default" && "bg-muted text-foreground"
                    )}
                >
                    <Icon className="size-4" />
                </div>
            </CardHeader>

            <CardContent>
                <div className="text-3xl font-semibold tracking-tight">{value}</div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {description}
                </p>
            </CardContent>
        </Card>
    );
}