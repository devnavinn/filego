// app/admin/contact/page.tsx
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
import { Mail, Phone, Building2, MessageSquareText } from "lucide-react";

const TAKE = 10;

export default async function AdminContactPage({
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
                { name: { contains: q, mode: "insensitive" as const } },
                { email: { contains: q, mode: "insensitive" as const } },
                { subject: { contains: q, mode: "insensitive" as const } },
                { message: { contains: q, mode: "insensitive" as const } },
                { company: { contains: q, mode: "insensitive" as const } },
                { phone: { contains: q, mode: "insensitive" as const } },
            ],
        }
        : {};

    const [rows, total] = await Promise.all([
        prisma.contactSubmission.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: TAKE,
        }),
        prisma.contactSubmission.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / TAKE));

    return (
        <main className="space-y-6">
            <Card className="rounded-3xl shadow-sm">
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <CardTitle className="text-2xl tracking-tight">Contact submissions</CardTitle>
                        <CardDescription>
                            Review messages from your contact form and track reply status.
                        </CardDescription>
                    </div>
                    <TableSearch placeholder="Search name, email, subject, message..." />
                </CardHeader>
            </Card>

            <div className="grid gap-4">
                {rows.length ? (
                    rows.map((item) => (
                        <Card key={item.id} className="rounded-3xl shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h3 className="text-lg font-semibold">{item.name}</h3>
                                            <Badge variant="secondary" className="rounded-full">
                                                {item.status}
                                            </Badge>
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                            <div className="inline-flex items-center gap-2">
                                                <Mail className="size-4" />
                                                {item.email}
                                            </div>

                                            {item.phone ? (
                                                <div className="inline-flex items-center gap-2">
                                                    <Phone className="size-4" />
                                                    {item.phone}
                                                </div>
                                            ) : null}

                                            {item.company ? (
                                                <div className="inline-flex items-center gap-2">
                                                    <Building2 className="size-4" />
                                                    {item.company}
                                                </div>
                                            ) : null}
                                        </div>

                                        {item.subject ? (
                                            <p className="text-sm font-medium text-foreground/80">
                                                Subject: {item.subject}
                                            </p>
                                        ) : null}

                                        <div className="rounded-2xl border bg-muted/30 p-4">
                                            <div className="mb-2 inline-flex items-center gap-2 text-sm font-medium">
                                                <MessageSquareText className="size-4" />
                                                Message
                                            </div>
                                            <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                                                {item.message}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="shrink-0 text-sm text-muted-foreground">
                                        {new Date(item.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card className="rounded-3xl border-dashed">
                        <CardContent className="p-10 text-center text-sm text-muted-foreground">
                            No contact submissions found.
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-muted-foreground">
                    Showing {rows.length} of {total} submissions
                </p>
                <TablePagination page={page} totalPages={totalPages} searchParams={{ q }} />
            </div>
        </main>
    );
}