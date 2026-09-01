"use client"

import { useState } from "react"
import { parseTar } from "nanotar"
import { Archive, Download, File as FileIcon, Folder } from "lucide-react"

import { Button } from "@/components/ui/button"
import { GenericFileDropzone } from "@/components/tools/generic-file-dropzone"
import { formatBytes } from "@/lib/image-utils"
import { downloadBlob } from "@/lib/pdf-tool-utils"

type TarEntry = {
    name: string
    isDir: boolean
    size: number
    data?: Uint8Array
}

export function TarExtractorTool() {
    const [file, setFile] = useState<File | null>(null)
    const [entries, setEntries] = useState<TarEntry[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function handleClear() {
        setFile(null)
        setEntries([])
        setError(null)
    }

    async function handleFileSelect(next: File) {
        setFile(next)
        setError(null)
        setIsLoading(true)
        setEntries([])

        try {
            const buffer = await next.arrayBuffer()
            const files = parseTar(buffer)

            const list: TarEntry[] = files.map((entry) => ({
                name: entry.name,
                isDir: entry.type === "directory",
                size: entry.size ?? 0,
                data: entry.data,
            }))

            list.sort((a, b) => a.name.localeCompare(b.name))
            setEntries(list)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not read this TAR file.")
        } finally {
            setIsLoading(false)
        }
    }

    function handleDownloadEntry(entry: TarEntry) {
        if (!entry.data) return
        downloadBlob(new Blob([new Uint8Array(entry.data)]), entry.name.split("/").pop() || entry.name)
    }

    const fileCount = entries.filter((e) => !e.isDir).length

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">TAR Extractor</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Open a TAR archive and download its contents individually.
            </p>

            <div className="mt-6 space-y-4">
                <GenericFileDropzone
                    onFileSelect={handleFileSelect}
                    file={file}
                    onClear={handleClear}
                    accept=".tar,application/x-tar"
                    hint="Click to upload or drag & drop a .tar file"
                    icon={Archive}
                />

                {isLoading && <p className="text-sm text-muted-foreground">Reading archive...</p>}
                {error && <p className="text-sm text-destructive">{error}</p>}

                {entries.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                            {fileCount} file{fileCount === 1 ? "" : "s"} found
                        </p>
                        <div className="max-h-96 space-y-1.5 overflow-y-auto rounded-2xl border border-border/60 bg-muted/30 p-3">
                            {entries.map((entry) => (
                                <div
                                    key={entry.name}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background px-3 py-2"
                                >
                                    <div className="flex min-w-0 items-center gap-2.5">
                                        {entry.isDir ? (
                                            <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        ) : (
                                            <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        )}
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-medium">{entry.name}</p>
                                            {!entry.isDir && (
                                                <p className="text-[11px] text-muted-foreground">{formatBytes(entry.size)}</p>
                                            )}
                                        </div>
                                    </div>
                                    {!entry.isDir && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-sm"
                                            className="shrink-0 rounded-full"
                                            onClick={() => handleDownloadEntry(entry)}
                                        >
                                            <Download />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
