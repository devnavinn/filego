"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { set } from "idb-keyval";
import { FolderOpen, Loader2, Upload, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BULK_VIDEO_STORAGE_KEY } from "@/lib/constants";
import {
    pickFolderVideosViaFSAccess,
    pickFolderVideosViaInput,
} from "@/lib/folder-video-utils";
import type { StoredVideoEntry, StoredVideoPayload } from "@/lib/video-utils";

export function BulkVideoUploadEntry() {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const folderInputRef = useRef<HTMLInputElement | null>(null);

    const [isDragging, setIsDragging] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    async function saveAndOpenEditor(entries: StoredVideoEntry[]) {
        if (!entries.length) return;

        const payload: StoredVideoPayload = {
            entries,
            createdAt: Date.now(),
        };

        try {
            setIsSaving(true);
            await set(BULK_VIDEO_STORAGE_KEY, payload);
            router.push("/bulk-video-compressor/editor");
        } catch (error) {
            console.error(error);
            alert("Could not open the editor. Please try again.");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleFiles(fileList: FileList | null) {
        if (!fileList?.length) return;

        const entries = Array.from(fileList)
            .filter((file) => file.type.startsWith("video/"))
            .map((file) => ({
                file,
                relativePath: file.name,
            }));

        await saveAndOpenEditor(entries);
    }

    async function handleFolderFallback(
        e: React.ChangeEvent<HTMLInputElement>
    ) {
        if (!e.target.files?.length) return;
        const entries = await pickFolderVideosViaInput(e.target.files);
        await saveAndOpenEditor(entries);
        e.target.value = "";
    }

    async function handleFolderFs() {
        try {
            const entries = await pickFolderVideosViaFSAccess();
            await saveAndOpenEditor(entries);
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") return;
            console.error(error);
        }
    }

    return (
        <div
            onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                void handleFiles(e.dataTransfer.files);
            }}
            className={`rounded-[2rem] border border-dashed bg-card p-6 shadow-sm transition-colors md:p-8 ${isDragging ? "border-foreground bg-muted/40" : "border-border"
                }`}
        >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-background">
                <Video className="h-6 w-6" />
            </div>

            <h2 className="mt-5 text-2xl font-semibold tracking-tight">
                Choose, drop, or open a video folder
            </h2>

            <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
                Start with videos here, then continue to the editor page to compress,
                convert, and export in bulk without server upload.
            </p>

            <div className="mt-6 grid gap-3">
                <Button
                    type="button"
                    size="lg"
                    className="rounded-xl"
                    onClick={() => inputRef.current?.click()}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Upload className="mr-2 h-4 w-4" />
                    )}
                    Choose videos
                </Button>

                <Button
                    type="button"
                    size="lg"
                    variant="secondary"
                    className="rounded-xl"
                    onClick={handleFolderFs}
                    disabled={isSaving}
                >
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Choose folder
                </Button>

                <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => folderInputRef.current?.click()}
                    disabled={isSaving}
                >
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Folder fallback input
                </Button>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
                Videos stay in your browser. Compression runs locally with WebAssembly.
            </p>

            <input
                ref={inputRef}
                type="file"
                accept="video/*,.mp4,.mov,.avi,.mkv,.webm,.m4v,.3gp,.mpeg,.mpg"
                multiple
                className="sr-only"
                onChange={(e) => void handleFiles(e.target.files)}
            />

            <input
                ref={folderInputRef}
                type="file"
                multiple
                className="sr-only"
                onChange={handleFolderFallback}
                {...({
                    webkitdirectory: "true",
                    directory: "true",
                } as React.InputHTMLAttributes<HTMLInputElement>)}
            />
        </div>
    );
}