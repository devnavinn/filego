// app/sitemap.ts
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = "https://www.filego.in";

    const staticRoutes = [
        "",
        "/blog",
        "/contact",
        "/security",
        "/cookies",
        "/pdf-forms",
        "/pdf-to-jpg",
        "/pdf-to-word",
        "/rotate-pdf",
        "/scan-to-pdf",
        "/split-pdf",
        "/word-to-pdf",
        "/bulk-image-compress",
        "/image-squoosh",
    ];

    const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: route === "" ? "daily" : route === "/blog" ? "daily" : "weekly",
        priority: route === "" ? 1 : route === "/blog" ? 0.9 : 0.8,
    }));

    const posts = await prisma.blogPost.findMany({
        where: {
            status: "PUBLISHED",
        },
        select: {
            slug: true,
            updatedAt: true,
            publishedAt: true,
        },
        orderBy: {
            publishedAt: "desc",
        },
    });

    const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.updatedAt ?? post.publishedAt ?? new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
    }));

    return [...staticEntries, ...blogEntries];
}