import Link from "next/link";
import { Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDateSafe } from "@/lib/dashboard-formatters";
import { formatLimitBytes } from "@/lib/plans";
import type { DashboardPlan } from "@/lib/dashboard";

type PremiumStatusCardProps = {
    plan: DashboardPlan;
    aiUsage: { used: number; resetAt: string | null };
};

export function PremiumStatusCard({ plan, aiUsage }: PremiumStatusCardProps) {
    const isPro = plan.tier === "pro";
    const { daysLeft } = plan;
    const aiPercent = plan.aiDaily > 0 ? Math.min(100, (aiUsage.used / plan.aiDaily) * 100) : 0;

    return (
        <Card className="rounded-3xl border border-border bg-card shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                    <Crown className="size-4" />
                    {isPro ? "Filego Pro" : "Free plan"}
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {isPro ? (
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                        <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                            {plan.isLifetime
                                ? "Lifetime access"
                                : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`}
                        </p>
                        {plan.isLifetime ? null : (
                            <p className="mt-1 text-sm text-muted-foreground">
                                Pro runs until {formatDateSafe(plan.expiresAt)}. Passes don’t auto-renew.
                            </p>
                        )}
                    </div>
                ) : (
                    <p className="text-sm leading-6 text-muted-foreground">
                        Upgrade for no ads, bigger files, unlimited batches and more AI generations.
                    </p>
                )}

                <div className="space-y-2 rounded-2xl border border-border bg-background p-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">AI generations today</span>
                        <span className="font-medium text-foreground">
                            {aiUsage.used} / {plan.aiDaily}
                        </span>
                    </div>
                    <Progress value={aiPercent} aria-label="AI generations used today" />
                    {aiUsage.resetAt ? (
                        <p className="text-xs text-muted-foreground">
                            Resets {new Date(aiUsage.resetAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}
                        </p>
                    ) : null}
                </div>

                <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl border border-border bg-background p-3">
                        <dt className="text-xs text-muted-foreground">Max file size</dt>
                        <dd className="mt-1 font-medium text-foreground">{formatLimitBytes(plan.maxFileBytes)}</dd>
                    </div>
                    <div className="rounded-2xl border border-border bg-background p-3">
                        <dt className="text-xs text-muted-foreground">Files per batch</dt>
                        <dd className="mt-1 font-medium text-foreground">{plan.maxBatchFiles ?? "Unlimited"}</dd>
                    </div>
                </dl>

                {plan.isLifetime ? null : (
                    <Button asChild variant={isPro ? "outline" : "default"} className="w-full rounded-xl">
                        <Link href="/dashboard/premium">{isPro ? "Extend Pro" : "View plans"}</Link>
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
