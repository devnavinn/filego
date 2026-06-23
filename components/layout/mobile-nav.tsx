"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
    ArrowRight,
    LayoutDashboard,
    LogOut,
    Menu,
    Settings,
    User,
    Wrench,
    ShieldCheck,
    Sparkles,
    FileText,
    ImageIcon,
    Code2,
    FileSpreadsheet,
    Video,
    Music4,
    Archive
} from "lucide-react";
import { toolCategories } from "@/lib/tools-data";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { ModeToggle } from "@/components/mode-toggle";
import { getAvatarUrl, mobileLinks } from "./navbar-data";

type MobileNavProps = {
    status: "loading" | "authenticated" | "unauthenticated";
    user?: {
        name?: string | null;
        email?: string | null;
    };
};

const categoryIconMap = {
    "pdf-tools": FileText,
    "image-tools": ImageIcon,
    "document-office-tools": FileSpreadsheet,
    "video-tools": Video,
    "audio-tools": Music4,
    "security-tools": ShieldCheck,
    "archive-tools": Archive,
    "developer-tools": Code2,
    "ai-tools": Sparkles,
} as const;

const quickLinks = toolCategories.slice(0, 4).map((category) => ({
    title: category.title,
    href: `/tools/${category.slug}`,
    icon: categoryIconMap[
        category.slug as keyof typeof categoryIconMap
    ] ?? Sparkles,
}));

export function MobileNav({ status, user }: MobileNavProps) {
    const isAuthenticated = status === "authenticated" && !!user;

    const userName = user?.name || "User";
    const userEmail = user?.email || "user";
    const avatarSeed = user?.email || user?.name || "guest-user";
    const avatarUrl = getAvatarUrl(avatarSeed);

    return (
        <div className="md:hidden">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Open menu">
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>

                <SheetContent
                    side="right"
                    className="w-[340px] p-0 [&>button:first-of-type]:hidden"
                >
                    <SheetHeader className="sr-only">
                        <SheetTitle>Navigation menu</SheetTitle>
                        <SheetDescription>
                            Browse Filego tools, account links, and navigation items.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex h-full flex-col bg-background">
                        <div className="border-b px-5 py-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-foreground">Menu</p>
                                    <p className="text-xs text-muted-foreground">
                                        Tools, account, and appearance
                                    </p>
                                </div>
                                <ModeToggle />
                            </div>
                        </div>

                        {isAuthenticated ? (
                            <div className="border-b px-5 py-4">
                                <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/70 p-3">
                                    <Image
                                        src={avatarUrl}
                                        alt={userName}
                                        width={44}
                                        height={44}
                                        className="h-11 w-11 rounded-full border object-cover"
                                        unoptimized
                                    />
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-foreground">
                                            {userName}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {userEmail}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-2">
                                    <SheetClose asChild>
                                        <Link
                                            href="/dashboard"
                                            className="flex items-center justify-between rounded-xl border border-border/60 bg-background px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
                                        >
                                            <span className="inline-flex items-center gap-2">
                                                <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                                                Dashboard
                                            </span>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        </Link>
                                    </SheetClose>

                                    <SheetClose asChild>
                                        <Link
                                            href="/dashboard/settings"
                                            className="flex items-center justify-between rounded-xl border border-border/60 bg-background px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
                                        >
                                            <span className="inline-flex items-center gap-2">
                                                <Settings className="h-4 w-4 text-muted-foreground" />
                                                Settings
                                            </span>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        </Link>
                                    </SheetClose>
                                </div>
                            </div>
                        ) : (
                            <div className="border-b px-5 py-4">
                                <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-muted">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">
                                                Welcome to Filego
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Sign in to access your dashboard and saved workflows
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-2">
                                        <SheetClose asChild>
                                            <Button asChild variant="outline" className="w-full rounded-xl">
                                                <Link href="/login">Sign in</Link>
                                            </Button>
                                        </SheetClose>

                                        <SheetClose asChild>
                                            <Button asChild className="w-full rounded-xl">
                                                <Link href="/bulk-image-compressor/editor">Start free</Link>
                                            </Button>
                                        </SheetClose>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="border-b px-5 py-4">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                Quick access
                            </p>

                            <div className="grid gap-2">
                                {quickLinks.map((item) => {
                                    const Icon = item.icon;

                                    return (
                                        <SheetClose asChild key={item.title}>
                                            <Link
                                                href={item.href}
                                                className="flex items-center justify-between rounded-xl border border-border/60 bg-card/70 px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
                                            >
                                                <span className="inline-flex items-center gap-2">
                                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                                    {item.title}
                                                </span>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                            </Link>
                                        </SheetClose>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-3 py-4">
                            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                Navigation
                            </p>

                            <div className="space-y-1">
                                {mobileLinks.map((item) => (
                                    <SheetClose asChild key={item.title}>
                                        <Link
                                            href={item.href}
                                            className="block rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                                        >
                                            {item.title}
                                        </Link>
                                    </SheetClose>
                                ))}
                            </div>
                        </div>

                        {isAuthenticated ? (
                            <div className="border-t p-3">
                                <button
                                    onClick={() => signOut({ callbackUrl: "/" })}
                                    className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                                >
                                    <span className="inline-flex items-center gap-2">
                                        <LogOut className="h-4 w-4" />
                                        Sign out
                                    </span>
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        ) : null}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}