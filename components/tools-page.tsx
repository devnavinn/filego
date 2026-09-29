import Link from "next/link"
import { ArrowUpRight, Sparkles } from "lucide-react"

import { ToolCard } from "@/components/tool-card"
import { ToolSearch } from "@/components/tool-search"
import { categoryIconMap, toolCategories } from "@/lib/tools-data"
import { cn } from "@/lib/utils"

export function ToolsPage() {
    const totalTools = toolCategories.reduce((sum, category) => sum + category.tools.length, 0)

    return (
        <main className="min-h-screen bg-background text-foreground">
            <section className="relative isolate border-b border-border/60">
                <div className="bg-hero-mesh pointer-events-none absolute inset-0 -z-10" />
                <div className="bg-grid-faint pointer-events-none absolute inset-0 -z-10" />
                <div className="container mx-auto px-4 py-12 text-center sm:py-16 md:px-6">
                    <p className="text-sm font-semibold text-primary">
                        {totalTools} tools across {toolCategories.length} categories
                    </p>
                    <h1 className="mx-auto mt-3 max-w-3xl text-3xl font-extrabold tracking-tight text-balance sm:text-5xl">
                        Fast, private, <span className="text-gradient-brand">browser-based</span> file tools
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                        PDF, image, video, audio, document, security, archive, developer and AI tools,
                        with most of them running locally in your browser.
                    </p>
                    <div className="mx-auto mt-7 max-w-xl">
                        <ToolSearch variant="hero" />
                    </div>

                    <nav aria-label="Tool categories" className="mt-6 flex flex-wrap justify-center gap-2">
                        {toolCategories.map((category) => {
                            const Icon = categoryIconMap[category.slug] ?? Sparkles
                            return (
                                <a
                                    key={category.id}
                                    href={`#${category.slug}`}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 py-1 pr-3 pl-1 text-xs font-medium text-foreground/80 backdrop-blur transition-colors hover:border-primary/40 hover:text-primary"
                                >
                                    <span className={cn("flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br", category.accent)}>
                                        <Icon className="h-3 w-3" />
                                    </span>
                                    {category.title}
                                </a>
                            )
                        })}
                    </nav>
                </div>
            </section>

            <section className="container mx-auto px-4 py-10 md:px-6">
                <div className="space-y-14">
                    {toolCategories.map((category) => {
                        const Icon = categoryIconMap[category.slug] ?? Sparkles

                        return (
                            <div key={category.id} id={category.slug} className="scroll-mt-24">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={cn(
                                                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-md",
                                                category.accent
                                            )}
                                        >
                                            <Icon className="h-5 w-5" aria-hidden="true" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                                                {category.title}
                                            </h2>
                                            <p className="mt-0.5 text-sm text-muted-foreground">
                                                {category.description}
                                            </p>
                                        </div>
                                    </div>

                                    <Link
                                        href={`/tools/${category.slug}`}
                                        className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                                    >
                                        View category
                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                    </Link>
                                </div>

                                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                    {category.tools.map((tool) => (
                                        <ToolCard
                                            key={tool.slug}
                                            href={`/tools/${category.slug}/${tool.slug}`}
                                            name={tool.name}
                                            description={tool.shortDescription}
                                            categorySlug={category.slug}
                                            accent={category.accent}
                                        />
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
