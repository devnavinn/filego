"use client"

import { useRef, useState } from "react"
import JSZip from "jszip"
import { Archive, FileIcon, Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatBytes } from "@/lib/image-utils"
import { downloadBlob } from "@/lib/pdf-tool-utils"

type FileEntry = { id: string; file: File }

export function ZipCreatorTool() {
    const [entries, setEntries] = useState<FileEntry[]>([])
    const [zipName, setZipName] = useState("archive.zip")
    const [isCreating, setIsCreating] = useState(false)
    const inputRef = useRef<HTMLInputElement | null>(null)

    function addFiles(fileList: FileList | null) {
        const files = Array.from(fileList ?? [])
        if (files.length === 0) return
        setEntries((prev) => [...prev, ...files.map((file) => ({ id: crypto.randomUUID(), file }))])
    }

    function removeEntry(id: string) {
        setEntries((prev) => prev.filter((entry) => entry.id !== id))
    }

    async function handleCreate() {
        if (entries.length === 0) return
        setIsCreating(true)

        try {
            const zip = new JSZip()
            for (const entry of entries) {
                zip.file(entry.file.name, entry.file)
            }

            const blob = await zip.generateAsync({ type: "blob" })
            downloadBlob(blob, zipName.endsWith(".zip") ? zipName : `${zipName}.zip`)
        } finally {
            setIsCreating(false)
        }
    }

    const totalSize = entries.reduce((sum, e) => sum + e.file.size, 0)

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">ZIP Creator</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Package multiple files into a single ZIP archive.
            </p>

            <div className="mt-6 space-y-4">
                <div
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault()
                        addFiles(e.dataTransfer.files)
                    }}
                    role="button"
                    tabIndex={0}
                    className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-border/60 bg-muted/30 p-6 text-center transition-colors hover:bg-muted/50 sm:p-8"
                >
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <p className="text-sm font-medium">Click to add files or drag & drop</p>
                    <p className="text-xs text-muted-foreground">Add any number of files</p>
                    <input
                        ref={inputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                            addFiles(e.target.files)
                            e.target.value = ""
                        }}
                    />
                </div>

                {entries.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                            {entries.length} file{entries.length === 1 ? "" : "s"} · {formatBytes(totalSize)}
                        </p>
                        {entries.map((entry) => (
                            <div
                                key={entry.id}
                                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-2"
                            >
                                <div className="flex min-w-0 items-center gap-2.5">
                                    <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-medium">{entry.file.name}</p>
                                        <p className="text-[11px] text-muted-foreground">{formatBytes(entry.file.size)}</p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="shrink-0 rounded-full"
                                    onClick={() => removeEntry(entry.id)}
                                >
                                    <X />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                        value={zipName}
                        onChange={(e) => setZipName(e.target.value)}
                        className="h-9 flex-1 rounded-xl border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
                    />
                    <Button
                        type="button"
                        className="w-full rounded-full sm:w-auto"
                        onClick={handleCreate}
                        disabled={entries.length === 0 || isCreating}
                    >
                        <Archive />
                        {isCreating ? "Creating..." : "Create ZIP"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
