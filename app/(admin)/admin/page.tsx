// app/admin/page.tsx
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FileText, Inbox, Mail, Users } from "lucide-react";
import { DashboardKpiCards } from "@/components/admin/dashboard-kpi-cards";

export default async function AdminPage() {
    const session = await requireAdmin();

    const [contactCount, newContactCount, subscriberCount, userCount] =
        await Promise.all([
            prisma.contactSubmission.count(),
            prisma.contactSubmission.count({ where: { status: "NEW" } }),
            prisma.waitlistSubscriber.count(),
            prisma.user.count(),
        ]);

    const kpis = [
        {
            title: "New messages",
            value: newContactCount,
            description: "Unread contact submissions waiting for review",
            trendLabel: "Needs attention",
            trendDirection: "up" as const,
            href: "/admin/contact",
            icon: Inbox,
        },
        {
            title: "Subscribers",
            value: subscriberCount,
            description: "People who joined your waitlist or newsletter",
            trendLabel: "Growing audience",
            trendDirection: "up" as const,
            href: "/admin/subscribers",
            icon: Mail,
        },
        {
            title: "Contacts",
            value: contactCount,
            description: "Total contact form submissions received",
            trendLabel: "All time records",
            trendDirection: "neutral" as const,
            href: "/admin/contact",
            icon: FileText,
        },
        {
            title: "Users",
            value: userCount,
            description: "Registered accounts in your platform",
            trendLabel: "Current user base",
            trendDirection: "neutral" as const,
            href: "/admin/users",
            icon: Users,
        },
    ];

    return (
        <main className="space-y-6">
            <section className="rounded-3xl border bg-background p-6 shadow-sm">
                <p className="text-sm text-muted-foreground">Overview</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                    Welcome back, {session.user.name || session.user.email}
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    Track submissions, monitor growth, and manage blog publishing from a single workspace.
                </p>
            </section>

            <DashboardKpiCards items={kpis} />
        </main>
    );
}