import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CheckCircle2, Shield, Zap } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

    return (
        <main className="min-h-screen bg-background text-foreground">
            <section className="border-b border-border/50">
                <div className="container mx-auto px-4 py-16 md:px-6 lg:py-20">
                    <div className="space-y-6">
                        <Button asChild variant="ghost" className="w-fit rounded-full">
                            <Link href={`/tools/${toolCategory.slug}`}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to {toolCategory.title}
                            </Link>
                        </Button>

                        <div className="space-y-4">
                            <Badge variant="outline" className="rounded-full px-4 py-1.5">
                                {toolCategory.title}
                            </Badge>

                            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                                {toolItem.name}
                            </h1>

                            <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
                                {toolItem.shortDescription} Use this dedicated page to process files faster with a
                                focused workflow, stronger SEO targeting, and a cleaner product experience.
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="rounded-3xl border border-border/60 bg-card p-5">
                                <Zap className="mb-3 h-5 w-5 text-teal-500" />
                                <h2 className="font-semibold">Fast workflow</h2>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Upload, process, and download files in a clean step-by-step experience.
                                </p>
                            </div>

                            <div className="rounded-3xl border border-border/60 bg-card p-5">
                                <Shield className="mb-3 h-5 w-5 text-teal-500" />
                                <h2 className="font-semibold">Private processing</h2>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Clear privacy messaging and secure file handling help build trust.
                                </p>
                            </div>

                            <div className="rounded-3xl border border-border/60 bg-card p-5">
                                <CheckCircle2 className="mb-3 h-5 w-5 text-teal-500" />
                                <h2 className="font-semibold">Focused conversion</h2>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Keep the page centered on one search intent and one primary file action.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="container mx-auto grid gap-8 px-4 py-16 md:px-6 lg:lg:grid-cols-[1.5fr_0.5fr]">
                <ToolRenderer
                    toolSlug={toolItem.slug}
                    toolName={toolItem.name}
                    categoryName={toolCategory.title}
                    backHref={`/tools/${toolCategory.slug}`}
                />

                <aside className="space-y-6">
                    <div className="rounded-3xl border border-border/60 bg-card p-6">
                        <h2 className="text-xl font-semibold">Why use this tool</h2>
                        <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                            <li>Fast browser-based workflow for quick file tasks.</li>
                            <li>Dedicated page targeting a specific tool keyword.</li>
                            <li>Clear conversion-focused content and CTA placement.</li>
                        </ul>
                    </div>

                    <div className="rounded-3xl border border-border/60 bg-card p-6">
                        <h2 className="text-xl font-semibold">Related tools</h2>
                        <div className="mt-4 space-y-3">
                            {toolCategory.tools
                                .filter((item) => item.slug !== toolItem.slug)
                                .slice(0, 4)
                                .map((item) => (
                                    <Link
                                        key={item.slug}
                                        href={`/tools/${toolCategory.slug}/${item.slug}`}
                                        className="block rounded-2xl border border-border/60 p-4 text-sm transition-colors hover:bg-muted/50"
                                    >
                                        <p className="font-medium">{item.name}</p>
                                        <p className="mt-1 text-muted-foreground">{item.shortDescription}</p>
                                    </Link>
                                ))}
                        </div>
                    </div>
                </aside>
            </section>
        </main>
    )
}