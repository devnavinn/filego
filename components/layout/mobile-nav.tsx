import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { LayoutDashboard, LogOut, Menu, Settings, User } from "lucide-react";

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
import { getAvatarUrl, mobileLinks } from "./navbar-data";

type MobileNavProps = {
    status: "loading" | "authenticated" | "unauthenticated";
    user?: {
        name?: string | null;
        email?: string | null;
    };
};

export function MobileNav({ user }: MobileNavProps) {
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

                <SheetContent side="right" className="w-[320px] p-0">
                    <SheetHeader className="sr-only">
                        <SheetTitle>Navigation menu</SheetTitle>
                        <SheetDescription>
                            Browse Filego tools, account links, and navigation items.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex h-full flex-col">
                        {user ? (
                            <div className="border-b px-5 py-4">
                                <div className="flex items-center gap-3">
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

                                <div className="mt-4 space-y-1">
                                    <SheetClose asChild>
                                        <Link
                                            href="/dashboard"
                                            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                                        >
                                            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                                            Dashboard
                                        </Link>
                                    </SheetClose>

                                    <SheetClose asChild>
                                        <Link
                                            href="/profile"
                                            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                                        >
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            Profile
                                        </Link>
                                    </SheetClose>

                                    <SheetClose asChild>
                                        <Link
                                            href="/settings"
                                            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                                        >
                                            <Settings className="h-4 w-4 text-muted-foreground" />
                                            Settings
                                        </Link>
                                    </SheetClose>
                                </div>
                            </div>
                        ) : null}

                        <div className="flex-1 overflow-y-auto px-3 py-4">
                            <div className="space-y-1">
                                {mobileLinks.map((item) => (
                                    <SheetClose asChild key={item.title}>
                                        <Link
                                            href={item.href}
                                            className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                                        >
                                            {item.title}
                                        </Link>
                                    </SheetClose>
                                ))}
                            </div>
                        </div>

                        {user ? (
                            <div className="border-t p-3">
                                <button
                                    onClick={() => signOut({ callbackUrl: "/" })}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Sign out
                                </button>
                            </div>
                        ) : (
                            <div className="border-t p-3 space-y-2">
                                <SheetClose asChild>
                                    <Button asChild variant="outline" className="w-full rounded-xl">
                                        <Link href="/login">Sign in</Link>
                                    </Button>
                                </SheetClose>

                                <SheetClose asChild>
                                    <Button asChild className="w-full rounded-xl">
                                        <Link href="/bulk-image-compress">Start free</Link>
                                    </Button>
                                </SheetClose>
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}