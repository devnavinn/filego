export type BlogPostStatus = "draft" | "published";

export interface BlogPost {
    _id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage?: string;
    category?: string;
    tags?: string[];
    seoTitle?: string;
    seoDescription?: string;
    status: BlogPostStatus;
    publishedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}