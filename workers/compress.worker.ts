/// <reference lib="webworker" />

import encodeWebp from "@jsquash/webp/encode";
import encodeAvif from "@jsquash/avif/encode";

type OutputFormat = "keep" | "webp" | "avif" | "jpeg" | "png";

type CompressionMode =
    | "best-compression"
    | "target-20"
    | "target-50"
    | "target-100"
    | "custom-size";

type WorkerInput = {
    id: string;
    file: File;
    relativePath: string;
    quality: number;
    effort: number;
    outputFormat: OutputFormat;
    compressionMode: CompressionMode;
    targetKB: number | null;
};

type WorkerOutput =
    | {
        id: string;
        status: "done";
        originalName: string;
        outputName: string;
        relativePath: string;
        originalSize: number;
        outputSize: number;
        blob: Blob;
    }
    | {
        id: string;
        status: "error";
        error: string;
    };

type NormalizedFormat = "webp" | "avif" | "jpeg" | "png";

type EncodeParams = {
    imageData: ImageData;
    format: NormalizedFormat;
    quality: number;
    effort: number;
};

async function fileToImageData(file: File): Promise<ImageData> {
    const bitmap = await createImageBitmap(file);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("Canvas context unavailable");

    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

async function imageDataToCanvasBlob(
    imageData: ImageData,
    type: "image/jpeg" | "image/png",
    quality?: number
): Promise<Blob> {
    const canvas = new OffscreenCanvas(imageData.width, imageData.height);
    const ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("Canvas context unavailable");

    ctx.putImageData(imageData, 0, 0);

    return canvas.convertToBlob({
        type,
        quality,
    });
}

function replaceExt(path: string, ext: string) {
    if (!/\.[^.]+$/.test(path)) return `${path}.${ext}`;
    return path.replace(/\.[^.]+$/, `.${ext}`);
}

function getOriginalExtension(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext) return ext;

    if (file.type.includes("jpeg")) return "jpg";
    if (file.type.includes("png")) return "png";
    if (file.type.includes("webp")) return "webp";
    if (file.type.includes("avif")) return "avif";

    return "img";
}

function normalizeFormat(file: File, outputFormat: OutputFormat): NormalizedFormat {
    if (outputFormat !== "keep") return outputFormat;

    if (file.type.includes("avif")) return "avif";
    if (file.type.includes("webp")) return "webp";
    if (file.type.includes("png")) return "png";
    return "jpeg";
}

function getExtForFormat(file: File, format: OutputFormat) {
    if (format === "keep") return getOriginalExtension(file);
    if (format === "jpeg") return "jpg";
    return format;
}

async function encodeImage({
    imageData,
    format,
    quality,
    effort,
}: EncodeParams): Promise<Blob> {
    if (format === "webp") {
        const encoded = await encodeWebp(imageData, {
            quality,
            method: effort,
        });

        return new Blob([encoded], { type: "image/webp" });
    }

    if (format === "avif") {
        const encoded = await encodeAvif(imageData, {
            quality,
        });

        return new Blob([encoded], { type: "image/avif" });
    }

    if (format === "jpeg") {
        return imageDataToCanvasBlob(imageData, "image/jpeg", quality / 100);
    }

    return imageDataToCanvasBlob(imageData, "image/png");
}

function shouldUseTargetSearch(
    compressionMode: CompressionMode,
    targetKB: number | null
) {
    return compressionMode !== "best-compression" && !!targetKB && targetKB > 0;
}

function canUseQualitySearch(format: NormalizedFormat) {
    return format === "webp" || format === "avif" || format === "jpeg";
}

async function compressToTargetSize({
    imageData,
    format,
    effort,
    targetKB,
    initialQuality,
}: {
    imageData: ImageData;
    format: NormalizedFormat;
    effort: number;
    targetKB: number;
    initialQuality: number;
}) {
    const targetBytes = targetKB * 1024;
    const tolerance = Math.max(1024, targetBytes * 0.05);

    if (!canUseQualitySearch(format)) {
        const blob = await encodeImage({
            imageData,
            format,
            quality: initialQuality,
            effort,
        });

        return blob;
    }

    let low = 5;
    let high = 100;
    let bestBlob: Blob | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let i = 0; i < 8; i += 1) {
        const mid = Math.max(1, Math.min(100, Math.round((low + high) / 2)));

        const blob = await encodeImage({
            imageData,
            format,
            quality: mid,
            effort,
        });

        const distance = Math.abs(blob.size - targetBytes);

        if (distance < bestDistance) {
            bestBlob = blob;
            bestDistance = distance;
        }

        if (blob.size >= targetBytes - tolerance && blob.size <= targetBytes + tolerance) {
            return blob;
        }

        if (blob.size > targetBytes) {
            high = mid - 1;
        } else {
            low = mid + 1;
        }
    }

    if (bestBlob) return bestBlob;

    return encodeImage({
        imageData,
        format,
        quality: initialQuality,
        effort,
    });
}

self.onmessage = async (event: MessageEvent<WorkerInput>) => {
    const {
        id,
        file,
        quality,
        effort,
        relativePath,
        outputFormat,
        compressionMode,
        targetKB,
    } = event.data;

    try {
        const imageData = await fileToImageData(file);
        const normalizedFormat = normalizeFormat(file, outputFormat);

        let blob: Blob;

        if (shouldUseTargetSearch(compressionMode, targetKB)) {
            blob = await compressToTargetSize({
                imageData,
                format: normalizedFormat,
                effort,
                targetKB: targetKB!,
                initialQuality: quality,
            });
        } else {
            blob = await encodeImage({
                imageData,
                format: normalizedFormat,
                quality,
                effort,
            });
        }

        const ext = getExtForFormat(file, outputFormat);
        const outputName = replaceExt(file.name, ext);
        const outputRelativePath = replaceExt(relativePath, ext);

        const message: WorkerOutput = {
            id,
            status: "done",
            originalName: file.name,
            outputName,
            relativePath: outputRelativePath,
            originalSize: file.size,
            outputSize: blob.size,
            blob,
        };

        self.postMessage(message);
    } catch (error) {
        const message: WorkerOutput = {
            id,
            status: "error",
            error: error instanceof Error ? error.message : "Compression failed",
        };

        self.postMessage(message);
    }
};

export { };