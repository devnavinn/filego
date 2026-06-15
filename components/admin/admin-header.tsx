// components/admin/admin-header.tsx
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bell, Search } from "lucide-react";

interface AdminHeaderProps {
    title: string;
    subtitle?: string;
    adminName?: string | null;
    adminEmail?: string | null;
}

export function AdminHeader({
    title,
    subtitle,
    adminName,
    adminEmail,
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

                <div className="hidden w-full max-w-sm lg:block">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search blog, contacts, subscribers..."
                            className="pl-9"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="rounded-xl">
                        <Bell className="size-4" />
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