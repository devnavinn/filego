export type StoredVideoEntry = {
    file: File;
    relativePath: string;
};

export type OutputFormat = "mp4" | "webm";

export type QueueStatus = "pending" | "processing" | "done" | "error";

export type QueueItem = {
    id: string;
    file: File;
    relativePath: string;
    status: QueueStatus;
    originalSize: number;
    outputSize?: number;
    outputName?: string;
    outputRelativePath?: string;
    blob?: Blob;
    error?: string;
    durationSec?: number;
};

export type StoredVideoPayload = {
    entries: StoredVideoEntry[];
    createdAt: number;
};

export function formatBytes(bytes: number) {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const exponent = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        units.length - 1
    );
    const value = bytes / 1024 ** exponent;
    return `${value.toFixed(value >= 100 || exponent === 0 ? 0 : value >= 10 ? 1 : 2)} ${units[exponent]}`;
}

export function formatDuration(totalSeconds?: number) {
    if (!totalSeconds || !Number.isFinite(totalSeconds)) return null;
    const seconds = Math.round(totalSeconds);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
}

export function replaceExt(path: string, ext: string) {
    if (!/\.[^.]+$/.test(path)) return `${path}.${ext}`;
    return path.replace(/\.[^.]+$/, `.${ext}`);
}

export function sanitizeZipPath(path: string) {
    return path
        .replace(/^(\.\.(\/|\\|$))+/, "")
        .replace(/\\/g, "/")
        .replace(/^\/+/, "")
        .replace(/[\x00-\x1F\x7F]+/g, "")
        .trim();
}

export async function getVideoDuration(file: File): Promise<number | undefined> {
    const url = URL.createObjectURL(file);
    try {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.src = url;

        await new Promise<void>((resolve, reject) => {
            const onLoaded = () => resolve();
            const onError = () => reject(new Error("Could not read video metadata"));
            video.addEventListener("loadedmetadata", onLoaded, { once: true });
            video.addEventListener("error", onError, { once: true });
        });

        return Number.isFinite(video.duration) ? video.duration : undefined;
    } finally {
        URL.revokeObjectURL(url);
    }
}