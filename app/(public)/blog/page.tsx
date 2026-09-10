// app/blog/page.tsx
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MagicCard } from "@/components/ui/magic-card";
import { BlurFade } from "@/components/ui/blur-fade";
import { CalendarDays, ArrowUpRight, Newspaper } from "lucide-react";
import { getPublishedBlogPosts } from "@/lib/blog";
import { cn } from "@/lib/utils";

export const revalidate = 3600;

type Props = {
    searchParams: Promise<{ page?: string }>;
};

function formatDate(date: Date | string) {
    return new Date(date).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

const CARD_ACCENTS = [
    "from-teal-500/20 to-cyan-500/10",
    "from-sky-500/20 to-indigo-500/10",
    "from-amber-500/20 to-orange-500/10",
    "from-violet-500/20 to-fuchsia-500/10",
    "from-emerald-500/20 to-lime-500/10",
    "from-rose-500/20 to-red-500/10",
];

export default async function BlogPage({ searchParams }: Props) {
    const sp = await searchParams;
    const page = Math.max(1, Number(sp.page) || 1);

    const { items: posts, totalPages } = await getPublishedBlogPosts(page);

    return (
        <main className="bg-background">
            <section className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
                <div className="border-b border-border/60 pb-6 md:pb-8">
                    <p className="text-xs font-medium text-muted-foreground">Filego Blog</p>
                    <h1 className="mt-2 max-w-3xl text-2xl font-semibold tracking-tight md:text-3xl">
                        Practical guides for PDFs, images, and document workflows
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                        Useful articles for compressing, converting, merging, and managing files more efficiently.
                    </p>
                </div>

                {posts.length ? (
                    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {posts.map((post, index) => (
                            <BlurFade key={post.id} delay={index * 0.06} inView direction="up">
                                <Link href={`/blog/${post.slug}`} className="group block h-full">
                                    <MagicCard
                                        className="h-full rounded-2xl border border-border/60 p-0 shadow-sm"
                                        gradientColor="rgba(1, 105, 111, 0.12)"
                                    >
                                        <div className="flex h-full flex-col">
                                            {post.coverImage ? (
                                                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-2xl bg-muted">
                                                    <Image
                                                        src={post.coverImage}
                                                        alt={post.title}
                                                        fill
                                                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                    />
                                                </div>
                                            ) : null}

                                            <div className="flex flex-1 flex-col p-4">
                                                {!post.coverImage ? (
                                                    <div
                                                        className={cn(
                                                            "mb-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br",
                                                            CARD_ACCENTS[index % CARD_ACCENTS.length]
                                                        )}
                                                    >
                                                        <Newspaper className="h-4 w-4" aria-hidden="true" />
                                                    </div>
                                                ) : null}

                                                <div className="flex flex-wrap items-center gap-2">
                                                    {post.category ? (
                                                        <Badge
                                                            variant="outline"
                                                            className="rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]"
                                                        >
                                                            {post.category}
                                                        </Badge>
                                                    ) : null}

                                                    {post.publishedAt ? (
                                                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <CalendarDays className="size-3.5" />
                                                            {formatDate(post.publishedAt)}
                                                        </span>
                                                    ) : null}
                                                </div>

                                                <h2 className="mt-3 text-lg font-semibold tracking-tight text-foreground transition-opacity group-hover:opacity-80">
                                                    {post.title}
                                                </h2>

                                                <p className="mt-2 line-clamp-2 flex-1 text-sm leading-6 text-muted-foreground">
                                                    {post.excerpt}
                                                </p>

                                                <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-foreground/80 transition-colors group-hover:text-primary">
                                                    Read more
                                                    <ArrowUpRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                                </div>
                                            </div>
                                        </div>
                                    </MagicCard>
                                </Link>
                            </BlurFade>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-sm text-muted-foreground">
                        No blog posts published yet.
                    </div>
                )}

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
            </section>
        </main>
    );
}
