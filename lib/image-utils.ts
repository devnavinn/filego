import decodeJpeg from "@jsquash/jpeg/decode";
import decodePng from "@jsquash/png/decode";
import encodeWebp from "@jsquash/webp/encode";

export type InputImage = {
    file: File;
    relativePath: string;
};

export type CompressedImage = {
    originalName: string;
    outputName: string;
    relativePath: string;
    originalSize: number;
    outputSize: number;
    blob: Blob;
};

export async function fileToImageData(file: File): Promise<ImageData> {
    const buffer = await file.arrayBuffer();

    if (file.type === "image/jpeg" || file.type === "image/jpg") {
        return decodeJpeg(buffer);
    }

    if (file.type === "image/png") {
        return decodePng(buffer);
    }

    throw new Error(`Unsupported type: ${file.type}`);
}

export async function compressToWebp(
    file: File,
    options: { quality: number; effort: number }
): Promise<CompressedImage> {
    const imageData = await fileToImageData(file);
    const encoded = await encodeWebp(imageData, {
        quality: options.quality,
        effort: options.effort,
    });

    const blob = new Blob([encoded], { type: "image/webp" });
    const outputName = file.name.replace(/\.(jpe?g|png)$/i, ".webp");

    return {
        originalName: file.name,
        outputName,
        relativePath: outputName,
        originalSize: file.size,
        outputSize: blob.size,
        blob,
    };
}

export function formatBytes(bytes: number) {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const idx = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, idx)).toFixed(2)} ${units[idx]}`;
}

export function isSupportedImage(file: File) {
    return ["image/jpeg", "image/jpg", "image/png"].includes(file.type);
}

export function sanitizeZipPath(path: string) {
    return path.replace(/^\/+/, "").replace(/\.\./g, "");
}