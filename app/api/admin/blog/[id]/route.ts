// app/api/admin/blog/[id]/route.ts
import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { blogPostSchema } from "@/lib/validations/blog";
import { destroyCloudinaryImage } from "@/lib/cloudinary";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await requireAdmin();
    const { id } = await params;

    const post = await prisma.blogPost.findUnique({
        where: { id },
    });

    if (!post) {
        return NextResponse.json(
            { ok: false, error: "Post not found." },
            { status: 404 }
        );
    }

    return NextResponse.json({ ok: true, item: post });
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await requireAdmin();

    try {
        const { id } = await params;
        const json = await req.json();
        const parsed = blogPostSchema.safeParse(json);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Validation failed.",
                    fieldErrors: parsed.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        const data = parsed.data;

        const existing = await prisma.blogPost.findFirst({
            where: {
                slug: data.slug,
                NOT: { id },
            },
            select: { id: true },
        });

        if (existing) {
            return NextResponse.json(
                { ok: false, error: "Slug already exists." },
                { status: 409 }
            );
        }

        const current = await prisma.blogPost.findUnique({
            where: { id },
            select: {
                id: true,
                slug: true,
                status: true,
                publishedAt: true,
                coverImage: true,
                coverImageId: true,
            },
        });

        if (!current) {
            return NextResponse.json(
                { ok: false, error: "Post not found." },
                { status: 404 }
            );
        }

        const nextCoverImage = data.coverImage ?? null;
        const nextCoverImageId = data.coverImageId ?? null;

        const coverImageChanged =
            current.coverImage !== nextCoverImage ||
            current.coverImageId !== nextCoverImageId;

        const post = await prisma.blogPost.update({
            where: { id },
            data: {
                title: data.title,
                slug: data.slug,
                excerpt: data.excerpt,
                content: data.content,
                coverImage: nextCoverImage,
                coverImageId: nextCoverImageId,
                category: data.category,
                tags: data.tags,
                seoTitle: data.seoTitle,
                seoDescription: data.seoDescription,
                status: data.status,
                publishedAt:
                    data.status === "PUBLISHED" && !current.publishedAt
                        ? new Date()
                        : data.status === "DRAFT"
                            ? null
                            : current.publishedAt,
            },
        });

        if (
            coverImageChanged &&
            current.coverImageId &&
            current.coverImageId !== nextCoverImageId
        ) {
            try {
                await destroyCloudinaryImage(current.coverImageId);
            } catch (error) {
                console.error("DELETE_OLD_CLOUDINARY_IMAGE_ERROR", error);
            }
        }

        const wasPublished = current.status === "PUBLISHED";
        const isPublished = post.status === "PUBLISHED";
        const slugChanged = current.slug !== post.slug;

        if (wasPublished || isPublished) {
            revalidatePath("/blog");
            revalidateTag("blog-list", "max");

            if (wasPublished) {
                revalidatePath(`/blog/${current.slug}`);
                revalidateTag(`blog-post-${current.slug}`, "max");
            }

            if (isPublished) {
                revalidatePath(`/blog/${post.slug}`);
                revalidateTag(`blog-post-${post.slug}`, "max");
            }

            if (slugChanged) {
                revalidatePath(`/blog/${current.slug}`);
                revalidatePath(`/blog/${post.slug}`);
                revalidateTag(`blog-post-${current.slug}`, "max");
                revalidateTag(`blog-post-${post.slug}`, "max");
            }
        }

        return NextResponse.json({
            ok: true,
            item: post,
            message: "Blog post updated successfully.",
        });
    } catch (error) {
        console.error("UPDATE_BLOG_POST_ERROR", error);

        return NextResponse.json(
            { ok: false, error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await requireAdmin();
    const { id } = await params;

    const existing = await prisma.blogPost.findUnique({
        where: { id },
        select: {
            id: true,
            slug: true,
            status: true,
            coverImageId: true,
        },
    });

    if (!existing) {
        return NextResponse.json(
            { ok: false, error: "Post not found." },
            { status: 404 }
        );
    }

    await prisma.blogPost.delete({
        where: { id },
    });

    if (existing.coverImageId) {
        try {
            await destroyCloudinaryImage(existing.coverImageId);
        } catch (error) {
            console.error("DELETE_CLOUDINARY_IMAGE_ON_POST_DELETE_ERROR", error);
        }
    }

    if (existing.status === "PUBLISHED") {
        revalidatePath("/blog");
        revalidatePath(`/blog/${existing.slug}`);
        revalidateTag("blog-list", "max");
        revalidateTag(`blog-post-${existing.slug}`, "max");
    }

    return NextResponse.json({
        ok: true,
        message: "Blog post deleted successfully.",
    });
}