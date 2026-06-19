"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BarChart3,
    Crown,
    History,
    LayoutDashboard,
    LogOut,
    Settings,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type DashboardSidebarProps = {
    user: {
        id: string;
        name?: string | null;
        email?: string | null;
        role?: "USER" | "ADMIN";
    };
};

const desktopNavItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Activity", href: "/dashboard/activity", icon: History },
    { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { label: "Premium", href: "/dashboard/premium", icon: Crown },
    { label: "Tools", href: "/dashboard/tools", icon: Sparkles },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const mobileNavItems = [
    { label: "Home", href: "/dashboard", icon: LayoutDashboard },
    { label: "Activity", href: "/dashboard/activity", icon: History },
    { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { label: "Tools", href: "/dashboard/tools", icon: Sparkles },
    { label: "Premium", href: "/dashboard/premium", icon: Crown },
];

export function DashboardSidebar({ user }: DashboardSidebarProps) {
    const pathname = usePathname();

    return (
        <>
            <aside className="hidden h-screen w-[260px] shrink-0 border-r border-border bg-card/80 backdrop-blur md:sticky md:top-0 md:flex md:flex-col">
                <div className="border-b border-border px-5 py-3">
                    <Link href="/dashboard" className="block">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm">
                                F
                            </div>

                            <div className="min-w-0">
                                <p className="text-sm font-semibold tracking-tight text-foreground">
                                    Filego
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    User dashboard
                                </p>
                            </div>
                        </div>
                    </Link>
                </div>

                <div className="flex-1 px-3 py-4">
                    <p className="px-3 pb-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        Workspace
                    </p>

                    <nav className="space-y-1">
                        {desktopNavItems.map((item) => {
                            const Icon = item.icon;
                            const active =
                                item.href === "/dashboard"
                                    ? pathname === item.href
                                    : pathname.startsWith(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                                        active
                                            ? "bg-accent font-medium text-accent-foreground"
                                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    )}
                                >
                                    <Icon className="size-4 shrink-0" />
                                    <span className="truncate">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="border-t border-border p-3">
                    <div className="rounded-2xl border border-border bg-background/70 p-3">
                        <p className="truncate text-sm font-medium text-foreground">
                            {user.name || "User"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                            {user.email}
                        </p>

                        <Button
                            variant="outline"
                            className="mt-3 w-full justify-start rounded-xl border-border bg-background hover:bg-accent hover:text-accent-foreground"
                            asChild
                        >
                            <Link href="/api/auth/signout">
                                <LogOut className="mr-2 size-4" />
                                Sign out
                            </Link>
                        </Button>
                    </div>
                </div>
            </aside>

            <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur md:hidden">
                <div className="grid h-16 grid-cols-5">
                    {mobileNavItems.map((item) => {
                        const Icon = item.icon;
                        const active =
                            item.href === "/dashboard"
                                ? pathname === item.href
                                : pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium transition-colors",
                                    active
                                        ? "text-primary"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon className="size-4 shrink-0" />
                                <span className="truncate">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}