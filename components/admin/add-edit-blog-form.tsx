// components/admin/add-edit-blog-form.tsx
"use client";

import * as React from "react";
import { Controller, useForm, type FieldPath } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { blogPostSchema } from "@/lib/validations/blog";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldLabel,
} from "@/components/ui/field";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

type BlogPostFormInput = z.input<typeof blogPostSchema>;
type BlogPostFormOutput = z.output<typeof blogPostSchema>;

interface AddEditBlogFormProps {
    mode: "create" | "edit";
    initialValues?: Partial<BlogPostFormInput>;
    postId?: string;
}

function slugify(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

async function generateCoverImage(input: {
    title: string;
    excerpt?: string;
    category?: string;
}) {
    const res = await fetch("/api/admin/blog/generate-image", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            title: input.title,
            excerpt: input.excerpt ?? "",
            category: input.category ?? "Blog",
            style: "clean modern editorial",
            aspectRatio: "16:9",
        }),
    });

    const data = await res.json();

    if (!res.ok || !data?.ok) {
        if (res.status === 429) {
            throw new Error(
                data?.error || "Image generation quota exceeded. Try again later."
            );
        }

        throw new Error(data?.error || "Failed to generate image.");
    }

    return data.item as {
        publicId: string;
        url: string;
        width: number;
        height: number;
        format: string;
        bytes: number;
        assetId: string;
    };
}

