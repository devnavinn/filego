import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
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
            <div className="container mx-auto px-4 pt-6 pb-2 md:px-6">
                <Link
                    href="/tools"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    All tools
                </Link>

                <div className="mt-3 flex items-center gap-2.5">
                    <div
                        className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br",
                            category.accent
                        )}
                    >
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight sm:text-xl">{category.title}</h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">{category.description}</p>
                    </div>
                </div>
            </div>

            <section className="container mx-auto px-4 py-8 md:px-6">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
            </section>
        </main>
    )
}