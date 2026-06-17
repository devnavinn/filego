"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

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

const loginSchema = z.object({
    email: z.string().trim().email("Enter a valid email address."),
    password: z.string().min(1, "Password is required."),
});

type LoginInput = z.infer<typeof loginSchema>;

function getRoleRedirect(role?: string) {
    switch (role) {
        case "ADMIN":
            return "/admin/dashboard";
        case "USER":
            return "/";
        default:
            return "/dashboard";
    }
}

export function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl");

    const [serverError, setServerError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: LoginInput) {
        setServerError("");
        setIsSubmitting(true);

        try {
            const result = await signIn("credentials", {
                email: values.email,
                password: values.password,
                redirect: false,
            });

            if (!result) {
                setServerError("Unable to sign in. Please try again.");
                return;
            }

            if (result.error) {
                setServerError("Invalid email or password.");
                return;
            }

            const session = await getSession();
            const role = (session?.user as any)?.role;

            const redirectTo = callbackUrl || getRoleRedirect(role);

            router.push(redirectTo);
            router.refresh();
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
                                    {fieldState.invalid ? (
                                        <FieldError errors={[fieldState.error]} />
                                    ) : null}
                                </FieldContent>
                            </Field>
                        )}
                    />

                    <Controller
                        control={form.control}
                        name="password"
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <div className="flex items-center justify-between gap-3">
                                    <FieldLabel htmlFor="password">Password</FieldLabel>
                                    <Link
                                        href="/forgot-password"
                                        className="text-xs font-medium text-muted-foreground underline underline-offset-4"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <FieldContent>
                                    <Input
                                        {...field}
                                        id="password"
                                        type="password"
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                        aria-invalid={fieldState.invalid}
                                        className="h-11 rounded-xl"
                                    />
                                    <FieldDescription>
                                        Use the password you created during registration.
                                    </FieldDescription>
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
                {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>

            <FieldSeparator />

            <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                    href="/register"
                    className="font-medium text-foreground underline underline-offset-4"
                >
                    Create one
                </Link>
            </p>
        </form>
    );
}