// app/api/admin/blog/generate-image/route.ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { generateBlogImageSchema } from "@/lib/validations/blog-image";
import { generateImageWithGemini } from "@/lib/gemini";
import { uploadBufferToCloudinary } from "@/lib/cloudinary";
import { slugify } from "@/lib/utils/slug";

export async function POST(req: Request) {
    await requireAdmin();

    try {
        const json = await req.json();
        const parsed = generateBlogImageSchema.safeParse(json);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Validation failed.",
                    fieldErrors: parsed.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        const { title, excerpt, category, style, aspectRatio } = parsed.data;

        const prompt = [
            `Create a high-quality blog cover image for an article titled "${title}".`,
            excerpt ? `Article context: ${excerpt}.` : "",
            `Category: ${category}.`,
            `Style: ${style}.`,
            "Professional editorial hero image for web.",
            "No watermark, no logo, no UI screenshot, no text overlay.",
            "Clean composition, premium lighting, visually striking but minimal.",
        ]
            .filter(Boolean)
            .join(" ");

        const generated = await generateImageWithGemini({
            prompt,
            model: "gemini-3.1-flash-image",
            aspectRatio,
            imageSize: "1K",
            maxRetries: 3,
        });

        const publicId = `${slugify(title)}-${Date.now()}`;

        const uploaded = await uploadBufferToCloudinary({
            buffer: generated.buffer,
            folder: process.env.CLOUDINARY_UPLOAD_FOLDER || "filego/blog",
            publicId,
            format: "png",
            resourceType: "image",
            overwrite: false,
            tags: ["filego", "blog", "ai-generated", slugify(category)],
        });

        return NextResponse.json({
            ok: true,
            item: {
                publicId: uploaded.public_id,
                url: uploaded.secure_url,
                width: uploaded.width,
                height: uploaded.height,
                format: uploaded.format,
                bytes: uploaded.bytes,
                assetId: uploaded.asset_id,
            },
            message: "Blog image generated and uploaded successfully.",
        });
    } catch (error) {
        console.error("GENERATE_BLOG_IMAGE_ERROR", error);

        const message =
            error instanceof Error
                ? error.message
                : "Failed to generate and upload blog image.";

        const isQuotaExceeded =
            message.toLowerCase().includes("quota") ||
            message.toLowerCase().includes("429");

        return NextResponse.json(
            {
                ok: false,
                error: message,
            },
            { status: isQuotaExceeded ? 429 : 500 }
        );
    }
}