import Link from "next/link";
import Form from "next/form";
import { ArrowRight, History, Search } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getRecentToolSlugs } from "@/lib/dashboard";
import { findToolBySlug, getCategoryIcon, toolCategories, type SearchableTool } from "@/lib/tools-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function toolHref(categorySlug: string, toolSlug: string) {
    return `/tools/${categorySlug}/${toolSlug}`;
}

function ToolLink({ tool, categorySlug }: { tool: { name: string; slug: string; shortDescription: string }; categorySlug: string }) {
    return (
        <Link
            href={toolHref(categorySlug, tool.slug)}
            className="group flex h-full flex-col rounded-2xl border border-border bg-background p-4 transition-all hover:-translate-y-0.5 hover:bg-accent/40 hover:shadow-sm"
        >
            <span className="flex items-center justify-between gap-2 text-sm font-semibold text-foreground">
                {tool.name}
                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </span>
            <span className="mt-1.5 text-sm leading-6 text-muted-foreground">{tool.shortDescription}</span>
        </Link>
    );
}

export default async function DashboardToolsPage({ searchParams }: { searchParams: SearchParams }) {
    const user = await requireUser();
    const params = await searchParams;
    const rawQuery = params.q;
    const q = (Array.isArray(rawQuery) ? rawQuery[0] : rawQuery ?? "").trim().slice(0, 64);
    const needle = q.toLowerCase();

    const recentTools = q
        ? []
        : (await getRecentToolSlugs(user.id))
            .map((slug) => findToolBySlug(slug))
            .filter((tool): tool is SearchableTool => tool !== null);

    const categories = toolCategories
        .map((category) => ({
            ...category,
            tools: needle
                ? category.tools.filter(
                    (tool) =>
                        tool.name.toLowerCase().includes(needle) ||
                        tool.shortDescription.toLowerCase().includes(needle)
                )
                : category.tools,
        }))
        .filter((category) => category.tools.length > 0);

    const matchCount = categories.reduce((sum, category) => sum + category.tools.length, 0);

    return (
        <div className="space-y-6">
            <section className="rounded-[28px] border bg-card p-6 shadow-sm md:p-8">
                <p className="text-sm text-muted-foreground">Tools</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                    Open your Filego tools
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Every tool runs in your browser. Downloads you make while signed in are added to your activity.
                </p>

                <Form action="/dashboard/tools" className="relative mt-5 max-w-md" role="search">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        name="q"
                        type="search"
                        defaultValue={q}
                        aria-label="Search tools"
                        placeholder="Search tools, e.g. merge, compress, mp3..."
                        className="h-11 rounded-xl bg-background pl-9"
                    />
                </Form>
            </section>

            {recentTools.length > 0 ? (
                <Card className="rounded-3xl border shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                            <History className="size-4" />
                            Recently used
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {recentTools.map((tool) => (
                            <ToolLink key={tool.slug} tool={tool} categorySlug={tool.categorySlug} />
                        ))}
                    </CardContent>
                </Card>
            ) : null}

            {q ? (
                <p className="text-sm text-muted-foreground">
                    {matchCount} {matchCount === 1 ? "tool matches" : "tools match"} “{q}”.{" "}
                    <Link href="/dashboard/tools" className="font-medium text-primary underline-offset-4 hover:underline">
                        Clear search
                    </Link>
                </p>
            ) : null}

            {categories.map((category) => {
                const Icon = getCategoryIcon(category.slug);

                return (
                    <section key={category.slug} className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <Icon className="size-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold tracking-tight text-foreground">{category.title}</h2>
                                    <p className="text-sm text-muted-foreground">{category.description}</p>
                                </div>
                            </div>
                            <Link
                                href={`/tools/${category.slug}`}
                                className="hidden shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline sm:block"
                            >
                                View category
                            </Link>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {category.tools.map((tool) => (
                                <ToolLink key={tool.slug} tool={tool} categorySlug={category.slug} />
                            ))}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}
