// app/admin/payments/page.tsx
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { formatPaise, getPaymentsPage, passName, PAYMENT_FILTERS, type PaymentFilter } from "@/lib/admin";
import { cn } from "@/lib/utils";
import { TableSearch } from "@/components/admin/table-search";
import { TablePagination } from "@/components/admin/table-pagination";
import { AdminActionButton } from "@/components/admin/admin-action-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { markPaymentRefunded } from "../actions";

const TAKE = 20;

const FILTER_LABELS: Record<PaymentFilter, string> = {
    active: "Active",
    expired: "Expired",
    refunded: "Refunded",
    granted: "Granted",
};

const STATUS_STYLES: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    scheduled: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
    expired: "bg-muted text-muted-foreground",
    refunded: "bg-red-500/10 text-red-700 dark:text-red-400",
};

const dateFormat = { dateStyle: "medium", timeZone: "Asia/Kolkata" } as const;

function filterHref(q: string, filter: PaymentFilter | null) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (filter) params.set("filter", filter);
    const query = params.toString();
    return query ? `/admin/payments?${query}` : "/admin/payments";
}

export default async function AdminPaymentsPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; page?: string; filter?: string }>;
}) {
    await requireAdmin();

    const params = await searchParams;
    const q = params.q?.trim() ?? "";
    const page = Math.max(1, Number(params.page) || 1);
    const filter = PAYMENT_FILTERS.find((value) => value === params.filter) ?? null;

    const { rows, total, now } = await getPaymentsPage({ page, take: TAKE, filter, query: q });
    const totalPages = Math.max(1, Math.ceil(total / TAKE));

    return (
        <main className="space-y-6">
            <Card className="rounded-3xl shadow-sm">
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <CardTitle className="text-2xl tracking-tight">Payments</CardTitle>
                        <CardDescription>
                            Pro passes bought through Razorpay and passes granted by admins.
                        </CardDescription>
                    </div>
                    <TableSearch placeholder="Search email, payment or order ID..." />
                </CardHeader>
            </Card>

            <div className="flex flex-wrap gap-2">
                {[null, ...PAYMENT_FILTERS].map((value) => (
                    <Link
                        key={value ?? "all"}
                        href={filterHref(q, value)}
                        className={cn(
                            "rounded-full border px-3 py-1.5 text-sm transition-colors",
                            filter === value
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                    >
                        {value ? FILTER_LABELS[value] : "All"}
                    </Link>
                ))}
            </div>

            <Card className="rounded-3xl shadow-sm">
                <CardContent className="p-0">
                    {rows.length === 0 ? (
                        <div className="p-10 text-center text-sm text-muted-foreground">No payments found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="px-6 py-4 font-medium text-muted-foreground">User</th>
                                        <th className="px-3 py-4 font-medium text-muted-foreground">Pass</th>
                                        <th className="px-3 py-4 font-medium text-muted-foreground">Amount</th>
                                        <th className="px-3 py-4 font-medium text-muted-foreground">Purchased</th>
                                        <th className="px-3 py-4 font-medium text-muted-foreground">Valid</th>
                                        <th className="px-3 py-4 font-medium text-muted-foreground">Status</th>
                                        <th className="px-3 py-4 font-medium text-muted-foreground">Payment ID</th>
                                        <th className="px-6 py-4" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => {
                                        const isLifetime = row.planType === "LIFETIME";
                                        const status =
                                            row.billingStatus === "REFUNDED"
                                                ? "refunded"
                                                : !isLifetime && row.expiresAt && row.expiresAt <= now
                                                    ? "expired"
                                                    : row.startsAt && row.startsAt > now
                                                        ? "scheduled"
                                                        : "active";
                                        const isGrant = row.provider === "ADMIN";

                                        return (
                                            <tr key={row.id} className="border-b last:border-0">
                                                <td className="px-6 py-4">
                                                    <Link
                                                        href={`/admin/users?q=${encodeURIComponent(row.user.email)}`}
                                                        className="font-medium text-foreground underline-offset-4 hover:underline"
                                                    >
                                                        {row.user.email}
                                                    </Link>
                                                    {row.user.name ? (
                                                        <p className="text-xs text-muted-foreground">{row.user.name}</p>
                                                    ) : null}
                                                </td>
                                                <td className="px-3 py-4 text-foreground">{passName(row)}</td>
                                                <td className="px-3 py-4 text-foreground">{formatPaise(row.amount, row.currency ?? "INR")}</td>
                                                <td className="px-3 py-4 text-muted-foreground">
                                                    {(row.purchasedAt ?? row.createdAt).toLocaleDateString("en-IN", dateFormat)}
                                                </td>
                                                <td className="px-3 py-4 text-muted-foreground">
                                                    {isLifetime
                                                        ? "Forever"
                                                        : `${row.startsAt?.toLocaleDateString("en-IN", dateFormat) ?? "—"} – ${row.expiresAt?.toLocaleDateString("en-IN", dateFormat) ?? "—"}`}
                                                </td>
                                                <td className="px-3 py-4">
                                                    <Badge variant="secondary" className={cn("rounded-full", STATUS_STYLES[status])}>
                                                        {status}
                                                    </Badge>
                                                </td>
                                                <td className="px-3 py-4 font-mono text-xs text-muted-foreground">
                                                    {row.providerPaymentId ?? "—"}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {row.billingStatus === "ACTIVE" && status !== "expired" ? (
                                                        <AdminActionButton
                                                            action={markPaymentRefunded}
                                                            fields={{ subscriptionId: row.id }}
                                                            confirm={
                                                                isGrant
                                                                    ? `Revoke this granted pass for ${row.user.email}?`
                                                                    : `Mark this payment by ${row.user.email} as refunded? This ends the Pro time it paid for. Issue the refund itself in the Razorpay dashboard.`
                                                            }
                                                            variant="ghost"
                                                            className="rounded-xl text-destructive hover:text-destructive"
                                                        >
                                                            {isGrant ? "Revoke" : "Mark refunded"}
                                                        </AdminActionButton>
                                                    ) : null}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-muted-foreground">
                    Showing {rows.length} of {total} payments
                </p>
                <TablePagination page={page} totalPages={totalPages} searchParams={{ q, filter: filter ?? undefined }} />
            </div>
        </main>
    );
}
