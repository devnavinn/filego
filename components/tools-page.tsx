import Link from "next/link"
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react"

import { categoryIconMap, toolCategories } from "@/lib/tools-data"
import { cn } from "@/lib/utils"

export function ToolsPage() {
    const totalTools = toolCategories.reduce((sum, category) => sum + category.tools.length, 0)

    return (
        <main className="min-h-screen bg-background text-foreground">
            <section className="border-b border-border/50">
                <div className="container mx-auto px-4 py-10 sm:py-16 md:px-6">
                    <div className="max-w-2xl space-y-4">
                        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                            Fast, private, browser-based file tools
                        </h1>
                        <p className="text-base leading-7 text-muted-foreground sm:text-lg">
                            PDF, image, video, audio, document, security, archive, and developer tools —
                            everything runs locally in your browser.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {totalTools} tools across {toolCategories.length} categories
                        </p>
                    </div>
                </div>
            </section>

            <section className="container mx-auto px-4 py-10 md:px-6">
                <div className="divide-y divide-border/50">
                    {toolCategories.map((category) => {
                        const Icon = categoryIconMap[category.slug] ?? Sparkles

                        return (
                            <div key={category.id} className="py-10 first:pt-0 last:pb-0">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={cn(
                                                "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br",
                                                category.accent
                                            )}
                                        >
                                            <Icon className="h-4 w-4" aria-hidden="true" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
                                                {category.title}
                                            </h2>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {category.description}
                                            </p>
                                        </div>
                                    </div>

                                    <Link
                                        href={`/tools/${category.slug}`}
                                        className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80 sm:mt-1"
                                    >
                                        View category
                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                    </Link>
                                </div>

                                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                    {category.tools.map((tool) => (
                                        <Link
                                            key={tool.slug}
                                            href={`/tools/${category.slug}/${tool.slug}`}
                                            className="group flex items-start gap-2.5 rounded-xl border border-border/60 p-3 transition-colors hover:border-primary/40 hover:bg-muted/30"
                                        >
                                            <div
                                                className={cn(
                                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br",
                                                    category.accent
                                                )}
                                            >
                                                <Icon className="h-4 w-4" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className="text-sm font-medium tracking-tight transition-colors group-hover:text-primary">
                                                        {tool.name}
                                                    </h3>
                                                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
                                                </div>
                                                <p className="mt-0.5 text-xs leading-4 text-muted-foreground">
                                                    {tool.shortDescription}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>
        </main>
    )
}
