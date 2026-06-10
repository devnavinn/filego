/// <reference lib="webworker" />

import decodeJpeg from "@jsquash/jpeg/decode";
import decodePng from "@jsquash/png/decode";
import encodeWebp from "@jsquash/webp/encode";

type WorkerInput = {
    id: string;
    file: File;
    relativePath: string;
    quality: number;
    effort: number;
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

self.onmessage = async (event: MessageEvent<WorkerInput>) => {
    const { id, file, quality, effort, relativePath } = event.data;

    try {
        const buffer = await file.arrayBuffer();

        let imageData: ImageData;
        if (file.type === "image/jpeg" || file.type === "image/jpg") {
            imageData = await decodeJpeg(buffer);
        } else if (file.type === "image/png") {
            imageData = await decodePng(buffer);
        } else {
            throw new Error("Unsupported file type");
        }

        const encoded = await encodeWebp(imageData, { quality, effort });
        const blob = new Blob([encoded], { type: "image/webp" });
        const outputName = file.name.replace(/\.(jpe?g|png)$/i, ".webp");
        const outputRelativePath = relativePath.replace(/\.(jpe?g|png)$/i, ".webp");

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