import type { StoredVideoEntry } from "@/lib/video-utils";

const VIDEO_EXTENSIONS = [
    ".mp4",
    ".mov",
    ".avi",
    ".mkv",
    ".webm",
    ".m4v",
    ".3gp",
    ".mpeg",
    ".mpg",
];

function isVideoFile(file: File) {
    return file.type.startsWith("video/") ||
        VIDEO_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
}

async function walkDirectory(
    handle: FileSystemDirectoryHandle,
    path = ""
): Promise<StoredVideoEntry[]> {
    const entries: StoredVideoEntry[] = [];

    for await (const entry of handle.values()) {
        const nextPath = path ? `${path}/${entry.name}` : entry.name;

        if (entry.kind === "file") {
            const file = await entry.getFile();
            if (isVideoFile(file)) {
                entries.push({ file, relativePath: nextPath });
            }
        } else if (entry.kind === "directory") {
            const nested = await walkDirectory(entry, nextPath);
            entries.push(...nested);
        }
    }

    return entries;
}

export async function pickFolderVideosViaFSAccess(): Promise<StoredVideoEntry[]> {
    if (!("showDirectoryPicker" in window)) {
        throw new Error("File System Access API is not supported in this browser.");
    }

    const dirHandle = await window.showDirectoryPicker();
    return await walkDirectory(dirHandle);
}

export async function pickFolderVideosViaInput(
    fileList: FileList
): Promise<StoredVideoEntry[]> {
    return Array.from(fileList)
        .filter(isVideoFile)
        .map((file) => ({
            file,
            relativePath:
                (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name,
        }));
}