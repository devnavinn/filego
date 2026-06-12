import { z } from "zod";

export const forgotPasswordSchema = z.object({
    email: z.string().trim().email("Enter a valid email address."),
});

export const resetPasswordFormSchema = z
    .object({
        password: z
            .string()
            .min(8, "Use at least 8 characters.")
            .regex(/[A-Z]/, "Include at least one uppercase letter.")
            .regex(/[a-z]/, "Include at least one lowercase letter.")
            .regex(/[0-9]/, "Include at least one number."),
        confirmPassword: z.string().min(1, "Please confirm your password."),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match.",
        path: ["confirmPassword"],
    });

export const resetPasswordSchema = resetPasswordFormSchema.extend({
    token: z.string().min(1, "Reset token is required."),
});