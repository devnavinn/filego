import { requireUser } from "@/lib/auth";
import { getDashboardOverview } from "@/lib/dashboard";
import { CheckCircle2, Crown, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PremiumStatusCard } from "@/components/dashboard/premium-status-card";
import { UpgradeButton } from "@/components/dashboard/upgrade-button";

export default async function PremiumPage() {
    const user = await requireUser();
    const data = await getDashboardOverview(user.id);

    const isPremium =
        data.activePlan?.planType === "LIFETIME" &&
        data.activePlan?.billingStatus === "ACTIVE";

    const isProActive =
        data.activePlan?.planType === "PRO" &&
        data.activePlan?.billingStatus === "ACTIVE" &&
        (!data.activePlan?.expiresAt || new Date(data.activePlan.expiresAt) > new Date());

    return (
        <div className="space-y-6">
            <section className="rounded-[28px] border border-border bg-card p-6 shadow-sm md:p-8">
                <p className="text-sm text-muted-foreground">Premium</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                    {isPremium ? "You’re on Premium" : "Upgrade your workspace"}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                    {isPremium
                        ? "Thank you for supporting Filego. Your premium access is active and ready across your workspace."
                        : "Unlock higher limits, better batch workflows, and premium processing features across Filego tools."}
                </p>
            </section>

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <Card className="rounded-3xl border border-border bg-card shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold text-foreground">
                            {isPremium ? "Premium active" : "Lifetime plan"}
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-5">
                        {isPremium ? (
                            <>
                                <div className="rounded-3xl border border-emerald-200/60 bg-emerald-50/60 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-2xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                                            <CheckCircle2 className="size-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-base font-semibold text-foreground">
                                                Premium unlocked
                                            </p>
                                            <p className="text-sm leading-6 text-muted-foreground">
                                                Thanks for upgrading to Filego Premium. Your workspace now has premium access and better limits enabled.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-3">
                                    <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                                        <Zap className="mt-0.5 size-4 text-foreground" />
                                        <div>
                                            <p className="text-sm font-medium text-foreground">
                                                Higher processing limits
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Run larger batches and smoother compression workflows.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                                        <Crown className="mt-0.5 size-4 text-foreground" />
                                        <div>
                                            <p className="text-sm font-medium text-foreground">
                                                Premium tools enabled
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Access premium-only workflows and upcoming advanced features.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                                        <ShieldCheck className="mt-0.5 size-4 text-foreground" />
                                        <div>
                                            <p className="text-sm font-medium text-foreground">
                                                Premium account status
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Your account is verified for the premium experience across Filego.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/40 px-4 py-3">
                                    <Sparkles className="size-4 text-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                        Thank you for supporting Filego — your upgrade helps us build better tools faster.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <p className="text-4xl font-semibold tracking-tight text-foreground">
                                        ₹999
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

                                <UpgradeButton />
                            </>
                        )}
                    </CardContent>
                </Card>

                <PremiumStatusCard activePlan={data.activePlan} />
            </div>

            <Card className="rounded-3xl border border-border bg-card shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                        <Sparkles className="size-4" />
                        AI generations plan
                    </CardTitle>
                </CardHeader>

                <CardContent>
                    {isProActive ? (
                        <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/60 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
                            <p className="text-sm font-medium text-foreground">AI Pro active</p>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                You get 100 AI generations per day (MCQ quiz generation and upcoming AI tools).
                                {data.activePlan?.expiresAt
                                    ? ` Renews/expires on ${new Date(data.activePlan.expiresAt).toLocaleDateString()}.`
                                    : ""}
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-muted-foreground">
                                Free accounts get 5 AI generations/day. Upgrade for 100/day.
                            </p>

                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <div className="rounded-2xl border border-border bg-background p-5">
                                    <p className="text-2xl font-semibold tracking-tight text-foreground">
                                        ₹1,000<span className="text-sm font-normal text-muted-foreground">/mo</span>
                                    </p>
                                    <p className="mt-2 text-sm text-muted-foreground">Billed monthly.</p>
                                    <div className="mt-4">
                                        <UpgradeButton
                                            plan="PRO_MONTHLY"
                                            label="Get Monthly"
                                            description="Filego AI Pro - Monthly"
                                        />
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-primary/40 bg-background p-5">
                                    <p className="text-2xl font-semibold tracking-tight text-foreground">
                                        ₹9,999<span className="text-sm font-normal text-muted-foreground">/yr</span>
                                    </p>
                                    <p className="mt-2 text-sm text-muted-foreground">Billed yearly — save vs monthly.</p>
                                    <div className="mt-4">
                                        <UpgradeButton
                                            plan="PRO_YEARLY"
                                            label="Get Yearly"
                                            description="Filego AI Pro - Yearly"
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}