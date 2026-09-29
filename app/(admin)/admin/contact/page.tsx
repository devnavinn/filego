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
import { Button } from "@/components/ui/button";
import { Mail, Phone, Building2, MessageSquareText, Reply, Trash2 } from "lucide-react";
import Link from "next/link";
import { ContactStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { AdminActionButton } from "@/components/admin/admin-action-button";
import { deleteContact, setContactStatus } from "../actions";

const STATUS_FILTERS: Array<{ label: string; value: ContactStatus | null }> = [
    { label: "All", value: null },
    { label: "New", value: "NEW" },
    { label: "Read", value: "READ" },
    { label: "Replied", value: "REPLIED" },
    { label: "Archived", value: "ARCHIVED" },
];

const STATUS_STYLES: Record<ContactStatus, string> = {
    NEW: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    READ: "bg-muted text-muted-foreground",
    REPLIED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    ARCHIVED: "bg-muted text-muted-foreground",
};

/** Status transitions offered on each message. */
const NEXT_STATUSES: Record<ContactStatus, Array<{ label: string; value: ContactStatus }>> = {
    NEW: [{ label: "Mark read", value: "READ" }, { label: "Mark replied", value: "REPLIED" }, { label: "Archive", value: "ARCHIVED" }],
    READ: [{ label: "Mark replied", value: "REPLIED" }, { label: "Archive", value: "ARCHIVED" }, { label: "Mark new", value: "NEW" }],
    REPLIED: [{ label: "Archive", value: "ARCHIVED" }, { label: "Mark new", value: "NEW" }],
    ARCHIVED: [{ label: "Restore", value: "READ" }],
};

function statusHref(q: string, status: ContactStatus | null) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    const query = params.toString();
    return query ? `/admin/contact?${query}` : "/admin/contact";
}

const TAKE = 10;

export default async function AdminContactPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; page?: string; status?: string }>;
}) {
    await requireAdmin();

    const params = await searchParams;
    const q = params.q?.trim() ?? "";
    const page = Math.max(1, Number(params.page) || 1);
    const skip = (page - 1) * TAKE;

    const status = STATUS_FILTERS.find((filter) => filter.value === params.status)?.value ?? null;

    const where = {
        ...(status ? { status } : {}),
        ...(q
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
        : {}),
    };

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

            <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map((filter) => (
                    <Link
                        key={filter.label}
                        href={statusHref(q, filter.value)}
                        className={cn(
                            "rounded-full border px-3 py-1.5 text-sm transition-colors",
                            status === filter.value
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                    >
                        {filter.label}
                    </Link>
                ))}
            </div>

            <div className="grid gap-4">
                {rows.length ? (
                    rows.map((item) => (
                        <Card key={item.id} className="rounded-3xl shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h3 className="text-lg font-semibold">{item.name}</h3>
                                            <Badge variant="secondary" className={cn("rounded-full", STATUS_STYLES[item.status])}>
                                                {item.status.toLowerCase()}
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

                                    <div className="flex shrink-0 flex-col gap-3 lg:items-end">
                                        <p className="text-sm text-muted-foreground">
                                            {item.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}
                                        </p>
                                        <div className="flex flex-wrap gap-2 lg:justify-end">
                                            <Button asChild size="sm" className="rounded-xl">
                                                <a href={`mailto:${item.email}?subject=${encodeURIComponent(`Re: ${item.subject || "Your message to Filego"}`)}`}>
                                                    <Reply className="mr-1.5 size-4" />
                                                    Reply
                                                </a>
                                            </Button>
                                            {NEXT_STATUSES[item.status].map((next) => (
                                                <AdminActionButton
                                                    key={next.value}
                                                    action={setContactStatus}
                                                    fields={{ id: item.id, status: next.value }}
                                                >
                                                    {next.label}
                                                </AdminActionButton>
                                            ))}
                                            <AdminActionButton
                                                action={deleteContact}
                                                fields={{ id: item.id }}
                                                confirm={`Delete the message from ${item.name}? This can’t be undone.`}
                                                variant="ghost"
                                                className="rounded-xl text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="size-4" />
                                                <span className="sr-only">Delete</span>
                                            </AdminActionButton>
                                        </div>
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
                <TablePagination page={page} totalPages={totalPages} searchParams={{ q, status: status ?? undefined }} />
            </div>
        </main>
    );
}