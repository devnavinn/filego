// app/admin/page.tsx
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { formatPaise, getAdminOverview, passName } from "@/lib/admin";
import { Crown, IndianRupee, Inbox, Mail, Users, Wrench } from "lucide-react";
import { DashboardKpiCards } from "@/components/admin/dashboard-kpi-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const dateFormat = { dateStyle: "medium", timeZone: "Asia/Kolkata" } as const;

function SectionCard({
    title,
    href,
    empty,
    children,
}: {
    title: string;
    href: string;
    empty: string | null;
    children: React.ReactNode;
}) {
    return (
        <Card className="rounded-3xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-semibold">{title}</CardTitle>
                <Link href={href} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                    View all
                </Link>
            </CardHeader>
            <CardContent>
                {empty ? (
                    <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-sm text-muted-foreground">{empty}</div>
                ) : (
                    <ul className="divide-y">{children}</ul>
                )}
            </CardContent>
        </Card>
    );
}

export default async function AdminPage() {
    const session = await requireAdmin();
    const data = await getAdminOverview();

    const kpis = [
        {
            title: "Users",
            value: data.userCount.toLocaleString("en-IN"),
            description: `${data.newUsers7d} joined in the last 7 days`,
            trendLabel: data.newUsers7d > 0 ? `+${data.newUsers7d} this week` : "No new signups this week",
            trendDirection: data.newUsers7d > 0 ? ("up" as const) : ("neutral" as const),
            href: "/admin/users",
            icon: Users,
        },
        {
            title: "Active Pro users",
            value: data.proUserCount.toLocaleString("en-IN"),
            description: "Accounts with Pro access right now",
            trendLabel: "Paid and granted passes",
            trendDirection: "neutral" as const,
            href: "/admin/payments?filter=active",
            icon: Crown,
        },
        {
            title: "Revenue (30 days)",
            value: formatPaise(data.revenue30d.amount),
            description: `${data.revenue30d.count} passes · ${formatPaise(data.revenueAll.amount)} all time`,
            trendLabel: `${data.revenueAll.count} paid passes total`,
            trendDirection: "neutral" as const,
            href: "/admin/payments",
            icon: IndianRupee,
        },
        {
            title: "New messages",
            value: data.newContactCount,
            description: "Contact submissions waiting for review",
            trendLabel: data.newContactCount > 0 ? "Needs attention" : "Inbox clear",
            trendDirection: data.newContactCount > 0 ? ("up" as const) : ("neutral" as const),
            href: "/admin/contact?status=NEW",
            icon: Inbox,
        },
        {
            title: "Jobs (30 days)",
            value: data.jobs30d.toLocaleString("en-IN"),
            description: "Completed tool runs by signed-in users",
            icon: Wrench,
        },
        {
            title: "Subscribers",
            value: data.subscriberCount.toLocaleString("en-IN"),
            description: `Waitlist and newsletter signups · ${data.publishedPosts} blog posts live`,
            href: "/admin/subscribers",
            icon: Mail,
        },
    ];

    return (
        <main className="space-y-6">
            <section className="rounded-3xl border bg-background p-6 shadow-sm">
                <p className="text-sm text-muted-foreground">Overview</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                    Welcome back, {session.name || session.email}
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    Signups, revenue, tool usage and messages across Filego.
                </p>
            </section>

            <DashboardKpiCards items={kpis} />

            <div className="grid gap-6 xl:grid-cols-2">
                <SectionCard
                    title="Recent payments"
                    href="/admin/payments"
                    empty={data.recentPayments.length ? null : "No paid passes yet."}
                >
                    {data.recentPayments.map((payment) => (
                        <li key={payment.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                            <div className="min-w-0">
                                <p className="truncate font-medium text-foreground">{payment.user.email}</p>
                                <p className="text-xs text-muted-foreground">
                                    {passName(payment)} · {payment.purchasedAt?.toLocaleDateString("en-IN", dateFormat) ?? "—"}
                                </p>
                            </div>
                            <span className="shrink-0 font-semibold text-foreground">
                                {formatPaise(payment.amount, payment.currency ?? "INR")}
                            </span>
                        </li>
                    ))}
                </SectionCard>

                <SectionCard
                    title="New messages"
                    href="/admin/contact?status=NEW"
                    empty={data.recentMessages.length ? null : "No unread messages."}
                >
                    {data.recentMessages.map((message) => (
                        <li key={message.id} className="py-3 text-sm">
                            <div className="flex items-center justify-between gap-4">
                                <p className="truncate font-medium text-foreground">
                                    {message.name}
                                    {message.subject ? <span className="font-normal text-muted-foreground"> · {message.subject}</span> : null}
                                </p>
                                <span className="shrink-0 text-xs text-muted-foreground">
                                    {message.createdAt.toLocaleDateString("en-IN", dateFormat)}
                                </span>
                            </div>
                            <p className="mt-1 line-clamp-1 text-muted-foreground">{message.message}</p>
                        </li>
                    ))}
                </SectionCard>

                <SectionCard
                    title="Newest users"
                    href="/admin/users"
                    empty={data.recentUsers.length ? null : "No users yet."}
                >
                    {data.recentUsers.map((user) => (
                        <li key={user.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                            <div className="min-w-0">
                                <p className="truncate font-medium text-foreground">{user.name || "Unnamed user"}</p>
                                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                            </div>
                            <span className="shrink-0 text-xs text-muted-foreground">
                                {user.createdAt.toLocaleDateString("en-IN", dateFormat)}
                            </span>
                        </li>
                    ))}
                </SectionCard>

                <Card className="rounded-3xl shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Top tools (30 days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {data.topTools.length === 0 ? (
                            <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-sm text-muted-foreground">
                                Tool usage from signed-in users will appear here.
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {data.topTools.map((tool) => (
                                    <li key={tool.tool} className="text-sm">
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="truncate font-medium text-foreground">{tool.tool}</span>
                                            <span className="shrink-0 text-muted-foreground">
                                                {tool.jobs} jobs · {tool.users} {tool.users === 1 ? "user" : "users"}
                                            </span>
                                        </div>
                                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                                            <div
                                                className="h-full rounded-full bg-primary"
                                                style={{ width: `${(tool.jobs / data.topTools[0].jobs) * 100}%` }}
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
