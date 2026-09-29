import Link from "next/link"
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import { categoryIconMap, type ToolCategory } from "@/lib/tools-data"

type ToolCardProps = {
    href: string
    name: string
    description: string
    categorySlug: string
    accent: string
    meta?: string
    className?: string
}

/** Compact, colourful card for linking to a single tool. */
export function ToolCard({ href, name, description, categorySlug, accent, meta, className }: ToolCardProps) {
    const Icon = categoryIconMap[categorySlug] ?? Sparkles

    return (
        <Link
            href={href}
            className={cn(
                "group relative flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-4 transition-all duration-200",
                "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
                className
            )}
        >
            <div
                className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm transition-transform duration-200 group-hover:scale-105",
                    accent
                )}
            >
                <Icon className="h-5 w-5" aria-hidden="true" />
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                        {name}
                    </h3>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{description}</p>
                {meta ? (
                    <span className="mt-2 inline-block rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {meta}
                    </span>
                ) : null}
            </div>
        </Link>
    )
}

/** Larger card for a whole tool category, with a preview of its tools. */
export function CategoryCard({ category, className }: { category: ToolCategory; className?: string }) {
    const Icon = categoryIconMap[category.slug] ?? Sparkles

    return (
        <Link
            href={`/tools/${category.slug}`}
            className={cn(
                "group relative flex flex-col overflow-hidden rounded-3xl border border-border/70 bg-card p-5 transition-all duration-200",
                "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5",
                className
            )}
        >
            <div
                className={cn(
                    "pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-br opacity-15 blur-2xl transition-opacity duration-300 group-hover:opacity-30",
                    category.accent
                )}
            />

            <div className="relative flex items-center justify-between gap-3">
                <div
                    className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br shadow-md",
                        category.accent
                    )}
                >
                    <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <span className="rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {category.tools.length} tools
                </span>
            </div>

            <h3 className="relative mt-4 text-lg font-bold tracking-tight text-foreground">{category.title}</h3>
            <p className="relative mt-1 text-sm leading-6 text-muted-foreground">{category.description}</p>

            <div className="relative mt-4 flex flex-wrap gap-1.5">
                {category.tools.slice(0, 4).map((tool) => (
                    <span
                        key={tool.slug}
                        className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground/80"
                    >
                        {tool.name}
                    </span>
                ))}
            </div>

            <span className="relative mt-auto inline-flex items-center gap-1 pt-5 text-sm font-semibold text-primary">
                Explore
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </span>
        </Link>
    )
}
