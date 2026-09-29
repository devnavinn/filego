import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getUserPlan } from "@/lib/entitlements";
import { PlanCards } from "@/components/pricing/plan-cards";
import { PLAN_LIMITS } from "@/lib/plans";
import { getBillingHistory } from "@/lib/dashboard";
import { formatDateSafe } from "@/lib/dashboard-formatters";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_STYLES: Record<string, string> = {
    ACTIVE: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    EXPIRED: "bg-muted text-muted-foreground",
    REFUNDED: "bg-red-500/10 text-red-700 dark:text-red-400",
};

function passName(payment: { planType: string; billingPeriod: string | null }) {
    if (payment.planType === "LIFETIME") return "Pro Lifetime";
    if (payment.billingPeriod === "YEARLY") return "Pro Yearly";
    if (payment.billingPeriod === "MONTHLY") return "Pro Monthly";
    return "Filego Pro";
}

function formatAmount(amount: number | null, currency: string | null) {
    if (amount == null) return "—";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: currency ?? "INR", maximumFractionDigits: 0 }).format(amount / 100);
}

export default async function PremiumPage() {
    const user = await requireUser();
    const [plan, payments] = await Promise.all([getUserPlan(user.id), getBillingHistory(user.id)]);
    const now = new Date();
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

            <Card className="rounded-3xl border border-border bg-card shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base font-semibold text-foreground">Billing history</CardTitle>
                </CardHeader>
                <CardContent>
                    {payments.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-sm text-muted-foreground">
                            Pro passes you buy will be listed here.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[640px] text-sm">
                                <thead>
                                    <tr className="border-b border-border text-left">
                                        <th className="pb-3 font-medium text-muted-foreground">Pass</th>
                                        <th className="pb-3 font-medium text-muted-foreground">Amount</th>
                                        <th className="pb-3 font-medium text-muted-foreground">Purchased</th>
                                        <th className="pb-3 font-medium text-muted-foreground">Valid</th>
                                        <th className="pb-3 font-medium text-muted-foreground">Status</th>
                                        <th className="pb-3 font-medium text-muted-foreground">Payment ID</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((payment) => {
                                        // Rows stay ACTIVE after their window ends; show those as expired.
                                        const lapsed =
                                            payment.billingStatus === "ACTIVE" &&
                                            payment.expiresAt !== null &&
                                            payment.expiresAt <= now;
                                        const upcoming =
                                            payment.billingStatus === "ACTIVE" &&
                                            payment.startsAt !== null &&
                                            payment.startsAt > now;
                                        const status = lapsed ? "EXPIRED" : payment.billingStatus;

                                        return (
                                            <tr key={payment.id} className="border-b border-border/60 last:border-0">
                                                <td className="py-4 font-medium text-foreground">{passName(payment)}</td>
                                                <td className="py-4 text-muted-foreground">{formatAmount(payment.amount, payment.currency)}</td>
                                                <td className="py-4 text-muted-foreground">{formatDateSafe(payment.purchasedAt ?? payment.createdAt)}</td>
                                                <td className="py-4 text-muted-foreground">
                                                    {payment.planType === "LIFETIME"
                                                        ? "Forever"
                                                        : `${formatDateSafe(payment.startsAt)} – ${formatDateSafe(payment.expiresAt)}`}
                                                </td>
                                                <td className="py-4">
                                                    <Badge variant="secondary" className={STATUS_STYLES[status] ?? "bg-muted text-muted-foreground"}>
                                                        {upcoming ? "scheduled" : status.toLowerCase()}
                                                    </Badge>
                                                </td>
                                                <td className="py-4 font-mono text-xs text-muted-foreground">{payment.providerPaymentId ?? "—"}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <p className="mt-4 text-xs text-muted-foreground">
                        Questions about a payment?{" "}
                        <Link href="/contact" className="font-medium text-primary underline-offset-4 hover:underline">
                            Contact support
                        </Link>{" "}
                        with the payment ID.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
