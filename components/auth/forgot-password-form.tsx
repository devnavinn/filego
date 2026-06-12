"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { z } from "zod";
import { forgotPasswordSchema } from "@/lib/validations/password-reset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldSeparator,
    FieldSet,
    FieldLabel,
} from "@/components/ui/field";

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
    const [serverMessage, setServerMessage] = useState("");
    const [serverError, setServerError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ForgotPasswordInput>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: "",
        },
    });

    async function onSubmit(values: ForgotPasswordInput) {
        setServerError("");
        setServerMessage("");
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            });

            const data = await res.json();

            if (!res.ok) {
                setServerError(data.error || "Unable to send reset email.");
                return;
            }

            setServerMessage(
                data.message || "If an account exists, a reset link has been sent."
            );
            form.reset();
        } catch {
            setServerError("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FieldSet>
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
                                <FieldDescription>
                                    Enter the email you used when creating your account.
                                </FieldDescription>
                                {fieldState.invalid ? (
                                    <FieldError errors={[fieldState.error]} />
                                ) : null}
                            </FieldContent>
                        </Field>
                    )}
                />
            </FieldSet>

            {serverMessage ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
                    {serverMessage}
                </div>
            ) : null}

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
                {isSubmitting ? "Sending link..." : "Send reset link"}
            </Button>

            <FieldSeparator />

            <p className="text-center text-sm text-muted-foreground">
                Remembered your password?{" "}
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