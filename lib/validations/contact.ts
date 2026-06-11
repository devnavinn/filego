// lib/validations/contact.ts
import { z } from "zod";

export const contactSubjectOptions = [
    "general",
    "support",
    "billing",
    "security",
    "partnership",
] as const;

export const contactFormSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters.")
        .max(80, "Name must be under 80 characters."),
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Please enter a valid email address.")
        .max(255, "Email is too long."),
    subject: z.enum(contactSubjectOptions),
    message: z
        .string()
        .trim()
        .min(10, "Message must be at least 10 characters.")
        .max(5000, "Message must be under 5000 characters."),
    phone: z
        .string()
        .trim()
        .max(30, "Phone must be under 30 characters.")
        .optional()
        .or(z.literal("")),
    company: z
        .string()
        .trim()
        .max(120, "Company must be under 120 characters.")
        .optional()
        .or(z.literal("")),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;