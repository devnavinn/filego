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
import { MailPlus, Globe, CalendarDays, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminActionButton } from "@/components/admin/admin-action-button";
import { deleteSubscriber } from "../actions";

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
                    <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
                        <TableSearch placeholder="Search email, source, or page..." />
                        <Button asChild variant="outline" className="rounded-xl">
                            {/* A plain anchor: the route returns a file download, not a page. */}
                            <a href="/api/admin/subscribers/export" download>
                                <Download className="mr-2 size-4" />
                                Export CSV
                            </a>
                        </Button>
                    </div>
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
                                    <AdminActionButton
                                        action={deleteSubscriber}
                                        fields={{ id: item.id }}
                                        confirm={`Remove ${item.email} from the list?`}
                                        variant="ghost"
                                        className="rounded-xl text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="size-4" />
                                        <span className="sr-only">Remove subscriber</span>
                                    </AdminActionButton>
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
                                        {item.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}
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