export function AddEditBlogForm({
    mode,
    initialValues,
    postId,
}: AddEditBlogFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [slugTouched, setSlugTouched] = React.useState(false);
    const [serverError, setServerError] = React.useState<string | null>(null);

    const form = useForm<BlogPostFormInput, unknown, BlogPostFormOutput>({
        resolver: zodResolver(blogPostSchema),
        defaultValues: {
            title: initialValues?.title ?? "",
            slug: initialValues?.slug ?? "",
            excerpt: initialValues?.excerpt ?? "",
            content: initialValues?.content ?? "",
            coverImage: initialValues?.coverImage ?? "",
            category: initialValues?.category ?? "",
            tags: initialValues?.tags ?? [],
            seoTitle: initialValues?.seoTitle ?? "",
            seoDescription: initialValues?.seoDescription ?? "",
            status: initialValues?.status ?? "DRAFT",
        },
    });

    const {
        register,
        control,
        watch,
        setValue,
        setError,
        handleSubmit,
        formState: { errors },
    } = form;

    const titleValue = watch("title");
    const tagsValue = watch("tags") || [];
    const slugValue = watch("slug");

    React.useEffect(() => {
        if (!slugTouched && titleValue) {
            setValue("slug", slugify(titleValue), { shouldValidate: true });
        }
    }, [titleValue, slugTouched, setValue]);

    async function onSubmit(values: BlogPostFormOutput) {
        setIsSubmitting(true);
        setServerError(null);

        try {
            let coverImage = values.coverImage ?? null;
            let coverImageId = values.coverImageId ?? null;

            if (mode === "create" && !coverImage) {
                try {
                    const generated = await generateCoverImage({
                        title: values.title,
                        excerpt: values.excerpt,
                        category: values.category,
                    });

                    coverImage = generated.url;
                    coverImageId = generated.publicId;
                } catch (error) {
                    console.error("COVER_IMAGE_GENERATION_ERROR", error);
                }
            }

            const payload = {
                ...values,
                coverImage,
                coverImageId,
                category: values.category || undefined,
                seoTitle: values.seoTitle || undefined,
                seoDescription: values.seoDescription || undefined,
                tags: values.tags ?? [],
            };

            const endpoint =
                mode === "create" ? "/api/admin/blog" : `/api/admin/blog/${postId}`;
            const method = mode === "create" ? "POST" : "PUT";

            const res = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data?.fieldErrors) {
                    Object.entries(data.fieldErrors).forEach(([key, messages]) => {
                        const message = Array.isArray(messages) ? messages[0] : undefined;
                        if (message) {
                            setError(key as FieldPath<BlogPostFormInput>, {
                                type: "server",
                                message,
                            });
                        }
                    });
                }

                setServerError(data?.error || "Something went wrong.");
                return;
            }

            router.refresh();
            router.push("/admin/blog");
        } catch (error) {
            console.error("BLOG_SUBMIT_ERROR", error);
            setServerError("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl tracking-tight">
                        {mode === "create" ? "Create blog post" : "Edit blog post"}
                    </CardTitle>
                    <CardDescription>
                        Write SEO-friendly content for Filego tools and workflows.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <Field>
                            <FieldLabel>Title</FieldLabel>
                            <FieldContent>
                                <Input
                                    placeholder="How to Compress PDF Without Losing Quality"
                                    {...register("title")}
                                />
                                <FieldError errors={[errors.title]} />
                            </FieldContent>
                        </Field>

                        <div className="grid gap-6 md:grid-cols-2">
                            <Field>
                                <FieldLabel>Slug</FieldLabel>
                                <FieldContent>
                                    <Input
                                        placeholder="how-to-compress-pdf-without-losing-quality"
                                        {...register("slug")}
                                        onChange={(e) => {
                                            setSlugTouched(true);
                                            setValue("slug", slugify(e.target.value), {
                                                shouldValidate: true,
                                            });
                                        }}
                                    />
                                    <FieldDescription>/blog/{slugValue || "your-slug"}</FieldDescription>
                                    <FieldError errors={[errors.slug]} />
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel>Category</FieldLabel>
                                <FieldContent>
                                    <Input placeholder="PDF Tools" {...register("category")} />
                                    <FieldError errors={[errors.category]} />
                                </FieldContent>
                            </Field>
                        </div>

                        <Field>
                            <FieldLabel>Excerpt</FieldLabel>
                            <FieldContent>
                                <Textarea
                                    rows={4}
                                    placeholder="A clear summary for blog cards and SEO previews."
                                    {...register("excerpt")}
                                />
                                <FieldDescription>
                                    Keep it concise and useful. Ideal for blog listing and search previews.
                                </FieldDescription>
                                <FieldError errors={[errors.excerpt]} />
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel>Content</FieldLabel>
                            <FieldContent>
                                <Textarea
                                    rows={18}
                                    placeholder="Write your article in markdown..."
                                    className="min-h-[360px] font-mono text-sm"
                                    {...register("content")}
                                />
                                <FieldDescription>
                                    Markdown supported on the public blog page.
                                </FieldDescription>
                                <FieldError errors={[errors.content]} />
                            </FieldContent>
                        </Field>

                        <div className="grid gap-6 md:grid-cols-2">
                            <Field>
                                <FieldLabel>Cover image URL</FieldLabel>
                                <FieldContent>
                                    <Input placeholder="https://..." {...register("coverImage")} />
                                    <FieldError errors={[errors.coverImage]} />
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel>Tags</FieldLabel>
                                <FieldContent>
                                    <Input
                                        placeholder="pdf, compression, documents"
                                        value={tagsValue.join(", ")}
                                        onChange={(e) => {
                                            const tags = e.target.value
                                                .split(",")
                                                .map((tag) => tag.trim())
                                                .filter(Boolean);
                                            setValue("tags", tags, { shouldValidate: true });
                                        }}
                                    />
                                    <FieldDescription>Separate tags with commas.</FieldDescription>
                                    <FieldError errors={[errors.tags]} />
                                </FieldContent>
                            </Field>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <Field>
                                <FieldLabel>SEO title</FieldLabel>
                                <FieldContent>
                                    <Input placeholder="Optional SEO title" {...register("seoTitle")} />
                                    <FieldError errors={[errors.seoTitle]} />
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel>SEO description</FieldLabel>
                                <FieldContent>
                                    <Textarea
                                        rows={4}
                                        placeholder="Optional SEO meta description"
                                        {...register("seoDescription")}
                                    />
                                    <FieldError errors={[errors.seoDescription]} />
                                </FieldContent>
                            </Field>
                        </div>

                        <Field orientation="horizontal" className="items-center justify-between rounded-2xl border p-4">
                            <FieldContent className="space-y-1">
                                <FieldLabel className="m-0">Publish now</FieldLabel>
                                <FieldDescription>
                                    Turn this on to publish the article publicly.
                                </FieldDescription>
                            </FieldContent>

                            <Controller
                                control={control}
                                name="status"
                                render={({ field }) => (
                                    <Switch
                                        checked={field.value === "PUBLISHED"}
                                        onCheckedChange={(checked) =>
                                            field.onChange(checked ? "PUBLISHED" : "DRAFT")
                                        }
                                    />
                                )}
                            />
                        </Field>

                        {serverError ? (
                            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                                {serverError}
                            </div>
                        ) : null}

                        <div className="flex flex-wrap gap-3">
                            <Button type="submit" disabled={isSubmitting} className="rounded-xl">
                                {isSubmitting
                                    ? mode === "create"
                                        ? "Creating..."
                                        : "Saving..."
                                    : mode === "create"
                                        ? "Create post"
                                        : "Save changes"}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-xl"
                                onClick={() => router.push("/admin/blog")}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl tracking-tight">Publishing notes</CardTitle>
                    <CardDescription>
                        Keep every post focused on one Filego use case and one search intent.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <div className="rounded-2xl border bg-muted/30 p-4">
                        Target one keyword theme per article, such as compress PDF, merge PDF, or JPG to PDF.
                    </div>
                    <div className="rounded-2xl border bg-muted/30 p-4">
                        Add a clear CTA inside the content pointing users to the relevant Filego tool.
                    </div>
                    <div className="rounded-2xl border bg-muted/30 p-4">
                        Keep titles specific, practical, and solution-driven instead of generic.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}