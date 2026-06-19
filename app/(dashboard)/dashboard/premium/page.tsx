import { requireUser } from "@/lib/auth";
import { getDashboardOverview } from "@/lib/dashboard";
import { Crown, ShieldCheck, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PremiumStatusCard } from "@/components/dashboard/premium-status-card";
import { Button } from "@/components/ui/button";

export default async function PremiumPage() {
    const user = await requireUser();
    const data = await getDashboardOverview(user.id);

    return (
        <div className="space-y-6">
            <section className="rounded-[28px] border border-border bg-card p-6 shadow-sm md:p-8">
                <p className="text-sm text-muted-foreground">Premium</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                    Upgrade your workspace
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Unlock higher limits, better batch workflows, and premium processing
                    features across Filego tools.
                </p>
            </section>

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <Card className="rounded-3xl border border-border bg-card shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold text-foreground">
                            Lifetime plan
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-5">
                        <div>
                            <p className="text-4xl font-semibold tracking-tight text-foreground">
                                ₹490
                            </p>
                            <p className="mt-2 text-sm text-muted-foreground">
                                One-time payment for premium Filego access.
                            </p>
                        </div>

                        <div className="grid gap-3">
                            <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                                <Zap className="mt-0.5 size-4 text-foreground" />
                                <div>
                                    <p className="text-sm font-medium text-foreground">
                                        Bulk processing
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Higher limits for image compression and large batches.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                                <Crown className="mt-0.5 size-4 text-foreground" />
                                <div>
                                    <p className="text-sm font-medium text-foreground">
                                        Premium tools
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Access advanced features and future premium-only workflows.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                                <ShieldCheck className="mt-0.5 size-4 text-foreground" />
                                <div>
                                    <p className="text-sm font-medium text-foreground">
                                        Priority experience
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Cleaner workflow, better limits, and premium account status.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Button
                            id="upgrade-button"
                            className="rounded-xl bg-primary text-primary-foreground hover:opacity-90"
                        >
                            Upgrade now
                        </Button>
                    </CardContent>
                </Card>

                <PremiumStatusCard activePlan={data.activePlan} />
            </div>
        </div>
    );
}