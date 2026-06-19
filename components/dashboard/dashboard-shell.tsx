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
        <div className="h-screen overflow-hidden bg-background text-foreground">
            <div className="flex h-screen w-full overflow-hidden">
                <DashboardSidebar user={user} />

                <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                    <DashboardHeader user={user} />

                    <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 pb-24 md:px-6 md:py-6 md:pb-6">
                        <div className="mx-auto min-w-0 w-full max-w-7xl">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}