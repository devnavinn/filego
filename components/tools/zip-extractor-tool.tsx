"use client"

import { useState } from "react"
import JSZip from "jszip"
import { Archive, Download, File as FileIcon, Folder } from "lucide-react"

import { Button } from "@/components/ui/button"
import { GenericFileDropzone } from "@/components/tools/generic-file-dropzone"
import { formatBytes } from "@/lib/image-utils"
import { downloadBlob } from "@/lib/pdf-tool-utils"

type ZipEntry = {
    path: string
    isDir: boolean
    size: number
    getBlob: () => Promise<Blob>
}

export function ZipExtractorTool() {
    const [file, setFile] = useState<File | null>(null)
    const [entries, setEntries] = useState<ZipEntry[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [downloadingPath, setDownloadingPath] = useState<string | null>(null)
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
            const zip = await JSZip.loadAsync(next)
            const list: ZipEntry[] = []

            zip.forEach((relativePath, entry) => {
                list.push({
                    path: relativePath,
                    isDir: entry.dir,
                    size: (entry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0,
                    getBlob: () => entry.async("blob"),
                })
            })

            list.sort((a, b) => a.path.localeCompare(b.path))
            setEntries(list)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not read this ZIP file.")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleDownloadEntry(entry: ZipEntry) {
        setDownloadingPath(entry.path)
        try {
            const blob = await entry.getBlob()
            downloadBlob(blob, entry.path.split("/").pop() || entry.path)
        } finally {
            setDownloadingPath(null)
        }
    }

    const fileCount = entries.filter((e) => !e.isDir).length

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">ZIP Extractor</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Open a ZIP archive and download its contents individually.
            </p>

            <div className="mt-6 space-y-4">
                <GenericFileDropzone
                    onFileSelect={handleFileSelect}
                    file={file}
                    onClear={handleClear}
                    accept=".zip,application/zip"
                    hint="Click to upload or drag & drop a .zip file"
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
                                    key={entry.path}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background px-3 py-2"
                                >
                                    <div className="flex min-w-0 items-center gap-2.5">
                                        {entry.isDir ? (
                                            <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        ) : (
                                            <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        )}
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-medium">{entry.path}</p>
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
                                            disabled={downloadingPath === entry.path}
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
