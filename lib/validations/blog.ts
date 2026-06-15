// lib/validations/blog.ts
import { z } from "zod";

export const blogStatusEnum = z.enum(["DRAFT", "PUBLISHED"]);

export const blogPostSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters."),
    slug: z
        .string()
        .min(3, "Slug is required.")
        .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens."),
    excerpt: z.string().min(20, "Excerpt must be at least 20 characters.").max(220),
    content: z.string().min(50, "Content must be at least 50 characters."),
    coverImage: z.string().url().optional().or(z.literal("")).transform((v) => v || undefined),
    category: z.string().optional(),
    tags: z.array(z.string()).default([]),
    seoTitle: z.string().max(70).optional(),
    seoDescription: z.string().max(160).optional(),
    status: blogStatusEnum,
});

export type BlogPostInput = z.infer<typeof blogPostSchema>;