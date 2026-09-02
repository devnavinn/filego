"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldSeparator,
    FieldSet,
} from "@/components/ui/field";

const registerSchema = z.object({
    name: z.string().min(2, "Enter your full name."),
    email: z.string().email("Enter a valid email address."),
    password: z
        .string()
        .min(8, "Use at least 8 characters.")
        .regex(/[A-Z]/, "Include at least one uppercase letter.")
        .regex(/[a-z]/, "Include at least one lowercase letter.")
        .regex(/[0-9]/, "Include at least one number."),
});

type RegisterInput = z.infer<typeof registerSchema>;

export function RegisterForm() {
    const router = useRouter();
    const [serverError, setServerError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: RegisterInput) {
        setServerError("");
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            });

            const data = await res.json();

            if (!res.ok) {
                setServerError(data.error || "Unable to create account.");
                return;
            }

            router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
        } catch {
            setServerError("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <OAuthButtons />

            <FieldSet>
                <FieldGroup>
                    <Controller
                        control={form.control}
                        name="name"
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="name">Full name</FieldLabel>
                                <FieldContent>
                                    <Input
                                        {...field}
                                        id="name"
                                        placeholder="Navin Kumar"
                                        autoComplete="name"
                                        aria-invalid={fieldState.invalid}
                                        className="h-11 rounded-xl"
                                    />
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </FieldContent>
                            </Field>
                        )}
                    />

                    <Controller
                        control={form.control}
                        name="email"
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <FieldContent>
                                    <Input
                                        {...field}
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        autoComplete="email"
                                        aria-invalid={fieldState.invalid}
                                        className="h-11 rounded-xl"
                                    />
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </FieldContent>
                            </Field>
                        )}
                    />

                    <Controller
                        control={form.control}
                        name="password"
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="password">Password</FieldLabel>
                                <FieldContent>
                                    <Input
                                        {...field}
                                        id="password"
                                        type="password"
                                        placeholder="Create a strong password"
                                        autoComplete="new-password"
                                        aria-invalid={fieldState.invalid}
                                        className="h-11 rounded-xl"
                                    />
                                    <FieldDescription>
                                        Minimum 8 characters, with uppercase, lowercase, and a number.
                                    </FieldDescription>
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </FieldContent>
                            </Field>
                        )}
                    />
                </FieldGroup>
            </FieldSet>

            {serverError ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {serverError}
                </div>
            ) : null}

            <Button
                type="submit"
                className="h-11 w-full rounded-xl"
                disabled={isSubmitting}
            >
                {isSubmitting ? "Sending code..." : "Create account"}
            </Button>

            <FieldSeparator />

            <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                    href="/login"
                    className="font-medium text-foreground underline underline-offset-4"
                >
                    Sign in
                </Link>
            </p>
        </form>
    );
}