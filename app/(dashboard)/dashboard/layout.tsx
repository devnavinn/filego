import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserPlan } from "@/lib/entitlements";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const sessionUser = await requireUser();

    // The JWT can outlive the account (e.g. after deletion), so read the user fresh.
    const [user, plan] = await Promise.all([
        prisma.user.findUnique({
            where: { id: sessionUser.id },
            select: { id: true, name: true, email: true, role: true },
        }),
        getUserPlan(sessionUser.id),
    ]);

    if (!user) {
        redirect("/api/auth/signout?callbackUrl=/login");
    }

    return (
        <DashboardShell user={user} isPro={plan.tier === "pro"}>
            {children}
        </DashboardShell>
    );
}
