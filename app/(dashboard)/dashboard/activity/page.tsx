import Link from "next/link";
import Form from "next/form";
import { Search } from "lucide-react";
import { requireUser } from "@/lib/auth";
import {
    ACTIVITY_PAGE_SIZE,
    ACTIVITY_STATUSES,
    getActivityPage,
    type ActivityStatus,
} from "@/lib/dashboard";
import { cn } from "@/lib/utils";
import { RecentJobsTable } from "@/components/dashboard/recent-jobs-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function first(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
}

function activityHref(params: { q: string; status: ActivityStatus | null; page?: number }) {
    const search = new URLSearchParams();
    if (params.q) search.set("q", params.q);
    if (params.status) search.set("status", params.status);
    if (params.page && params.page > 1) search.set("page", String(params.page));
    const query = search.toString();
    return query ? `/dashboard/activity?${query}` : "/dashboard/activity";
}

export default async function ActivityPage({ searchParams }: { searchParams: SearchParams }) {
    const user = await requireUser();
    const params = await searchParams;

    const q = (first(params.q) ?? "").slice(0, 64);
    const statusParam = first(params.status);
    const status = ACTIVITY_STATUSES.find((value) => value === statusParam) ?? null;
    const page = Math.max(1, Number.parseInt(first(params.page) ?? "1", 10) || 1);

    const { jobs, total, pageCount } = await getActivityPage(user.id, { page, status, query: q });

    const filters: Array<{ label: string; value: ActivityStatus | null }> = [
        { label: "All", value: null },
        { label: "Completed", value: "COMPLETED" },
        { label: "Failed", value: "FAILED" },
    ];

    const firstShown = total === 0 ? 0 : (page - 1) * ACTIVITY_PAGE_SIZE + 1;
    const lastShown = Math.min(total, page * ACTIVITY_PAGE_SIZE);

    return (
        <div className="space-y-6">
            <section className="rounded-[28px] border border-border bg-card p-6 shadow-sm md:p-8">
                <p className="text-sm text-muted-foreground">Activity</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                    Processing history
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Every job you’ve run while signed in, with output sizes and savings.
                </p>
            </section>

            <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                    {filters.map((filter) => (
                        <Link
                            key={filter.label}
                            href={activityHref({ q, status: filter.value })}
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

                <Form action="/dashboard/activity" className="relative w-full sm:w-72" role="search">
                    {status ? <input type="hidden" name="status" value={status} /> : null}
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        name="q"
                        type="search"
                        defaultValue={q}
                        aria-label="Search activity"
                        placeholder="Search by tool or format..."
                        className="h-10 rounded-xl bg-card pl-9"
                    />
                </Form>
            </section>

            <RecentJobsTable
                jobs={jobs}
                title={total > 0 ? `Showing ${firstShown}–${lastShown} of ${total}` : "Jobs"}
                emptyMessage={q || status ? "No jobs match these filters." : "No processing history yet."}
            />

            {pageCount > 1 ? (
                <nav className="flex items-center justify-between" aria-label="Pagination">
                    <Button asChild={page > 1} variant="outline" disabled={page <= 1} className="rounded-xl">
                        {page > 1 ? <Link href={activityHref({ q, status, page: page - 1 })}>Previous</Link> : <span>Previous</span>}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {page} of {pageCount}
                    </span>
                    <Button asChild={page < pageCount} variant="outline" disabled={page >= pageCount} className="rounded-xl">
                        {page < pageCount ? <Link href={activityHref({ q, status, page: page + 1 })}>Next</Link> : <span>Next</span>}
                    </Button>
                </nav>
            ) : null}
        </div>
    );
}
