import { ToolCategoryCard } from "@/components/tool-category-card"
import { toolCategories } from "@/lib/tools-data"

export function ToolsPage() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <section className="border-b border-border/50">
                <div className="container mx-auto px-4 py-10 sm:py-16 md:px-6">
                    <div className="max-w-2xl space-y-4">
                        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                            Fast, private, browser-based file tools
                        </h1>
                        <p className="text-base leading-7 text-muted-foreground sm:text-lg">
                            PDF, image, video, audio, document, security, archive, and developer tools —
                            everything runs locally in your browser.
                        </p>
                    </div>
                </div>
            </section>

            <section className="container mx-auto px-4 py-10 md:px-6">
                <h2 className="mb-6 text-sm font-medium tracking-wide text-muted-foreground uppercase">
                    Browse by category
                </h2>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {toolCategories.map((category) => (
                        <ToolCategoryCard key={category.id} category={category} />
                    ))}
                </div>
            </section>
        </main>
    )
}
