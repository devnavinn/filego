import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
    ArrowRight,
    LayoutDashboard,
    LogOut,
    Settings,
    User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAvatarUrl } from "./navbar-data";

type UserMenuProps = {
    status: "loading" | "authenticated" | "unauthenticated";
    user?: {
        name?: string | null;
        email?: string | null;
    };
};

export function UserMenu({ status, user }: UserMenuProps) {
    const userName = user?.name || "User";
    const userEmail = user?.email || "user";
    const avatarSeed = user?.email || user?.name || "guest-user";
    const avatarUrl = getAvatarUrl(avatarSeed);

    return (
        <div className="hidden items-center gap-2 md:flex">
            {status === "loading" ? (
                <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
            ) : user ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className="flex items-center gap-3 rounded-full border border-border bg-background p-1 pl-1 pr-3 transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                            aria-label="Open profile menu"
                        >
                            <Image
                                src={avatarUrl}
                                alt={userName}
                                width={32}
                                height={32}
                                className="h-8 w-8 rounded-full border object-cover"
                                unoptimized
                            />
                            <div className="flex flex-col text-left leading-none">
                                <span className="max-w-[140px] truncate text-sm font-medium text-foreground">
                                    {userName}
                                </span>
                                <span className="max-w-[140px] truncate text-xs text-muted-foreground">
                                    {userEmail}
                                </span>
                            </div>
                        </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-64 rounded-xl">
                        <DropdownMenuLabel className="pb-2">
                            <div className="flex flex-col">
                                <span className="truncate text-sm font-medium">{userName}</span>
                                <span className="truncate text-xs text-muted-foreground">
                                    {userEmail}
                                </span>
                            </div>
                        </DropdownMenuLabel>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem asChild>
                            <Link href="/dashboard" className="flex cursor-pointer items-center">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                Dashboard
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/settings" className="flex cursor-pointer items-center">
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="cursor-pointer text-red-600 focus:text-red-600"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <>
                    <Button asChild variant="ghost">
                        <Link href="/login">Sign in</Link>
                    </Button>

                    <Button asChild className="rounded-xl">
                        <Link href="/bulk-image-compress">
                            Start free
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </>
            )}
        </div>
    );
}