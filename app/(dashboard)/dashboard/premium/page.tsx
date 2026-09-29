import { requireUser } from "@/lib/auth";
import { getUserPlan } from "@/lib/entitlements";
import { PlanCards } from "@/components/pricing/plan-cards";
import { PLAN_LIMITS } from "@/lib/plans";

export default async function PremiumPage() {
    const user = await requireUser();
    const plan = await getUserPlan(user.id);
    const isPro = plan.tier === "pro";

    return (
        <div className="space-y-6">
            <section className="rounded-[28px] border border-border bg-card p-6 shadow-sm md:p-8">
                <p className="text-sm text-muted-foreground">Filego Pro</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                    {isPro ? "You’re on Pro" : "Upgrade to Pro"}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                    {isPro
                        ? plan.isLifetime
                            ? "Thanks for supporting Filego. Your lifetime Pro access never expires."
                            : `Thanks for supporting Filego. Your Pro access runs until ${plan.expiresAt?.toLocaleDateString("en-IN", { dateStyle: "long" })}.`
                        : `No ads, bigger files, unlimited batches and ${PLAN_LIMITS.pro.aiDaily} AI generations a day. Pay once for a month or a year, with no auto-renew.`}
                </p>
            </section>

            <PlanCards
                tier={plan.tier}
                expiresAt={plan.expiresAt}
                isLifetime={plan.isLifetime}
                callbackUrl="/dashboard/premium"
            />
        </div>
    );
}
