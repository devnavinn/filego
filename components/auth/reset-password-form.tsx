"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { z } from "zod";
import { resetPasswordFormSchema } from "@/lib/validations/password-reset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldSeparator,
    FieldSet,
    FieldLabel,
} from "@/components/ui/field";

type ResetPasswordInput = z.infer<typeof resetPasswordFormSchema>;

export function ResetPasswordForm({ token }: { token: string }) {
    const router = useRouter();
    const [serverError, setServerError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ResetPasswordInput>({
        resolver: zodResolver(resetPasswordFormSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    async function onSubmit(values: ResetPasswordInput) {
        setServerError("");
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token,
                    password: values.password,
                    confirmPassword: values.confirmPassword,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setServerError(data.error || "Unable to reset password.");
                return;
            }

            router.push("/login?reset=1");
        } catch {
            setServerError("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FieldSet>
                <FieldGroup>
                    <Controller
                        control={form.control}
                        name="password"
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="password">New password</FieldLabel>
                                <FieldContent>
                                    <Input
                                        {...field}
                                        id="password"
                                        type="password"
                                        autoComplete="new-password"
                                        placeholder="Enter a new password"
                                        aria-invalid={fieldState.invalid}
                                        className="h-11 rounded-xl"
                                    />
                                    <FieldDescription>
                                        Minimum 8 characters, with uppercase, lowercase, and a number.
                                    </FieldDescription>
                                    {fieldState.invalid ? (
                                        <FieldError errors={[fieldState.error]} />
                                    ) : null}
                                </FieldContent>
                            </Field>
                        )}
                    />

                    <Controller
                        control={form.control}
                        name="confirmPassword"
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
                                <FieldContent>
                                    <Input
                                        {...field}
                                        id="confirmPassword"
                                        type="password"
                                        autoComplete="new-password"
                                        placeholder="Re-enter your new password"
                                        aria-invalid={fieldState.invalid}
                                        className="h-11 rounded-xl"
                                    />
                                    {fieldState.invalid ? (
                                        <FieldError errors={[fieldState.error]} />
                                    ) : null}
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
                {isSubmitting ? "Updating password..." : "Update password"}
            </Button>

            <FieldSeparator />

            <p className="text-center text-sm text-muted-foreground">
                Back to{" "}
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