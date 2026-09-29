// app/admin/layout.tsx
import React from "react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar";

export default async function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await requireAdmin();
    const newMessageCount = await prisma.contactSubmission.count({ where: { status: "NEW" } });

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <AdminHeader
                    title="Control center"
                    subtitle="Manage users, payments, content and messages."
                    adminName={session.name ?? ""}
                    adminEmail={session.email ?? ""}
                    newMessageCount={newMessageCount}
                />

                <div className="min-h-[calc(100vh-4rem)] bg-muted/30 px-4 py-6 md:px-6">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}