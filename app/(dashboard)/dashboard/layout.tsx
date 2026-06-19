import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await requireUser();

    if (!user?.id) {
        redirect("/login?callbackUrl=/dashboard");
    }

    return <DashboardShell user={user}>{children}</DashboardShell>;
}