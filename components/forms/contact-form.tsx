// components/contact-form.tsx
"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
    contactFormSchema,
    type ContactFormValues,
} from "@/lib/validations/contact";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";

type ContactApiErrorResponse = {
    ok?: false;
    error?: string;
    fieldErrors?: Partial<Record<keyof ContactFormValues, string[]>>;
};

type ContactApiSuccessResponse = {
    ok: true;
    id: string;
    message?: string;
};

export function ContactForm() {
    const [serverMessage, setServerMessage] = React.useState<string | null>(null);
    const [serverError, setServerError] = React.useState<string | null>(null);

    const form = useForm<ContactFormValues>({
        resolver: zodResolver(contactFormSchema),
        defaultValues: {
            name: "",
            email: "",
            subject: "general",
            message: "",
            phone: "",
            company: "",
        },
        mode: "onSubmit",
    });

    const {
        register,
        control,
        handleSubmit,
        setError,
        reset,
        formState: { errors, isSubmitting },
    } = form;

    async function onSubmit(values: ContactFormValues) {
        setServerMessage(null);
        setServerError(null);

        const res = await fetch("/api/contact", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(values),
        });

        const data = (await res.json()) as
            | ContactApiErrorResponse
            | ContactApiSuccessResponse;

        if (!res.ok) {
            if ("fieldErrors" in data && data.fieldErrors) {
                for (const [key, messages] of Object.entries(data.fieldErrors)) {
                    if (messages?.[0]) {
                        setError(key as keyof ContactFormValues, {
                            type: "server",
                            message: messages[0],
                        });
                    }
                }
            }

            setServerError(
                ("error" in data && data.error) ||
                "Something went wrong. Please try again."
            );
            return;
        }

        if (data.ok) {
            setServerMessage(data.message ?? "Your message has been sent.");
        }
        reset({
            name: "",
            email: "",
            subject: "general",
            message: "",
            phone: "",
            company: "",
        });
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
                <Field data-invalid={!!errors.name}>
                    <FieldContent>
                        <FieldLabel htmlFor="name">Name</FieldLabel>
                        <Input
                            id="name"
                            placeholder="Your name"
                            aria-invalid={!!errors.name}
                            {...register("name")}
                        />
                        <FieldError errors={[errors.name]} />
                    </FieldContent>
                </Field>

                <Field data-invalid={!!errors.email}>
                    <FieldContent>
                        <FieldLabel htmlFor="email">Email</FieldLabel>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            aria-invalid={!!errors.email}
                            {...register("email")}
                        />
                        <FieldError errors={[errors.email]} />
                    </FieldContent>
                </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
                <Field data-invalid={!!errors.company}>
                    <FieldContent>
                        <FieldLabel htmlFor="company">Company</FieldLabel>
                        <Input
                            id="company"
                            placeholder="Your company"
                            aria-invalid={!!errors.company}
                            {...register("company")}
                        />
                        <FieldDescription>Optional</FieldDescription>
                        <FieldError errors={[errors.company]} />
                    </FieldContent>
                </Field>

                <Field data-invalid={!!errors.phone}>
                    <FieldContent>
                        <FieldLabel htmlFor="phone">Phone</FieldLabel>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="+91 98765 43210"
                            aria-invalid={!!errors.phone}
                            {...register("phone")}
                        />
                        <FieldDescription>Optional</FieldDescription>
                        <FieldError errors={[errors.phone]} />
                    </FieldContent>
                </Field>
            </div>

            <Field data-invalid={!!errors.subject}>
                <FieldContent>
                    <FieldLabel htmlFor="subject">Subject</FieldLabel>
                    <Controller
                        control={control}
                        name="subject"
                        render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger id="subject" aria-invalid={!!errors.subject}>
                                    <SelectValue placeholder="Select a subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="general">General inquiry</SelectItem>
                                    <SelectItem value="support">Support</SelectItem>
                                    <SelectItem value="billing">Billing</SelectItem>
                                    <SelectItem value="security">Security</SelectItem>
                                    <SelectItem value="partnership">Partnership</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    <FieldDescription>
                        Choose the category that best matches your message.
                    </FieldDescription>
                    <FieldError errors={[errors.subject]} />
                </FieldContent>
            </Field>

            <Field data-invalid={!!errors.message}>
                <FieldContent>
                    <FieldLabel htmlFor="message">Message</FieldLabel>
                    <Textarea
                        id="message"
                        rows={6}
                        placeholder="How can we help?"
                        className="resize-none"
                        aria-invalid={!!errors.message}
                        {...register("message")}
                    />
                    <FieldError errors={[errors.message]} />
                </FieldContent>
            </Field>

            {serverError ? (
                <p className="text-sm text-red-600" role="alert">
                    {serverError}
                </p>
            ) : null}

            {serverMessage ? (
                <p className="text-sm text-emerald-600" role="status">
                    {serverMessage}
                </p>
            ) : null}

            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? "Sending..." : "Send message"}
            </Button>
        </form>
    );
}