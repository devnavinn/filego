import type { InputImage } from "./image-utils";
import { isSupportedImage } from "./image-utils";

type FileWithPath = File & {
    webkitRelativePath?: string;
};

export async function pickFolderImagesViaInput(
    files: FileList | File[]
): Promise<InputImage[]> {
    const list = Array.from(files as ArrayLike<FileWithPath>);

    return list
        .filter((file) => isSupportedImage(file))
        .map((file) => ({
            file,
            relativePath: file.webkitRelativePath || file.name,
        }));
}

export async function pickFolderImagesViaFSAccess(): Promise<InputImage[]> {
    if (!("showDirectoryPicker" in window)) {
        throw new Error("Directory picker is not supported in this browser.");
    }

    const dirHandle = await (window as typeof window & {
        showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>;
    }).showDirectoryPicker();

    const results: InputImage[] = [];

    async function walk(
        handle: FileSystemDirectoryHandle,
        currentPath = "",
        depth = 0
    ) {
        if (depth > 50) return;

        for await (const entry of handle.values()) {
            const nextPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

            if (entry.kind === "directory") {
                await walk(entry as FileSystemDirectoryHandle, nextPath, depth + 1);
            } else if (entry.kind === "file") {
                const file = await (entry as FileSystemFileHandle).getFile();
                if (isSupportedImage(file)) {
                    results.push({
                        file,
                        relativePath: nextPath,
                    });
                }
            }
        }
    }

    await walk(dirHandle);
    return results;
}