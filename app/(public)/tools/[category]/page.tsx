import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Sparkles } from "lucide-react"
import { AdSlot } from "@/components/ads/ad-slot"
import { ToolCard } from "@/components/tool-card"
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
            <section className="relative isolate border-b border-border/60">
                <div className="bg-hero-mesh pointer-events-none absolute inset-0 -z-10 opacity-80" />
                <div className="container mx-auto px-4 pt-6 pb-10 md:px-6 md:pb-14">
                    <Link
                        href="/tools"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        All tools
                    </Link>

                    <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
                        <div
                            className={cn(
                                "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg",
                                category.accent
                            )}
                        >
                            <Icon className="h-8 w-8" aria-hidden="true" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{category.title}</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                {category.heroDescription}
                            </p>
                            <p className="mt-3 inline-flex rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
                                {category.tools.length} free tools
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="container mx-auto px-4 py-10 md:px-6">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
            </section>

            <AdSlot placement="category" className="px-4 pb-12 md:px-6" />
        </main>
    )
}
