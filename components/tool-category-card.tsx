import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MagicCard } from "@/components/ui/magic-card"
import { cn } from "@/lib/utils"
import { categoryIconMap, type ToolCategory } from "@/lib/tools-data"

export function ToolCategoryCard({ category }: { category: ToolCategory }) {
    const Icon = categoryIconMap[category.slug] ?? Sparkles

    return (
        <Link href={`/tools/${category.slug}`} className="group block">
            <MagicCard
                className="rounded-3xl border border-border/60 bg-background/90 p-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                gradientColor="rgba(1, 105, 111, 0.12)"
            >
                <Card className="rounded-3xl border-0 bg-transparent shadow-none">
                    <CardHeader className="space-y-4 p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div
                                className={cn(
                                    "flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br",
                                    category.accent
                                )}
                            >
                                <Icon className="h-5 w-5" aria-hidden="true" />
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1" />
                        </div>

                        <div className="space-y-2">
                            <CardTitle className="text-xl font-semibold tracking-tight">
                                {category.title}
                            </CardTitle>
                            <CardDescription className="text-sm leading-6 text-muted-foreground">
                                {category.description}
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4 px-6 pb-6">
                        <div className="flex flex-wrap gap-2">
                            {category.tools.slice(0, 6).map((tool) => (
                                <Badge
                                    key={tool.slug}
                                    variant="secondary"
                                    className="rounded-full border border-border/60 bg-muted/60 px-3 py-1 text-xs font-medium text-foreground/90"
                                >
                                    {tool.name}
                                </Badge>
                            ))}
                        </div>

                        <p className="text-sm text-muted-foreground">
                            {category.tools.length} tools in this category
                        </p>
                    </CardContent>
                </Card>
            </MagicCard>
        </Link>
    )
}