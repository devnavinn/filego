"use client";

import { Crown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "../mode-toggle";

type DashboardHeaderProps = {
    user: {
        id: string;
        name?: string | null;
        email?: string | null;
        role?: "USER" | "ADMIN";
    };
};

export function DashboardHeader({ user }: DashboardHeaderProps) {
    return (
        <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
                <div className="min-w-0">
                    <p className="text-sm font-semibold tracking-tight">Control center</p>
                    <p className="hidden text-sm text-muted-foreground sm:block">
                        Track jobs, savings, billing, and premium access.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search jobs, formats, tools..."
                            className="h-10 w-[280px] rounded-xl bg-card pl-9"
                        />
                    </div>

                    <ModeToggle />

                    <Button asChild className="rounded-xl">
                        <a href="/dashboard/premium">
                            <Crown className="mr-2 size-4" />
                            Upgrade
                        </a>
                    </Button>

                    <div className="hidden rounded-2xl border bg-card px-3 py-2 md:block">
                        <p className="text-sm font-medium">{user.name || "User"}</p>
                        <p className="max-w-[180px] truncate text-xs text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </div>
            </div>
        </header>
    );
}