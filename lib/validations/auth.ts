import { z } from "zod";

export const registerSchema = z.object({
    name: z.string().trim().min(2, "Enter your full name."),
    email: z.string().trim().email("Enter a valid email."),
    password: z
        .string()
        .min(8, "Use at least 8 characters.")
        .regex(/[A-Z]/, "Include at least one uppercase letter.")
        .regex(/[a-z]/, "Include at least one lowercase letter.")
        .regex(/[0-9]/, "Include at least one number."),
});

export const verifyEmailSchema = z.object({
    email: z.string().trim().email("Enter a valid email."),
    otp: z.string().length(6, "Enter the 6-digit code."),
});

export const resendOtpSchema = z.object({
    email: z.string().trim().email("Enter a valid email."),
});