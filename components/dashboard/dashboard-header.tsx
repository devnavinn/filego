"use client";

import Image from "next/image";
import Link from "next/link";
import Form from "next/form";
import { signOut } from "next-auth/react";
import { Crown, Home, LogOut, Search, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAvatarUrl } from "@/components/layout/navbar-data";
import { ModeToggle } from "../mode-toggle";
import type { DashboardUser } from "./dashboard-shell";

type DashboardHeaderProps = {
    user: DashboardUser;
    isPro: boolean;
};

export function DashboardHeader({ user, isPro }: DashboardHeaderProps) {
    const userName = user.name || "User";

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
                    <Form action="/dashboard/tools" className="relative hidden md:block" role="search">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            name="q"
                            type="search"
                            aria-label="Search tools"
                            placeholder="Search tools..."
                            className="h-10 w-[240px] rounded-xl bg-card pl-9"
                        />
                    </Form>

                    <ModeToggle />

                    {isPro ? null : (
                        <Button asChild className="hidden rounded-xl sm:inline-flex">
                            <Link href="/dashboard/premium">
                                <Crown className="mr-2 size-4" />
                                Upgrade
                            </Link>
                        </Button>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="rounded-full border border-border p-0.5 transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                                aria-label="Open account menu"
                            >
                                <Image
                                    src={getAvatarUrl(user.email || userName)}
                                    alt={userName}
                                    width={32}
                                    height={32}
                                    className="size-8 rounded-full object-cover"
                                    unoptimized
                                />
                            </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-60 rounded-xl">
                            <DropdownMenuLabel className="pb-2">
                                <div className="flex flex-col">
                                    <span className="truncate text-sm font-medium">{userName}</span>
                                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                                    <span className="mt-1 text-xs font-medium text-muted-foreground">
                                        {isPro ? "Filego Pro" : "Free plan"}
                                    </span>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {isPro ? null : (
                                <DropdownMenuItem asChild className="sm:hidden">
                                    <Link href="/dashboard/premium" className="cursor-pointer">
                                        <Crown className="mr-2 size-4" />
                                        Upgrade to Pro
                                    </Link>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/settings" className="cursor-pointer">
                                    <Settings className="mr-2 size-4" />
                                    Settings
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/" className="cursor-pointer">
                                    <Home className="mr-2 size-4" />
                                    Back to Filego
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="cursor-pointer text-red-600 focus:text-red-600"
                            >
                                <LogOut className="mr-2 size-4" />
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
