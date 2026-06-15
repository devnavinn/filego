// app/admin/users/page.tsx
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { TableSearch } from "@/components/admin/table-search";
import { TablePagination } from "@/components/admin/table-pagination";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, User2, CalendarDays, Mail } from "lucide-react";

const TAKE = 12;

export default async function AdminUsersPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; page?: string }>;
}) {
    await requireAdmin();

    const params = await searchParams;
    const q = params.q?.trim() ?? "";
    const page = Math.max(1, Number(params.page) || 1);
    const skip = (page - 1) * TAKE;

    const orConditions: Array<Record<string, unknown>> = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
    ];

    if (q.toUpperCase() === "ADMIN" || q.toUpperCase() === "USER") {
        orConditions.push({ role: q.toUpperCase() });
    }

    const where = q ? { OR: orConditions } : {};

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
                createdAt: true,
            },
        }),
        prisma.user.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / TAKE));

    return (
        <main className="space-y-6">
            <Card className="rounded-3xl shadow-sm">
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <CardTitle className="text-2xl tracking-tight">Users</CardTitle>
                        <CardDescription>
                            View platform users and review role assignments.
                        </CardDescription>
                    </div>
                    <TableSearch placeholder="Search name, email, or role..." />
                </CardHeader>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {rows.length ? (
                    rows.map((user) => (
                        <Card key={user.id} className="rounded-3xl shadow-sm">
                            <CardContent className="p-6">
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
                                                {user.role === "ADMIN" ? (
                                                    <span className="inline-flex items-center gap-1">
                                                        <Shield className="size-3.5" />
                                                        ADMIN
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1">
                                                        <User2 className="size-3.5" />
                                                        USER
                                                    </span>
                                                )}
                                            </Badge>
                                        </div>

                                        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                                            <div className="inline-flex items-center gap-2 break-all">
                                                <Mail className="size-4" />
                                                {user.email}
                                            </div>
                                            <div className="inline-flex items-center gap-2">
                                                <CalendarDays className="size-4" />
                                                Joined {new Date(user.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
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