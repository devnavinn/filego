// app/admin/blog/[id]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { AddEditBlogForm } from "@/components/admin/add-edit-blog-form";

type Props = {
    params: Promise<{ id: string }>;
};

export default async function EditBlogPostPage({ params }: Props) {
    await requireAdmin();
    const { id } = await params;

    const post = await prisma.blogPost.findUnique({
        where: { id },
        select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            content: true,
            coverImage: true,
            category: true,
            tags: true,
            seoTitle: true,
            seoDescription: true,
            status: true,
        },
    });

    if (!post) notFound();

    return (
        <main className="space-y-6">
            <section className="rounded-3xl border bg-background p-6 shadow-sm">
                <p className="text-sm text-muted-foreground">Blog management</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">Edit post</h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    Update content, metadata, and publishing status.
                </p>
            </section>

            <AddEditBlogForm
                mode="edit"
                postId={post.id}
                initialValues={{
                    title: post.title,
                    slug: post.slug,
                    excerpt: post.excerpt,
                    content: post.content,
                    coverImage: post.coverImage ?? "",
                    category: post.category ?? "",
                    tags: post.tags ?? [],
                    seoTitle: post.seoTitle ?? "",
                    seoDescription: post.seoDescription ?? "",
                    status: post.status,
                }}
            />
        </main>
    );
}