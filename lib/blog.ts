// lib/blog.ts
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
const POSTS_PER_PAGE = 10;
export async function getPublishedBlogPosts(page: number = 1) {
    const currentPage = Math.max(1, page);
    const skip = (currentPage - 1) * POSTS_PER_PAGE;

    const getCachedPage = unstable_cache(
        async () => {
            const [items, total] = await Promise.all([
                prisma.blogPost.findMany({
                    where: {
                        status: "PUBLISHED",
                    },
                    orderBy: {
                        publishedAt: "desc",
                    },
                    skip,
                    take: POSTS_PER_PAGE,
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        excerpt: true,
                        category: true,
                        coverImage: true,
                        publishedAt: true,
                        updatedAt: true,
                    },
                }),
                prisma.blogPost.count({
                    where: {
                        status: "PUBLISHED",
                    },
                }),
            ]);

            return {
                items,
                total,
                page: currentPage,
                pageSize: POSTS_PER_PAGE,
                totalPages: Math.max(1, Math.ceil(total / POSTS_PER_PAGE)),
            };
        },
        [`published-blog-posts-page-${currentPage}`],
        {
            revalidate: 3600,
            tags: ["blog-list"],
        }
    );

    return getCachedPage();
}
export const getPublishedBlogPostBySlug = (slug: string) =>
    unstable_cache(
        async () => {
            return prisma.blogPost.findFirst({
                where: {
                    slug,
                    status: "PUBLISHED",
                },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    excerpt: true,
                    content: true,
                    category: true,
                    coverImage: true,
                    seoTitle: true,
                    seoDescription: true,
                    publishedAt: true,
                    updatedAt: true,
                },
            });
        },
        [`blog-post-${slug}`],
        {
            revalidate: 3600,
            tags: [`blog-post-${slug}`],
        }
    )();