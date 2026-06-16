// lib/gemini.ts
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY.");
}

export const genAI = new GoogleGenAI({ apiKey });

export type GeneratedImageResult = {
    buffer: Buffer;
    mimeType: string;
};

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryDelayMs(error: unknown, attempt: number) {
    const fallback = Math.min(1500 * 2 ** attempt, 10000);

    if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof error.message === "string"
    ) {
        const match = error.message.match(/retryDelay":"(\d+)s"/);
        if (match?.[1]) {
            return Number(match[1]) * 1000;
        }
    }

    return fallback;
}

function isQuotaError(error: unknown) {
    return (
        !!error &&
        typeof error === "object" &&
        "status" in error &&
        (error as { status?: number }).status === 429
    );
}

export async function generateImageWithGemini(params: {
    prompt: string;
    model?: string;
    aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
    imageSize?: "512" | "1K" | "2K" | "4K";
    maxRetries?: number;
}): Promise<GeneratedImageResult> {
    const {
        prompt,
        model = "gemini-3.1-flash-image",
        aspectRatio = "16:9",
        imageSize = "1K",
        maxRetries = 3,
    } = params;

    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await genAI.models.generateContent({
                model,
                contents: prompt,
                config: {
                    responseModalities: ["Image"],
                    responseFormat: {
                        aspectRatio,
                    },
                    generationConfig: {
                        imageSize,
                    },
                } as never,
            });

            const candidate = response.candidates?.[0];
            const parts = candidate?.content?.parts ?? [];

            for (const part of parts) {
                if (part.inlineData?.data) {
                    const mimeType = part.inlineData.mimeType || "image/png";
                    const buffer = Buffer.from(part.inlineData.data, "base64");
                    return { buffer, mimeType };
                }
            }

            throw new Error("Gemini did not return an image.");
        } catch (error) {
            lastError = error;

            if (!isQuotaError(error) || attempt === maxRetries) {
                break;
            }

            const delayMs = getRetryDelayMs(error, attempt);
            await sleep(delayMs);
        }
    }

    if (isQuotaError(lastError)) {
        throw new Error(
            "Image generation quota exceeded. Please try again after some time or upgrade your Gemini API quota."
        );
    }

    throw lastError instanceof Error
        ? lastError
        : new Error("Image generation failed.");
}