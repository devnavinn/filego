/// <reference lib="webworker" />

import encodeWebp from "@jsquash/webp/encode";
import encodeAvif from "@jsquash/avif/encode";

type OutputFormat = "webp" | "avif" | "jpeg" | "png";

type WorkerInput = {
    id: string;
    file: File;
    relativePath: string;
    quality: number;
    effort: number;
    outputFormat: OutputFormat;
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

async function fileToImageData(file: File): Promise<ImageData> {
    const bitmap = await createImageBitmap(file);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("Canvas context unavailable");

    ctx.drawImage(bitmap, 0, 0);
    return ctx.getImageData(0, 0, bitmap.width, bitmap.height);
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
    return await canvas.convertToBlob({
        type,
        quality,
    });
}

function replaceExt(path: string, ext: string) {
    return path.replace(/\.[^.]+$/, `.${ext}`);
}

self.onmessage = async (event: MessageEvent<WorkerInput>) => {
    const { id, file, quality, effort, relativePath, outputFormat } = event.data;

    try {
        const imageData = await fileToImageData(file);

        let blob: Blob;
        let ext: string;

        if (outputFormat === "webp") {
            const encoded = await encodeWebp(imageData, { quality, effort });
            blob = new Blob([encoded], { type: "image/webp" });
            ext = "webp";
        } else if (outputFormat === "avif") {
            const encoded = await encodeAvif(imageData, { quality });
            blob = new Blob([encoded], { type: "image/avif" });
            ext = "avif";
        } else if (outputFormat === "jpeg") {
            blob = await imageDataToCanvasBlob(imageData, "image/jpeg", quality / 100);
            ext = "jpg";
        } else {
            blob = await imageDataToCanvasBlob(imageData, "image/png");
            ext = "png";
        }

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