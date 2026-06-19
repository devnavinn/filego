import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

type DashboardShellProps = {
    user: {
        id: string;
        name?: string | null;
        email?: string | null;
        role?: "USER" | "ADMIN";
    };
    children: React.ReactNode;
};

export function DashboardShell({ user, children }: DashboardShellProps) {
    return (
        <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
            <div className="flex min-h-screen w-full">
                <DashboardSidebar user={user} />

                <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden">
                    <DashboardHeader user={user} />

                    <main className="flex-1 min-w-0 px-4 py-4 pb-24 md:px-6 md:py-6 md:pb-6">
                        <div className="mx-auto w-full max-w-7xl min-w-0">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}