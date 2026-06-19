import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardEmptyState() {
    return (
        <div className="rounded-3xl border border-dashed border-zinc-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-zinc-100">
                <Sparkles className="size-5 text-zinc-700" />
            </div>

            <h3 className="mt-4 text-lg font-semibold tracking-tight text-zinc-950">
                No jobs yet
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-500">
                Start using Filego tools to see compression history, storage savings,
                and premium insights here.
            </p>

            <Button
                asChild
                className="mt-5 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800"
            >
                <Link href="/tools">Open tools</Link>
            </Button>
        </div>
    );
}