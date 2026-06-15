"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { set } from "idb-keyval";
import { FolderOpen, ImageUp, Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    pickFolderImagesViaFSAccess,
    pickFolderImagesViaInput,
} from "@/lib/folder-utils";

type StoredEntry = {
    file: File;
    relativePath: string;
};

export function BulkImageUploadEntry() {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const folderInputRef = useRef<HTMLInputElement | null>(null);

    const [isDragging, setIsDragging] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    async function saveAndOpenEditor(entries: StoredEntry[]) {
        if (!entries.length) return;

        try {
            setIsSaving(true);
            await set("filego-bulk-image-entries", entries);
            router.push("/bulk-image-compress/editor");
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
            .filter((file) => file.type.startsWith("image/"))
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
        const entries = await pickFolderImagesViaInput(e.target.files);
        await saveAndOpenEditor(entries);
        e.target.value = "";
    }

    async function handleFolderFs() {
        try {
            const entries = await pickFolderImagesViaFSAccess();
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
                handleFiles(e.dataTransfer.files);
            }}
            className={`rounded-[2rem] border border-dashed bg-card p-6 shadow-sm transition-colors md:p-8 ${isDragging ? "border-foreground bg-muted/40" : "border-border"
                }`}
        >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-background">
                <ImageUp className="h-6 w-6" />
            </div>

            <h2 className="mt-5 text-2xl font-semibold tracking-tight">
                Choose, drop, or open a folder
            </h2>

            <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
                Start with images here, then continue to the editor page to compress,
                convert, resize, and export in bulk.
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
                    Choose images
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
                No server upload required. Files stay in your browser workflow.
            </p>

            <input
                ref={inputRef}
                type="file"
                accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif,.svg"
                multiple
                className="sr-only"
                onChange={(e) => handleFiles(e.target.files)}
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