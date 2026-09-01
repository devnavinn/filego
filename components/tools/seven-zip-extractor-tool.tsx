"use client"

import { useState } from "react"
import type { SevenZipModule } from "7z-wasm"
import JSZip from "jszip"
import { Archive, Download, FileArchive, File as FileIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { GenericFileDropzone } from "@/components/tools/generic-file-dropzone"
import { formatBytes } from "@/lib/image-utils"
import { downloadBlob } from "@/lib/pdf-tool-utils"

type SevenZEntry = { path: string; data: Uint8Array }

function walkFs(fs: SevenZipModule["FS"], dir: string): SevenZEntry[] {
    const items: SevenZEntry[] = []

    for (const name of fs.readdir(dir)) {
        if (name === "." || name === "..") continue
        const fullPath = `${dir}/${name}`
        const stat = fs.stat(fullPath)

        if (fs.isDir(stat.mode)) {
            items.push(...walkFs(fs, fullPath))
        } else {
            items.push({ path: fullPath.replace(/^\/out\//, ""), data: fs.readFile(fullPath) as Uint8Array })
        }
    }

    return items
}

export function SevenZipExtractorTool() {
    const [file, setFile] = useState<File | null>(null)
    const [entries, setEntries] = useState<SevenZEntry[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [progress, setProgress] = useState("")
    const [error, setError] = useState<string | null>(null)

    function handleClear() {
        setFile(null)
        setEntries([])
        setError(null)
    }

    async function handleFileSelect(next: File) {
        setFile(next)
        setError(null)
        setEntries([])
        setIsLoading(true)

        try {
            setProgress("Loading 7-Zip engine...")
            const SevenZip = (await import("7z-wasm")).default
            const sevenZip = await SevenZip({
                locateFile: (path) => (path.endsWith(".wasm") ? "/7zz.wasm" : path),
            })

            setProgress("Extracting archive...")
            const bytes = new Uint8Array(await next.arrayBuffer())
            sevenZip.FS.writeFile("/archive.7z", bytes)
            sevenZip.FS.mkdir("/out")

            try {
                sevenZip.callMain(["x", "/archive.7z", "-o/out", "-y"])
            } catch (err) {
                const status = (err as { status?: number } | undefined)?.status
                if (status !== undefined && status !== 0) {
                    throw new Error(`Extraction failed (exit code ${status}).`)
                }
            }

            const files = walkFs(sevenZip.FS, "/out")
            if (files.length === 0) throw new Error("No files were extracted. The archive may be password protected or unsupported.")

            files.sort((a, b) => a.path.localeCompare(b.path))
            setEntries(files)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not extract this 7Z archive.")
        } finally {
            setIsLoading(false)
            setProgress("")
        }
    }

    function handleDownloadEntry(entry: SevenZEntry) {
        downloadBlob(new Blob([new Uint8Array(entry.data)]), entry.path.split("/").pop() || entry.path)
    }

    async function handleDownloadAll() {
        const zip = new JSZip()
        for (const entry of entries) zip.file(entry.path, entry.data)
        const blob = await zip.generateAsync({ type: "blob" })
        downloadBlob(blob, "extracted.zip")
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">7Z Extractor</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Open and unpack 7Z files, powered by a real 7-Zip engine compiled to WebAssembly.
            </p>

            <div className="mt-6 space-y-4">
                <GenericFileDropzone
                    onFileSelect={handleFileSelect}
                    file={file}
                    onClear={handleClear}
                    accept=".7z,application/x-7z-compressed"
                    hint="Click to upload or drag & drop a .7z file"
                    icon={FileArchive}
                />

                {isLoading && <p className="text-sm text-muted-foreground">{progress || "Working..."}</p>}
                {error && <p className="text-sm text-destructive">{error}</p>}

                {entries.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                                {entries.length} file{entries.length === 1 ? "" : "s"} extracted
                            </p>
                            <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={handleDownloadAll}>
                                <Archive />
                                Download all as ZIP
                            </Button>
                        </div>
                        <div className="max-h-96 space-y-1.5 overflow-y-auto rounded-2xl border border-border/60 bg-muted/30 p-3">
                            {entries.map((entry) => (
                                <div
                                    key={entry.path}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background px-3 py-2"
                                >
                                    <div className="flex min-w-0 items-center gap-2.5">
                                        <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-medium">{entry.path}</p>
                                            <p className="text-[11px] text-muted-foreground">{formatBytes(entry.data.length)}</p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        className="shrink-0 rounded-full"
                                        onClick={() => handleDownloadEntry(entry)}
                                    >
                                        <Download />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
