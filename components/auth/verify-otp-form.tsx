"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldSeparator,
    FieldSet,
    FieldLabel,
} from "@/components/ui/field";

const otpSchema = z.object({
    otp: z.string().length(6, "Enter the 6-digit code."),
});

type VerifyOtpInput = z.infer<typeof otpSchema>;

export function VerifyOtpForm({ email }: { email: string }) {
    const router = useRouter();
    const [serverError, setServerError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);

    const form = useForm<VerifyOtpInput>({
        resolver: zodResolver(otpSchema),
        defaultValues: {
            otp: "",
        },
    });

    async function onSubmit(values: VerifyOtpInput) {
        setServerError("");
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/verify-email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    otp: values.otp,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setServerError(data.error || "Verification failed.");
                return;
            }

            router.push("/login?verified=1");
        } catch {
            setServerError("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function resendCode() {
        setServerError("");
        setIsResending(true);

        try {
            const res = await fetch("/api/register/resend-otp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                setServerError(data.error || "Could not resend code.");
            }
        } catch {
            setServerError("Unable to resend code right now.");
        } finally {
            setIsResending(false);
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FieldSet>
                <Controller
                    control={form.control}
                    name="otp"
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel>Verification code</FieldLabel>
                            <FieldContent>
                                <InputOTP
                                    maxLength={6}
                                    pattern={REGEXP_ONLY_DIGITS}
                                    value={field.value}
                                    onChange={field.onChange}
                                    aria-invalid={fieldState.invalid}
                                >
                                    <InputOTPGroup className="gap-2">
                                        <InputOTPSlot index={0} className="h-12 w-12 rounded-xl border" />
                                        <InputOTPSlot index={1} className="h-12 w-12 rounded-xl border" />
                                        <InputOTPSlot index={2} className="h-12 w-12 rounded-xl border" />
                                        <InputOTPSlot index={3} className="h-12 w-12 rounded-xl border" />
                                        <InputOTPSlot index={4} className="h-12 w-12 rounded-xl border" />
                                        <InputOTPSlot index={5} className="h-12 w-12 rounded-xl border" />
                                    </InputOTPGroup>
                                </InputOTP>
                                <FieldDescription>
                                    The code expires in a few minutes for security.
                                </FieldDescription>
                                {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} />
                                )}
                            </FieldContent>
                        </Field>
                    )}
                />
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
                {isSubmitting ? "Verifying..." : "Verify email"}
            </Button>

            <div className="flex items-center justify-between gap-3 text-sm">
                <button
                    type="button"
                    onClick={resendCode}
                    disabled={isResending}
                    className="font-medium text-foreground underline underline-offset-4 disabled:opacity-60"
                >
                    {isResending ? "Resending..." : "Resend code"}
                </button>

                <Link
                    href="/register"
                    className="text-muted-foreground underline underline-offset-4"
                >
                    Start over
                </Link>
            </div>

            <FieldSeparator />
        </form>
    );
}