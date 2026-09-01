import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { ToolRenderer } from "@/components/tools/tool-renderer"
import { getToolBySlugs, toolCategories } from "@/lib/tools-data"

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

    return (
        <main className="min-h-screen bg-background text-foreground">
            <div className="border-b border-border/50 bg-muted/20">
                <div className="container mx-auto flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 md:px-6">
                    <Link
                        href={`/tools/${toolCategory.slug}`}
                        className="inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        {toolCategory.title}
                    </Link>

                    <div className="hidden h-4 w-px bg-border sm:block" />

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-base font-semibold tracking-tight sm:text-lg">{toolItem.name}</h1>
                            <Badge variant="outline" className="rounded-full px-2 py-0 text-[10px]">
                                {toolCategory.title}
                            </Badge>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{toolItem.shortDescription}</p>
                    </div>
                </div>
            </div>

            <section className="container mx-auto px-4 py-5 sm:py-8 md:px-6">
                <ToolRenderer
                    toolSlug={toolItem.slug}
                    toolName={toolItem.name}
                    categoryName={toolCategory.title}
                    backHref={`/tools/${toolCategory.slug}`}
                />
            </section>

            {relatedTools.length > 0 && (
                <section className="border-t border-border/50">
                    <div className="container mx-auto px-4 py-8 md:px-6">
                        <h2 className="text-sm font-medium text-muted-foreground">
                            More {toolCategory.title.toLowerCase()}
                        </h2>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {relatedTools.map((item) => (
                                <Link
                                    key={item.slug}
                                    href={`/tools/${toolCategory.slug}/${item.slug}`}
                                    className="group inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted/60"
                                >
                                    {item.name}
                                    <ArrowRight className="h-3 w-3 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </main>
    )
}
