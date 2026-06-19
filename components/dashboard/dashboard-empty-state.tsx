import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardEmptyState() {
    return (
        <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center shadow-sm">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted">
                <Sparkles className="size-5 text-foreground" />
            </div>

            <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
                No jobs yet
            </h3>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Start using Filego tools to see compression history, storage savings,
                and premium insights here.
            </p>

            <Button asChild className="mt-5 rounded-xl">
                <Link href="/tools">Open tools</Link>
            </Button>
        </div>
    );
}