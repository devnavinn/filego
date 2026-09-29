import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { BadgeCheck, ChevronRight, Lock, Sparkles, Zap } from "lucide-react"

import { JsonLd } from "@/components/seo/json-ld"
import { AdSlot } from "@/components/ads/ad-slot"
import { ToolCard } from "@/components/tool-card"
import { ToolRenderer } from "@/components/tools/tool-renderer"
import { categoryIconMap, getToolBySlugs, toolCategories } from "@/lib/tools-data"
import { cn } from "@/lib/utils"

type Props = {
    params: Promise<{ category: string; tool: string }>
}

const SITE_URL = "https://www.filego.in"

export async function generateStaticParams() {
    return toolCategories.flatMap((category) =>
        category.tools.map((tool) => ({
            category: category.slug,
            tool: tool.slug,
        }))
    )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { category, tool } = await params
    const data = getToolBySlugs(category, tool)

    if (!data) {
        return {
            title: "Tool Not Found",
            description: "The requested tool page could not be found.",
        }
    }

    const canonical = `${SITE_URL}/tools/${data.category.slug}/${data.tool.slug}`
    const title =
        data.tool.seoTitle ?? `${data.tool.name} – Free Online Tool | ${data.category.title} | Filego`
    const description =
        data.tool.seoDescription ??
        `${data.tool.name} online tool for fast browser-based file processing and downloads.`

    return {
        title,
        description,
        alternates: {
            canonical,
        },
        openGraph: {
            title,
            description,
            url: canonical,
            siteName: "Filego",
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
        },
        keywords: [
            data.tool.name,
            `${data.tool.name} online`,
            `${data.tool.name} free`,
            `${data.tool.name} tool`,
            `${data.category.title}`,
            "browser-based tool",
            "online file converter",
        ],
    }
}

export default async function SingleToolPage({ params }: Props) {
    const { category, tool } = await params
    const data = getToolBySlugs(category, tool)

    if (!data) notFound()

    const { category: toolCategory, tool: toolItem } = data
    const relatedTools = toolCategory.tools.filter((item) => item.slug !== toolItem.slug).slice(0, 6)

    const CategoryIcon = categoryIconMap[toolCategory.slug] ?? Sparkles
    const toolUrl = `${SITE_URL}/tools/${toolCategory.slug}/${toolItem.slug}`

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Tools", item: `${SITE_URL}/tools` },
            { "@type": "ListItem", position: 3, name: toolCategory.title, item: `${SITE_URL}/tools/${toolCategory.slug}` },
            { "@type": "ListItem", position: 4, name: toolItem.name, item: toolUrl },
        ],
    }

    return (
        <main className="min-h-screen bg-background text-foreground">
            <JsonLd data={breadcrumbSchema} />

            <div className="relative isolate">
                <div className="bg-hero-mesh pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] opacity-70" />

                <div className="container mx-auto px-4 pt-6 md:px-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <nav aria-label="Breadcrumb">
                            <ol className="flex flex-wrap items-center gap-1 text-xs font-medium text-muted-foreground">
                                <li>
                                    <Link href="/tools" className="transition-colors hover:text-primary">
                                        Tools
                                    </Link>
                                </li>
                                <ChevronRight className="h-3 w-3" aria-hidden="true" />
                                <li>
                                    <Link
                                        href={`/tools/${toolCategory.slug}`}
                                        className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
                                    >
                                        <span
                                            className={cn(
                                                "flex h-4 w-4 items-center justify-center rounded bg-gradient-to-br",
                                                toolCategory.accent
                                            )}
                                        >
                                            <CategoryIcon className="h-2.5 w-2.5" />
                                        </span>
                                        {toolCategory.title}
                                    </Link>
                                </li>
                                <ChevronRight className="h-3 w-3" aria-hidden="true" />
                                <li aria-current="page" className="text-foreground">
                                    {toolItem.name}
                                </li>
                            </ol>
                        </nav>

                        <ul className="flex flex-wrap gap-1.5 text-[11px] font-medium text-muted-foreground">
                            {[
                                { icon: BadgeCheck, label: "Free" },
                                { icon: Lock, label: "Private" },
                                { icon: Zap, label: "No sign-up" },
                            ].map((item) => (
                                <li
                                    key={item.label}
                                    className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/70 px-2.5 py-1 backdrop-blur"
                                >
                                    <item.icon className="h-3 w-3 text-primary" aria-hidden="true" />
                                    {item.label}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <section className="container mx-auto px-4 py-6 md:px-6">
                    <ToolRenderer
                        toolSlug={toolItem.slug}
                        toolName={toolItem.name}
                        categoryName={toolCategory.title}
                        backHref={`/tools/${toolCategory.slug}`}
                    />
                </section>
            </div>

            <AdSlot placement="tool" className="px-4 pb-10 md:px-6" />

            {relatedTools.length > 0 && (
                <section className="border-t border-border/60 bg-muted/20">
                    <div className="container mx-auto px-4 py-12 md:px-6">
                        <div className="flex items-end justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold text-primary">Keep going</p>
                                <h2 className="mt-1 text-2xl font-extrabold tracking-tight">
                                    More {toolCategory.title.toLowerCase()}
                                </h2>
                            </div>
                            <Link
                                href={`/tools/${toolCategory.slug}`}
                                className="shrink-0 text-sm font-semibold text-primary hover:text-primary/80"
                            >
                                View all {toolCategory.tools.length}
                            </Link>
                        </div>
                        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {relatedTools.map((item) => (
                                <ToolCard
                                    key={item.slug}
                                    href={`/tools/${toolCategory.slug}/${item.slug}`}
                                    name={item.name}
                                    description={item.shortDescription}
                                    categorySlug={toolCategory.slug}
                                    accent={toolCategory.accent}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </main>
    )
}
