import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MagicCard } from "@/components/ui/magic-card"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { categoryIconMap, getCategoryBySlug, toolCategories } from "@/lib/tools-data"

type Props = {
    params: Promise<{ category: string }>
}

const SITE_URL = "https://www.filego.in"

export async function generateStaticParams() {
    return toolCategories.map((category) => ({
        category: category.slug,
    }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { category: categorySlug } = await params
    const category = getCategoryBySlug(categorySlug)

    if (!category) {
        return {
            title: "Tools Not Found",
            description: "The requested tool category could not be found.",
        }
    }

    const canonical = `${SITE_URL}/tools/${category.slug}`

    return {
        title: category.seoTitle ?? `${category.title} | Filego`,
        description: category.seoDescription ?? category.description,
        alternates: {
            canonical,
        },
        openGraph: {
            title: category.seoTitle ?? `${category.title} | Filego`,
            description: category.seoDescription ?? category.description,
            url: canonical,
            siteName: "Filego",
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: category.seoTitle ?? `${category.title} | Filego`,
            description: category.seoDescription ?? category.description,
        },
        keywords: [
            category.title,
            `${category.title} online`,
            `${category.title} free`,
            ...category.tools.map((tool) => tool.name),
        ],
    }
}

export default async function ToolCategoryPage({ params }: Props) {
    const { category: categorySlug } = await params
    const category = getCategoryBySlug(categorySlug)

    if (!category) notFound()

    const Icon = categoryIconMap[category.slug] ?? Sparkles

    return (
        <main className="min-h-screen bg-background text-foreground">
            <section className="border-b border-border/50">
                <div className="container mx-auto px-4 py-8 sm:py-12 md:px-6">
                    <Link
                        href="/tools"
                        className="inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        All tools
                    </Link>

                    <div className="mt-4 flex items-center gap-4">
                        <div
                            className={cn(
                                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br sm:h-14 sm:w-14",
                                category.accent
                            )}
                        >
                            <Icon className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                {category.title}
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                                {category.description}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="container mx-auto px-4 py-10 md:px-6">
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {category.tools.map((tool) => (
                        <Link
                            key={tool.slug}
                            href={`/tools/${category.slug}/${tool.slug}`}
                            className="group block"
                        >
                            <MagicCard
                                className="rounded-3xl border border-border/60 bg-background/90 p-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                                gradientColor="rgba(1, 105, 111, 0.12)"
                            >
                                <Card className="rounded-3xl border-0 bg-transparent shadow-none">
                                    <CardHeader className="space-y-4 p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div
                                                className={cn(
                                                    "h-12 w-12 rounded-2xl bg-gradient-to-br",
                                                    category.accent
                                                )}
                                            />
                                            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1" />
                                        </div>

                                        <div className="space-y-2">
                                            <CardTitle className="text-xl font-semibold tracking-tight">
                                                {tool.name}
                                            </CardTitle>
                                            <CardDescription className="text-sm leading-6 text-muted-foreground">
                                                {tool.shortDescription}
                                            </CardDescription>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4 px-6 pb-6">
                                        <div className="flex flex-wrap gap-2">
                                            <Badge
                                                variant="secondary"
                                                className="rounded-full border border-border/60 bg-muted/60 px-3 py-1 text-xs font-medium text-foreground/90"
                                            >
                                                {category.title}
                                            </Badge>

                                            <Badge
                                                variant="secondary"
                                                className="rounded-full border border-border/60 bg-muted/60 px-3 py-1 text-xs font-medium text-foreground/90"
                                            >
                                                Tool page
                                            </Badge>
                                        </div>

                                        <p className="text-sm text-muted-foreground">
                                            Open a dedicated page for {tool.name.toLowerCase()} workflow.
                                        </p>
                                    </CardContent>
                                </Card>
                            </MagicCard>
                        </Link>
                    ))}
                </div>
            </section>
        </main>
    )
}