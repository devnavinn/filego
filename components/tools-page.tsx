import Link from "next/link"
import { ArrowRight, Search, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DotPattern } from "@/components/ui/dot-pattern"
import { NumberTicker } from "@/components/ui/number-ticker"
import { ToolCategoryCard } from "@/components/tool-category-card"
import { toolCategories } from "@/lib/tools-data"
import { cn } from "@/lib/utils"

const featuredTools = [
    {
        title: "PDF Merge",
        description: "Combine multiple PDF files into one clean document.",
        href: "/tools/pdf-tools/pdf-merge",
    },
    {
        title: "Background Remover",
        description: "Remove image backgrounds for product and marketing assets.",
        href: "/tools/image-tools/background-remover",
    },
    {
        title: "QR Code Generator",
        description: "Generate QR codes for URLs, products, and campaigns.",
        href: "/tools/developer-tools/qr-code-generator",
    },
]

export function ToolsPage() {
    return (
        <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
            <section className="relative border-b border-border/50">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <DotPattern
                        className={cn(
                            "opacity-40 [mask-image:radial-gradient(700px_circle_at_center,white,transparent)]"
                        )}
                    />
                    <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-teal-500/5 to-transparent" />
                </div>

                <div className="container relative mx-auto px-4 py-16 md:px-6 lg:py-24">
                    <div className="grid items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
                        <div className="space-y-8">
                            <Badge className="w-fit rounded-full border border-teal-500/20 bg-teal-500/10 px-4 py-1.5 text-sm text-teal-700 dark:text-teal-300">
                                <span className="inline-flex items-center gap-2">
                                    <Sparkles className="h-4 w-4" />
                                    Fast, private, browser-based file tools
                                </span>
                            </Badge>

                            <div className="space-y-5">
                                <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                                    Powerful online file tools with a clean, conversion-focused experience.
                                </h1>

                                <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                                    Explore PDF, image, office, video, audio, security, archive, developer, and AI
                                    tools from one modern workspace designed for speed, clarity, and easy navigation.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Button asChild size="lg" className="rounded-full px-6">
                                    <Link href="#categories">
                                        Explore tools
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>

                                <Button asChild size="lg" variant="outline" className="rounded-full px-6">
                                    <Link href="/tools/ai-tools">View AI tools</Link>
                                </Button>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                {[
                                    { value: 60, label: "Tools" },
                                    { value: 9, label: "Categories" },
                                    { value: 1, label: "Unified hub" },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className="rounded-3xl border border-border/60 bg-background/90 p-5 shadow-sm"
                                    >
                                        <div className="text-3xl font-semibold tracking-tight text-foreground">
                                            <NumberTicker value={item.value} />+
                                        </div>
                                        <p className="mt-2 text-sm text-muted-foreground">{item.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-[2rem] border border-border/60 bg-background/95 p-5 shadow-xl">
                            <div className="space-y-5 rounded-[1.5rem] border border-border/60 bg-muted/20 p-5">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Popular tools</p>
                                        <h2 className="text-xl font-semibold tracking-tight">Quick access</h2>
                                    </div>

                                    <Badge variant="secondary" className="rounded-full px-3 py-1">
                                        Updated
                                    </Badge>
                                </div>

                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        className="h-12 rounded-full border-border/60 bg-background pl-11"
                                        placeholder="Search PDF Merge, OCR, JWT Decoder"
                                    />
                                </div>

                                <div className="rounded-[1.5rem] border border-teal-500/20 bg-teal-500/5 p-5">
                                    <Badge className="mb-3 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300">
                                        Featured category
                                    </Badge>
                                    <h3 className="text-lg font-semibold">AI File Tools</h3>
                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                        OCR, document summarization, resume parsing, and AI-powered PDF question
                                        answering in one focused category.
                                    </p>
                                    <Button asChild variant="outline" className="mt-4 rounded-full">
                                        <Link href="/tools/ai-tools">Open category</Link>
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {featuredTools.map((tool) => (
                                        <Link
                                            key={tool.title}
                                            href={tool.href}
                                            className="flex items-start justify-between rounded-2xl border border-border/60 bg-background/90 p-4 transition-colors hover:bg-muted/40"
                                        >
                                            <div>
                                                <p className="font-medium">{tool.title}</p>
                                                <p className="text-sm text-muted-foreground">{tool.description}</p>
                                            </div>

                                            <Badge variant="secondary" className="rounded-full">
                                                Open
                                            </Badge>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="categories" className="container mx-auto px-4 py-16 md:px-6 lg:py-20">
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-3">
                        <Badge variant="outline" className="rounded-full px-4 py-1.5">
                            Tool directory
                        </Badge>
                        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                            Browse every category
                        </h2>
                    </div>

                    <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                        Use this as your main tools page and route each card into category-level and single-tool
                        pages for stronger navigation and SEO coverage.
                    </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {toolCategories.map((category) => (
                        <ToolCategoryCard key={category.id} category={category} />
                    ))}
                </div>
            </section>
        </main>
    )
}