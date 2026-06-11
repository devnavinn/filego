import { z } from "zod";

export const notifySchema = z.object({
    email: z
        .string()
        .trim()
        .min(1, "Email is required")
        .email("Enter a valid email address"),
    source: z.string().trim().min(1).max(100).optional(),
    page: z.string().trim().max(255).nullable().optional(),
});

export type NotifyInput = z.infer<typeof notifySchema>;