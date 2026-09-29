// app/admin/users/page.tsx
import { BillingStatus, PlanType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { TableSearch } from "@/components/admin/table-search";
import { TablePagination } from "@/components/admin/table-pagination";
import { AdminActionButton } from "@/components/admin/admin-action-button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, User2, CalendarDays, Mail, Crown, Activity } from "lucide-react";
import { grantPro, setUserRole } from "../actions";

const TAKE = 12;

const dateFormat = { dateStyle: "medium", timeZone: "Asia/Kolkata" } as const;

export default async function AdminUsersPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; page?: string }>;
}) {
    const admin = await requireAdmin();

    const params = await searchParams;
    const q = params.q?.trim() ?? "";
    const page = Math.max(1, Number(params.page) || 1);
    const skip = (page - 1) * TAKE;

    const orConditions: Prisma.UserWhereInput[] = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
    ];

    if (q.toUpperCase() === "ADMIN" || q.toUpperCase() === "USER") {
        orConditions.push({ role: q.toUpperCase() as "ADMIN" | "USER" });
    }

    const where: Prisma.UserWhereInput = q ? { OR: orConditions } : {};

    const [rows, total] = await Promise.all([
        prisma.user.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: TAKE,
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                emailVerified: true,
                createdAt: true,
                accounts: { select: { provider: true } },
                usageSummary: { select: { totalJobs: true, lastActivityAt: true } },
            },
        }),
        prisma.user.count({ where }),
    ]);

    // Current Pro access for the users on this page, in one query.
    const now = new Date();
    const proRows = await prisma.subscription.findMany({
        where: {
            userId: { in: rows.map((user) => user.id) },
            billingStatus: BillingStatus.ACTIVE,
            OR: [{ planType: PlanType.LIFETIME }, { planType: PlanType.PRO, expiresAt: { gt: now } }],
        },
        select: { userId: true, planType: true, expiresAt: true },
    });

    const proByUser = new Map<string, { lifetime: boolean; expiresAt: Date | null }>();
    for (const sub of proRows) {
        const current = proByUser.get(sub.userId);
        const lifetime = sub.planType === PlanType.LIFETIME || Boolean(current?.lifetime);
        const expiresAt =
            current?.expiresAt && sub.expiresAt && current.expiresAt > sub.expiresAt
                ? current.expiresAt
                : sub.expiresAt ?? current?.expiresAt ?? null;
        proByUser.set(sub.userId, { lifetime, expiresAt });
    }

    const totalPages = Math.max(1, Math.ceil(total / TAKE));

    return (
        <main className="space-y-6">
            <Card className="rounded-3xl shadow-sm">
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <CardTitle className="text-2xl tracking-tight">Users</CardTitle>
                        <CardDescription>
                            Review accounts, plans and activity. Change roles or grant Pro time.
                        </CardDescription>
                    </div>
                    <TableSearch placeholder="Search name, email, or role..." />
                </CardHeader>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {rows.length ? (
                    rows.map((user) => {
                        const pro = proByUser.get(user.id);
                        const providers = [...new Set(user.accounts.map((account) => account.provider))];
                        const isSelf = user.id === admin.id;

                        return (
                            <Card key={user.id} className="rounded-3xl shadow-sm">
                                <CardContent className="flex h-full flex-col p-6">
                                    <div className="flex items-start gap-4">
                                        <Avatar className="size-12 rounded-2xl">
                                            <AvatarImage src={user.image || ""} alt={user.name || user.email} />
                                            <AvatarFallback className="rounded-2xl">
                                                {(user.name || user.email).slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="truncate font-semibold">
                                                    {user.name || "Unnamed user"}
                                                </h3>
                                                <Badge
                                                    variant={user.role === "ADMIN" ? "default" : "secondary"}
                                                    className="rounded-full"
                                                >
                                                    <span className="inline-flex items-center gap-1">
                                                        {user.role === "ADMIN" ? <Shield className="size-3.5" /> : <User2 className="size-3.5" />}
                                                        {user.role}
                                                    </span>
                                                </Badge>
                                                {pro ? (
                                                    <Badge variant="secondary" className="rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400">
                                                        <Crown className="mr-1 size-3" />
                                                        Pro
                                                    </Badge>
                                                ) : null}
                                            </div>

                                            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-2 break-all">
                                                    <Mail className="size-4 shrink-0" />
                                                    {user.email}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <CalendarDays className="size-4 shrink-0" />
                                                    Joined {user.createdAt.toLocaleDateString("en-IN", dateFormat)}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Activity className="size-4 shrink-0" />
                                                    {user.usageSummary?.totalJobs ?? 0} jobs
                                                    {user.usageSummary?.lastActivityAt
                                                        ? ` · last ${user.usageSummary.lastActivityAt.toLocaleDateString("en-IN", dateFormat)}`
                                                        : ""}
                                                </div>
                                                <p className="text-xs">
                                                    {[
                                                        user.emailVerified ? "Verified" : "Unverified",
                                                        ...providers.map((p) => p.charAt(0).toUpperCase() + p.slice(1)),
                                                    ].join(" · ")}
                                                    {pro
                                                        ? ` · Pro ${pro.lifetime ? "lifetime" : `until ${pro.expiresAt?.toLocaleDateString("en-IN", dateFormat)}`}`
                                                        : ""}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
                                        {pro?.lifetime ? null : (
                                            <>
                                                <AdminActionButton
                                                    action={grantPro}
                                                    fields={{ userId: user.id, days: "30" }}
                                                    confirm={`Give ${user.email} 30 days of Pro for free?`}
                                                >
                                                    +30d Pro
                                                </AdminActionButton>
                                                <AdminActionButton
                                                    action={grantPro}
                                                    fields={{ userId: user.id, days: "365" }}
                                                    confirm={`Give ${user.email} 365 days of Pro for free?`}
                                                >
                                                    +1y Pro
                                                </AdminActionButton>
                                            </>
                                        )}
                                        {isSelf ? null : (
                                            <AdminActionButton
                                                action={setUserRole}
                                                fields={{ userId: user.id, role: user.role === "ADMIN" ? "USER" : "ADMIN" }}
                                                confirm={
                                                    user.role === "ADMIN"
                                                        ? `Remove admin access from ${user.email}?`
                                                        : `Give ${user.email} full admin access?`
                                                }
                                                variant="ghost"
                                            >
                                                {user.role === "ADMIN" ? "Remove admin" : "Make admin"}
                                            </AdminActionButton>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                ) : (
                    <Card className="rounded-3xl border-dashed md:col-span-2 xl:col-span-3">
                        <CardContent className="p-10 text-center text-sm text-muted-foreground">
                            No users found.
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-muted-foreground">
                    Showing {rows.length} of {total} users
                </p>
                <TablePagination page={page} totalPages={totalPages} searchParams={{ q }} />
            </div>
        </main>
    );
}
