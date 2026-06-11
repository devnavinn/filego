"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldLabel,
} from "@/components/ui/field";
import { notifySchema, type NotifyInput } from "@/lib/validations/notify";

type NotifyFormProps = {
    source?: string;
    page?: string | null;
    placeholder?: string;
};

type NotifyApiSuccess = {
    ok: true;
    message: string;
};

type NotifyApiError = {
    ok: false;
    error: string;
    fieldErrors?: Partial<Record<keyof NotifyInput, string[]>>;
};

export function NotifyForm({
    source = "coming-soon",
    page = null,
    placeholder = "Enter your email for launch updates",
}: NotifyFormProps) {
    const [serverMessage, setServerMessage] = React.useState("");
    const [serverError, setServerError] = React.useState("");

    const form = useForm<NotifyInput>({
        resolver: zodResolver(notifySchema),
        defaultValues: {
            email: "",
            source,
            page,
        },
    });

    const {
        control,
        handleSubmit,
        setError,
        reset,
        formState: { isSubmitting, errors },
    } = form;

    const onSubmit = async (values: NotifyInput) => {
        setServerMessage("");
        setServerError("");

        const res = await fetch("/api/notify", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(values),
        });

        const data = (await res.json()) as NotifyApiSuccess | NotifyApiError;

        if (!res.ok) {
            if ("fieldErrors" in data && data.fieldErrors?.email?.[0]) {
                setError("email", {
                    type: "server",
                    message: data.fieldErrors.email[0],
                });
            }

            setServerError("error" in data ? data.error : "Something went wrong.");
            return;
        }
        if (data.ok) {
            setServerMessage(data.message);
        }
        reset({
            email: "",
            source,
            page,
        });
    };

    return (
        <div className="rounded-2xl border bg-muted/40 p-4">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl bg-background p-2 shadow-sm">
                    <Bell className="h-4 w-4" />
                </div>

                <div>
                    <h3 className="text-sm font-semibold">Get launch updates</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Join the waitlist to get notified when this tool goes live.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3" noValidate>
                <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                        <Field data-invalid={!!errors.email}>
                            <FieldLabel className="sr-only">Email</FieldLabel>
                            <FieldContent>
                                <Input
                                    {...field}
                                    type="email"
                                    placeholder={placeholder}
                                    className="h-11 rounded-xl"
                                    aria-invalid={!!errors.email}
                                />
                                <FieldError errors={[errors.email]} />
                            </FieldContent>
                        </Field>
                    )}
                />

                <Button type="submit" className="h-11 w-full rounded-xl" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Notify me"}
                </Button>
            </form>

            {serverMessage ? (
                <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">
                    {serverMessage}
                </p>
            ) : null}

            {serverError ? (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                    {serverError}
                </p>
            ) : null}

            {!serverMessage && !serverError ? (
                <Field>
                    <FieldDescription className="mt-3 text-xs text-muted-foreground">
                        No spam. Just launch updates and major product news.
                    </FieldDescription>
                </Field>
            ) : null}
        </div>
    );
}