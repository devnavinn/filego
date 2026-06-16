import { z } from "zod";

export const generateBlogImageSchema = z.object({
    title: z.string().trim().min(3).max(160),
    excerpt: z.string().trim().min(10).max(300).optional().default(""),
    category: z.string().trim().min(2).max(60).optional().default("Blog"),
    style: z.string().trim().min(2).max(100).optional().default("clean modern editorial"),
    aspectRatio: z.enum(["1:1", "3:4", "4:3", "9:16", "16:9"]).optional().default("16:9"),
});