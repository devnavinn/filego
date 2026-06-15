// app/admin/subscribers/page.tsx
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
import { MailPlus, Globe, CalendarDays } from "lucide-react";

const TAKE = 12;

export default async function AdminSubscribersPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; page?: string }>;
}) {
    await requireAdmin();

    const params = await searchParams;
    const q = params.q?.trim() ?? "";
    const page = Math.max(1, Number(params.page) || 1);
    const skip = (page - 1) * TAKE;

    const where = q
        ? {
            OR: [
                { email: { contains: q, mode: "insensitive" as const } },
                { source: { contains: q, mode: "insensitive" as const } },
                { page: { contains: q, mode: "insensitive" as const } },
            ],
        }
        : {};

    const [rows, total] = await Promise.all([
        prisma.waitlistSubscriber.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: TAKE,
        }),
        prisma.waitlistSubscriber.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / TAKE));

    return (
        <main className="space-y-6">
            <Card className="rounded-3xl shadow-sm">
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <CardTitle className="text-2xl tracking-tight">Subscribers</CardTitle>
                        <CardDescription>
                            Browse waitlist and notification signups with source tracking.
                        </CardDescription>
                    </div>
                    <TableSearch placeholder="Search email, source, or page..." />
                </CardHeader>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {rows.length ? (
                    rows.map((item) => (
                        <Card key={item.id} className="rounded-3xl shadow-sm">
                            <CardContent className="space-y-4 p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                                        <MailPlus className="size-5" />
                                    </div>
                                    <Badge variant="secondary" className="rounded-full">
                                        Subscriber
                                    </Badge>
                                </div>

                                <div>
                                    <h3 className="break-all text-base font-semibold">{item.email}</h3>
                                </div>

                                <div className="space-y-2 text-sm text-muted-foreground">
                                    <div className="inline-flex items-center gap-2">
                                        <Globe className="size-4" />
                                        Source: {item.source || "—"}
                                    </div>
                                    <div className="inline-flex items-center gap-2">
                                        <CalendarDays className="size-4" />
                                        {new Date(item.createdAt).toLocaleString()}
                                    </div>
                                    <p className="truncate">Page: {item.page || "—"}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card className="rounded-3xl border-dashed md:col-span-2 xl:col-span-3">
                        <CardContent className="p-10 text-center text-sm text-muted-foreground">
                            No subscribers found.
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-muted-foreground">
                    Showing {rows.length} of {total} subscribers
                </p>
                <TablePagination page={page} totalPages={totalPages} searchParams={{ q }} />
            </div>
        </main>
    );
}