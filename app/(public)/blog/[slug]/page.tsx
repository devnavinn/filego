// app/blog/[slug]/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, ChevronLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPublishedBlogPostBySlug } from "@/lib/blog";
type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPublishedBlogPostBySlug(slug);
    if (!post) notFound();

    return {
        title: post.seoTitle || post.title,
        description: post.seoDescription || post.excerpt,
        openGraph: {
            title: post.seoTitle || post.title,
            description: post.seoDescription || post.excerpt,
            images: post.coverImage ? [post.coverImage] : [],
        },
    };
}

export default async function BlogPostPage({ params }: Props) {
    const { slug } = await params;
    const post = await getPublishedBlogPostBySlug(slug);
    if (!post) notFound();

    return (
        <main className="bg-background">
            <section className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
                <div className="mx-auto max-w-4xl">
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 rounded-full border border-border/70 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <ChevronLeft className="size-4" />
                        Back to blog
                    </Link>

                    <article className="mt-8">
                        <header className="border-b border-border/60 pb-8 md:pb-10">
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
                                    <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                                        <CalendarDays className="size-4" />
                                        {new Date(post.publishedAt).toLocaleDateString("en-US", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </div>
                                ) : null}
                            </div>

                            <div className="mt-5 space-y-4">
                                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground md:text-5xl md:leading-[1.08]">
                                    {post.title}
                                </h1>
                                <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                                    {post.excerpt}
                                </p>
                            </div>
                        </header>

                        {post.coverImage ? (
                            <div className="mt-8 overflow-hidden rounded-3xl border border-border/60 bg-muted/30">
                                <div className="relative aspect-[16/8] w-full">
                                    <Image
                                        src={post.coverImage}
                                        alt={post.title}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 1024px) 100vw, 1024px"
                                        priority
                                    />
                                </div>
                            </div>
                        ) : null}

                        <div className="mt-10 md:mt-12">
                            <div className="mx-auto max-w-3xl">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        table: ({ children }) => (
                                            <div className="mt-8 overflow-x-auto rounded-2xl border border-border/60">
                                                <table className="w-full border-collapse text-left text-sm">
                                                    {children}
                                                </table>
                                            </div>
                                        ),
                                        thead: ({ children }) => (
                                            <thead className="bg-muted/50">{children}</thead>
                                        ),
                                        th: ({ children }) => (
                                            <th className="border-b border-border/60 px-4 py-3 font-medium text-foreground">
                                                {children}
                                            </th>
                                        ),
                                        td: ({ children }) => (
                                            <td className="border-b border-border/40 px-4 py-3 text-foreground/80">
                                                {children}
                                            </td>
                                        ),
                                        tr: ({ children }) => (
                                            <tr className="transition-colors hover:bg-muted/30">{children}</tr>
                                        ),
                                        h1: ({ children }) => (
                                            <h1 className="mt-10 text-3xl font-semibold tracking-tight text-foreground first:mt-0">
                                                {children}
                                            </h1>
                                        ),
                                        h2: ({ children }) => (
                                            <h2 className="mt-14 scroll-mt-24 text-2xl font-semibold tracking-tight text-foreground first:mt-0">
                                                {children}
                                            </h2>
                                        ),
                                        h3: ({ children }) => (
                                            <h3 className="mt-10 text-xl font-semibold tracking-tight text-foreground">
                                                {children}
                                            </h3>
                                        ),
                                        h4: ({ children }) => (
                                            <h4 className="mt-8 text-lg font-semibold text-foreground">
                                                {children}
                                            </h4>
                                        ),
                                        p: ({ children }) => (
                                            <p className="mt-5 text-[16px] leading-8 text-foreground/85 first:mt-0">
                                                {children}
                                            </p>
                                        ),
                                        ul: ({ children }) => (
                                            <ul className="mt-5 list-disc space-y-2 pl-6 text-[16px] leading-8 text-foreground/85 marker:text-foreground/50">
                                                {children}
                                            </ul>
                                        ),
                                        ol: ({ children }) => (
                                            <ol className="mt-5 list-decimal space-y-2 pl-6 text-[16px] leading-8 text-foreground/85 marker:text-foreground/50">
                                                {children}
                                            </ol>
                                        ),
                                        li: ({ children }) => <li className="pl-1">{children}</li>,
                                        blockquote: ({ children }) => (
                                            <blockquote className="mt-8 rounded-r-2xl border-l-2 border-foreground/20 bg-muted/30 px-5 py-4 text-[15px] italic leading-7 text-foreground/80">
                                                {children}
                                            </blockquote>
                                        ),
                                        a: ({ href, children }) => (
                                            <a
                                                href={href}
                                                className="font-medium text-foreground underline underline-offset-4 transition-opacity hover:opacity-70"
                                            >
                                                {children}
                                            </a>
                                        ),
                                        hr: () => <hr className="my-10 border-border/60" />,
                                        code: ({ children }) => (
                                            <code className="rounded bg-muted px-1.5 py-0.5 text-[0.9em] text-foreground">
                                                {children}
                                            </code>
                                        ),
                                        pre: ({ children }) => (
                                            <pre className="mt-6 overflow-x-auto rounded-2xl border border-border/70 bg-muted/50 p-4 text-sm leading-7">
                                                {children}
                                            </pre>
                                        ),
                                    }}
                                >
                                    {post.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </article>
                </div>
            </section>
        </main>
    );
}