// app/api/admin/blog/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { blogPostSchema } from "@/lib/validations/blog";

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
            select: { status: true, publishedAt: true },
        });

        if (!current) {
            return NextResponse.json(
                { ok: false, error: "Post not found." },
                { status: 404 }
            );
        }

        const post = await prisma.blogPost.update({
            where: { id },
            data: {
                title: data.title,
                slug: data.slug,
                excerpt: data.excerpt,
                content: data.content,
                coverImage: data.coverImage,
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

        return NextResponse.json({
            ok: true,
            item: post,
            message: "Blog post updated successfully.",
        });
    } catch {
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
        select: { id: true },
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

    return NextResponse.json({
        ok: true,
        message: "Blog post deleted successfully.",
    });
}