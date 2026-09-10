import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowUpRight } from "lucide-react"

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
            <div className="container mx-auto px-4 pt-6 pb-2 md:px-6">
                <Link
                    href={`/tools/${toolCategory.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    {toolCategory.title}
                </Link>
            </div>

            <section className="container mx-auto px-4 py-5 md:px-6">
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
                        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                            {relatedTools.map((item) => (
                                <li key={item.slug}>
                                    <Link
                                        href={`/tools/${toolCategory.slug}/${item.slug}`}
                                        className="group inline-flex items-center gap-1 text-sm text-foreground/80 transition-colors hover:text-primary"
                                    >
                                        <span className="underline decoration-border/0 underline-offset-4 group-hover:decoration-primary/50">
                                            {item.name}
                                        </span>
                                        <ArrowUpRight className="h-3 w-3 shrink-0 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            )}
        </main>
    )
}
