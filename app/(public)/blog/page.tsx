// app/blog/page.tsx
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, ArrowUpRight } from "lucide-react";
import { getPublishedBlogPosts } from "@/lib/blog";

export const revalidate = 3600;

type Props = {
    searchParams: Promise<{ page?: string }>;
};

export default async function BlogPage({ searchParams }: Props) {
    const sp = await searchParams;
    const page = Math.max(1, Number(sp.page) || 1);

    const { items: posts, totalPages } = await getPublishedBlogPosts(page);

    return (
        <main className="bg-background">
            <section className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
                <div className="mx-auto max-w-4xl">
                    <div className="border-b border-border/60 pb-8 md:pb-10">
                        <p className="text-sm font-medium text-muted-foreground">Filego Blog</p>
                        <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl md:leading-[1.08]">
                            Practical guides for PDFs, images, and document workflows
                        </h1>
                        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                            Useful articles for compressing, converting, merging, and managing files more efficiently.
                        </p>
                    </div>

                    <div className="mt-8 divide-y divide-border/60">
                        {posts.length ? (
                            posts.map((post) => (
                                <Link
                                    key={post.id}
                                    href={`/blog/${post.slug}`}
                                    className="group block py-7 transition-colors"
                                >
                                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-3">
                                                {post.category ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em]"
                                                    >
                                                        {post.category}
                                                    </Badge>
                                                ) : null}

                                                {post.publishedAt ? (
                                                    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                                                        <CalendarDays className="size-4" />
                                                        {new Date(post.publishedAt).toLocaleDateString("en-US", {
                                                            day: "numeric",
                                                            month: "long",
                                                            year: "numeric",
                                                        })}
                                                    </span>
                                                ) : null}
                                            </div>

                                            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground transition-opacity group-hover:opacity-80 md:text-[30px]">
                                                {post.title}
                                            </h2>

                                            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted-foreground md:text-base">
                                                {post.excerpt}
                                            </p>
                                        </div>

                                        <div className="shrink-0 pt-1 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-foreground">
                                            <ArrowUpRight className="size-5" />
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="py-12 text-sm text-muted-foreground">
                                No blog posts published yet.
                            </div>
                        )}
                    </div>

                    {totalPages > 1 ? (
                        <div className="mt-10 flex items-center justify-between border-t border-border/60 pt-6">
                            <Link
                                href={page > 1 ? `/blog?page=${page - 1}` : "#"}
                                className={`text-sm ${page > 1 ? "text-foreground" : "pointer-events-none text-muted-foreground/50"}`}
                            >
                                Previous
                            </Link>

                            <p className="text-sm text-muted-foreground">
                                Page {page} of {totalPages}
                            </p>

                            <Link
                                href={page < totalPages ? `/blog?page=${page + 1}` : "#"}
                                className={`text-sm ${page < totalPages ? "text-foreground" : "pointer-events-none text-muted-foreground/50"}`}
                            >
                                Next
                            </Link>
                        </div>
                    ) : null}
                </div>
            </section>
        </main>
    );
}