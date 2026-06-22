import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MagicCard } from "@/components/ui/magic-card"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCategoryBySlug, toolCategories } from "@/lib/tools-data"

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

    return (
        <main className="min-h-screen bg-background text-foreground">
            <section className="border-b border-border/50">
                <div className="container mx-auto px-4 py-16 md:px-6 lg:py-20">
                    <div className="space-y-6">
                        <Button asChild variant="ghost" className="w-fit rounded-full">
                            <Link href="/tools">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to tools
                            </Link>
                        </Button>

                        <div className="space-y-4">
                            <div className={cn("h-16 w-16 rounded-3xl bg-gradient-to-br", category.accent)} />
                            <Badge variant="outline" className="rounded-full px-4 py-1.5">
                                {category.title}
                            </Badge>
                            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                                {category.title}
                            </h1>
                            <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
                                {category.heroDescription}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="container mx-auto px-4 py-16 md:px-6">
                <div className="mb-8 max-w-3xl space-y-4">
                    <h2 className="text-2xl font-semibold tracking-tight">All {category.title}</h2>
                    <p className="text-muted-foreground">
                        Choose a tool below to open a dedicated page with upload flow, processing states,
                        download actions, and focused SEO targeting for that tool.
                    </p>
                </div>

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