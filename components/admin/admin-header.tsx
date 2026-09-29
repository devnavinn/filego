// components/admin/admin-header.tsx
import Link from "next/link";
import Form from "next/form";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Inbox, Search } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

interface AdminHeaderProps {
    title: string;
    subtitle?: string;
    adminName?: string | null;
    adminEmail?: string | null;
    newMessageCount: number;
}

export function AdminHeader({
    title,
    subtitle,
    adminName,
    adminEmail,
    newMessageCount,
}: AdminHeaderProps) {
    return (
        <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-xl">
            <div className="flex h-16 items-center gap-3 px-4 md:px-6">
                <div className="flex items-center gap-2">
                    <SidebarTrigger />
                    <div className="hidden h-6 w-px bg-border md:block" />
                </div>

                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-base font-semibold tracking-tight md:text-lg">
                        {title}
                    </h1>
                    {subtitle ? (
                        <p className="hidden text-sm text-muted-foreground md:block">
                            {subtitle}
                        </p>
                    ) : null}
                </div>

                <Form action="/admin/users" className="hidden w-full max-w-sm lg:block" role="search">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            name="q"
                            type="search"
                            aria-label="Search users"
                            placeholder="Search users by name or email..."
                            className="pl-9"
                        />
                    </div>
                </Form>

                <div className="flex items-center gap-2">
                    <ModeToggle />

                    <Button asChild variant="outline" size="icon" className="relative rounded-xl">
                        <Link
                            href="/admin/contact?status=NEW"
                            aria-label={newMessageCount > 0 ? `${newMessageCount} new messages` : "Messages"}
                        >
                            <Inbox className="size-4" />
                            {newMessageCount > 0 ? (
                                <span className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-5 text-primary-foreground">
                                    {newMessageCount > 99 ? "99+" : newMessageCount}
                                </span>
                            ) : null}
                        </Link>
                    </Button>

                    <div className="hidden rounded-2xl border bg-muted/40 px-3 py-2 text-right sm:block">
                        <p className="max-w-[160px] truncate text-sm font-medium">
                            {adminName || "Admin"}
                        </p>
                        <p className="max-w-[160px] truncate text-xs text-muted-foreground">
                            {adminEmail}
                        </p>
                    </div>
                </div>
            </div>
        </header>
    );
}
