"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    FileText,
    MessageSquareText,
    MailPlus,
    Users,
    Settings,
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { FilegoLogo } from "@/components/filego-logo";

const items = [
    {
        label: "Overview",
        href: "/admin",
        icon: LayoutDashboard,
    },
    {
        label: "Blog",
        href: "/admin/blog",
        icon: FileText,
    },
    {
        label: "Contact us",
        href: "/admin/contact",
        icon: MessageSquareText,
    },
    {
        label: "Subscribers",
        href: "/admin/subscribers",
        icon: MailPlus,
    },
    {
        label: "Users",
        href: "/admin/users",
        icon: Users,
    },
];

export function AppSidebar() {
    const pathname = usePathname();

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="border-b px-3 py-3">
                <Link
                    href="/admin"
                    className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center"
                >
                    <div className="shrink-0">
                        <FilegoLogo className="w-7 h-7" />
                    </div>

                    <div className="grid flex-1 text-left group-data-[collapsible=icon]:hidden">
                        <span className="text-sm font-semibold leading-none">Filego</span>
                        <span className="text-xs text-muted-foreground">Admin dashboard</span>
                    </div>
                </Link>
            </SidebarHeader>

            <SidebarContent className="px-2 py-4">
                <SidebarGroup>
                    <SidebarGroupLabel>Management</SidebarGroupLabel>
                    <SidebarMenu>
                        {items.map((item) => {
                            const isActive =
                                pathname === item.href || pathname.startsWith(`${item.href}/`);
                            const Icon = item.icon;

                            return (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                                        <Link href={item.href}>
                                            <Icon className="size-4" />
                                            <span>{item.label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Settings">
                            <Link href="/admin/settings">
                                <Settings className="size-4" />
                                <span>Settings</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}