import { z } from "zod";

export const blogPostSchema = z.object({
    title: z.string().trim().min(3).max(160),
    slug: z.string().trim().min(3).max(180),
    excerpt: z.string().trim().min(10).max(300),
    content: z.string().trim().min(50),
    coverImage: z.preprocess(
        (value) => {
            if (typeof value === "string" && value.trim() === "") {
                return null;
            }
            return value;
        },
        z.string().trim().url("Cover image must be a valid URL.").nullable().optional()
    ),
    coverImageId: z
        .string()
        .trim()
        .min(1)
        .max(255)
        .nullable()
        .optional()
        .transform((v) => v || null),
    category: z.string().trim().min(2).max(60),
    tags: z.array(z.string().trim().min(1).max(40)).default([]),
    seoTitle: z.string().trim().max(160).nullable().optional().transform((v) => v || null),
    seoDescription: z.string().trim().max(200).nullable().optional().transform((v) => v || null),
    status: z.enum(["DRAFT", "PUBLISHED"]),
});