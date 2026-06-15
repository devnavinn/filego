// app/api/admin/blog/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { blogPostSchema } from "@/lib/validations/blog";

export async function GET(req: Request) {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const take = Math.min(20, Math.max(1, Number(searchParams.get("take")) || 10));
    const skip = (page - 1) * take;

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

    const [items, total] = await Promise.all([
        prisma.blogPost.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
        }),
        prisma.blogPost.count({ where }),
    ]);

    return NextResponse.json({
        ok: true,
        items,
        total,
        page,
        take,
        totalPages: Math.max(1, Math.ceil(total / take)),
    });
}

export async function POST(req: Request) {
    await requireAdmin();

    try {
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

        const existing = await prisma.blogPost.findUnique({
            where: { slug: data.slug },
            select: { id: true },
        });

        if (existing) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Slug already exists.",
                },
                { status: 409 }
            );
        }

        const post = await prisma.blogPost.create({
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
                publishedAt: data.status === "PUBLISHED" ? new Date() : null,
            },
        });

        return NextResponse.json(
            {
                ok: true,
                item: post,
                message: "Blog post created successfully.",
            },
            { status: 201 }
        );
    } catch {
        return NextResponse.json(
            {
                ok: false,
                error: "Something went wrong. Please try again.",
            },
            { status: 500 }
        );
    }
}