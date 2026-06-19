import { requireUser } from "@/lib/auth";
import { getDashboardOverview } from "@/lib/dashboard";
import { RecentJobsTable } from "@/components/dashboard/recent-jobs-table";

export default async function ActivityPage() {
    const user = await requireUser();
    const data = await getDashboardOverview(user.id);

    return (
        <div className="space-y-6">
            <section className="rounded-[28px] border border-border bg-card p-6 shadow-sm md:p-8">
                <p className="text-sm text-muted-foreground">Activity</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                    Processing history
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Review completed jobs, output savings, and recent tool usage.
                </p>
            </section>

            <RecentJobsTable jobs={data.recentJobs ?? []} />
        </div>
    );
}