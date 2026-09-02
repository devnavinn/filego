// app/sitemap.ts
import type { MetadataRoute } from "next"

import { prisma } from "@/lib/prisma"
import { toolCategories } from "@/lib/tools-data"
import { FORM_TEMPLATES } from "@/lib/pdf-form-templates"

export const dynamic = "force-dynamic"

const BASE_URL = "https://www.filego.in"

function toAbsoluteUrl(path: string) {
    return `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date()

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
        "/tools",
    ]

    const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
        url: toAbsoluteUrl(route),
        lastModified: now,
        changeFrequency:
            route === ""
                ? "daily"
                : route === "/blog"
                    ? "daily"
                    : route === "/tools"
                        ? "weekly"
                        : "weekly",
        priority:
            route === ""
                ? 1
                : route === "/blog"
                    ? 0.9
                    : route === "/tools"
                        ? 0.95
                        : 0.8,
    }))

    const categoryEntries: MetadataRoute.Sitemap = toolCategories.map((category) => ({
        url: toAbsoluteUrl(`/tools/${category.slug}`),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.85,
    }))

    const singleToolEntries: MetadataRoute.Sitemap = toolCategories.flatMap((category) =>
        category.tools.map((tool) => ({
            url: toAbsoluteUrl(`/tools/${category.slug}/${tool.slug}`),
            lastModified: now,
            changeFrequency: "weekly",
            priority: 0.75,
        }))
    )

    const pdfFormEntries: MetadataRoute.Sitemap = [
        ...FORM_TEMPLATES.map((template) => template.id),
        "mcq-quiz",
        "upload",
    ].map((slug) => ({
        url: toAbsoluteUrl(`/pdf-forms/${slug}`),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.75,
    }))

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
    })

    const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
        url: toAbsoluteUrl(`/blog/${post.slug}`),
        lastModified: post.updatedAt ?? post.publishedAt ?? now,
        changeFrequency: "weekly",
        priority: 0.7,
    }))

    return [
        ...staticEntries,
        ...categoryEntries,
        ...singleToolEntries,
        ...pdfFormEntries,
        ...blogEntries,
    ]
}