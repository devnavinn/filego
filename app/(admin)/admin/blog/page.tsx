// app/admin/blog/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { TableSearch } from "@/components/admin/table-search";
import { TablePagination } from "@/components/admin/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { PenSquare, Plus, CalendarDays, Tag } from "lucide-react";

const TAKE = 10;

export default async function AdminBlogPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; page?: string }>;
}) {
    await requireAdmin();

    const params = await searchParams;
    const q = params.q?.trim() ?? "";
    const page = Math.max(1, Number(params.page) || 1);
    const skip = (page - 1) * TAKE;

    const where = q
        ? {
            OR: [
                { title: { contains: q, mode: "insensitive" as const } },
                { slug: { contains: q, mode: "insensitive" as const } },
                { excerpt: { contains: q, mode: "insensitive" as const } },
                { category: { contains: q, mode: "insensitive" as const } },
            ],
        }
        : {};

    const [rows, total] = await Promise.all([
        prisma.blogPost.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: TAKE,
            select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                category: true,
                tags: true,
                status: true,
                createdAt: true,
                publishedAt: true,
            },
        }),
        prisma.blogPost.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / TAKE));

    return (
        <main className="space-y-6">
            <Card className="rounded-3xl shadow-sm">
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <CardTitle className="text-2xl tracking-tight">Blog posts</CardTitle>
                        <CardDescription>
                            Manage SEO articles, drafts, and published content.
                        </CardDescription>
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
                        <TableSearch placeholder="Search title, slug, category..." />
                        <Button asChild className="rounded-xl">
                            <Link href="/admin/blog/new">
                                <Plus className="mr-2 size-4" />
                                New post
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid gap-4">
                {rows.length ? (
                    rows.map((post) => (
                        <Card key={post.id} className="rounded-3xl shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h3 className="text-lg font-semibold">{post.title}</h3>
                                            <Badge
                                                variant={post.status === "PUBLISHED" ? "default" : "secondary"}
                                                className="rounded-full"
                                            >
                                                {post.status}
                                            </Badge>
                                            {post.category ? (
                                                <Badge variant="outline" className="rounded-full">
                                                    {post.category}
                                                </Badge>
                                            ) : null}
                                        </div>

                                        <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                                            {post.excerpt}
                                        </p>

                                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                            <span className="rounded-full border px-3 py-1">
                                                /blog/{post.slug}
                                            </span>

                                            {post.tags?.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1"
                                                >
                                                    <Tag className="size-3.5" />
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                            <span className="inline-flex items-center gap-2">
                                                <CalendarDays className="size-4" />
                                                Created {new Date(post.createdAt).toLocaleDateString()}
                                            </span>
                                            {post.publishedAt ? (
                                                <span className="inline-flex items-center gap-2">
                                                    <CalendarDays className="size-4" />
                                                    Published {new Date(post.publishedAt).toLocaleDateString()}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 gap-2">
                                        <Button asChild variant="outline" className="rounded-xl">
                                            <Link href={`/admin/blog/${post.id}`}>
                                                <PenSquare className="mr-2 size-4" />
                                                Edit
                                            </Link>
                                        </Button>

                                        {post.status === "PUBLISHED" ? (
                                            <Button asChild variant="ghost" className="rounded-xl">
                                                <Link href={`/blog/${post.slug}`} target="_blank">
                                                    View
                                                </Link>
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card className="rounded-3xl border-dashed">
                        <CardContent className="p-10 text-center text-sm text-muted-foreground">
                            No blog posts found.
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-muted-foreground">
                    Showing {rows.length} of {total} posts
                </p>
                <TablePagination page={page} totalPages={totalPages} searchParams={{ q }} />
            </div>
        </main>
    );
}