"use client"

import { useState } from "react"
import { fetchFile } from "@ffmpeg/util"
import { ArrowDown, ArrowUp, Combine, Download, Music, Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FFmpegStatus } from "@/components/tools/ffmpeg-status"
import { useFFmpeg } from "@/lib/use-ffmpeg"
import { bytesToBlob } from "@/lib/video-tool-utils"
import { formatBytes } from "@/lib/image-utils"
import { downloadBlob } from "@/lib/pdf-tool-utils"

type FileEntry = { id: string; file: File }

export function AudioMergerTool() {
    const { ensureLoaded, isLoading, progress, error: engineError, setError: setEngineError } = useFFmpeg()
    const [entries, setEntries] = useState<FileEntry[]>([])
    const [output, setOutput] = useState<{ blob: Blob; url: string } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function addFiles(fileList: FileList | null) {
        const files = Array.from(fileList ?? []).filter((f) => f.type.startsWith("audio/"))
        if (files.length === 0) return
        setOutput(null)
        setEntries((prev) => [...prev, ...files.map((file) => ({ id: crypto.randomUUID(), file }))])
    }

    function removeEntry(id: string) {
        setEntries((prev) => prev.filter((entry) => entry.id !== id))
    }

    function moveEntry(index: number, direction: -1 | 1) {
        setEntries((prev) => {
            const next = [...prev]
            const target = index + direction
            if (target < 0 || target >= next.length) return prev
            ;[next[index], next[target]] = [next[target], next[index]]
            return next
        })
    }

    async function handleMerge() {
        if (entries.length < 2) return
        setIsProcessing(true)
        setError(null)
        setEngineError(null)
        setOutput(null)

        try {
            const ffmpeg = await ensureLoaded()
            const inputNames: string[] = []

            for (let i = 0; i < entries.length; i++) {
                const ext = entries[i].file.name.split(".").pop() || "mp3"
                const name = `input${i}.${ext}`
                await ffmpeg.writeFile(name, await fetchFile(entries[i].file))
                inputNames.push(name)
            }

            const args: string[] = []
            inputNames.forEach((name) => args.push("-i", name))

            const labels: string[] = []
            const filterParts: string[] = []
            inputNames.forEach((_, i) => {
                filterParts.push(`[${i}:a]aformat=sample_rates=44100:channel_layouts=stereo[a${i}]`)
                labels.push(`[a${i}]`)
            })
            filterParts.push(`${labels.join("")}concat=n=${inputNames.length}:v=0:a=1[outa]`)

            args.push(
                "-filter_complex", filterParts.join(";"),
                "-map", "[outa]",
                "-c:a", "libmp3lame", "-q:a", "2",
                "output.mp3"
            )

            await ffmpeg.exec(args)

            const data = await ffmpeg.readFile("output.mp3")
            const blob = bytesToBlob(data as Uint8Array, "audio/mpeg")
            setOutput({ blob, url: URL.createObjectURL(blob) })

            for (const name of inputNames) await ffmpeg.deleteFile(name)
            await ffmpeg.deleteFile("output.mp3")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not merge these audio files.")
        } finally {
            setIsProcessing(false)
        }
    }

    function handleDownload() {
        if (!output) return
        downloadBlob(output.blob, "merged.mp3")
    }

    const totalSize = entries.reduce((sum, e) => sum + e.file.size, 0)

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Audio Merger</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Combine multiple audio files into one track, in the order you choose.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                    <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-border/60 bg-muted/30 p-6 text-center transition-colors hover:bg-muted/50 sm:p-8">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <p className="text-sm font-medium">Click to add audio or drag & drop</p>
                        <p className="text-xs text-muted-foreground">Add at least 2 audio files</p>
                        <input
                            type="file"
                            accept="audio/*"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                                addFiles(e.target.files)
                                e.target.value = ""
                            }}
                        />
                    </label>

                    {entries.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                                {entries.length} file{entries.length === 1 ? "" : "s"} · {formatBytes(totalSize)}
                            </p>
                            {entries.map((entry, index) => (
                                <div
                                    key={entry.id}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-2"
                                >
                                    <div className="flex min-w-0 items-center gap-2.5">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background text-xs font-medium">
                                            {index + 1}
                                        </span>
                                        <Music className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-medium">{entry.file.name}</p>
                                            <p className="text-[11px] text-muted-foreground">{formatBytes(entry.file.size)}</p>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-sm"
                                            className="rounded-full"
                                            onClick={() => moveEntry(index, -1)}
                                            disabled={index === 0}
                                        >
                                            <ArrowUp />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-sm"
                                            className="rounded-full"
                                            onClick={() => moveEntry(index, 1)}
                                            disabled={index === entries.length - 1}
                                        >
                                            <ArrowDown />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-sm"
                                            className="rounded-full"
                                            onClick={() => removeEntry(entry.id)}
                                        >
                                            <X />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <Button
                        type="button"
                        className="w-full rounded-full sm:w-auto"
                        onClick={handleMerge}
                        disabled={entries.length < 2 || isProcessing || isLoading}
                    >
                        <Combine />
                        {isProcessing ? "Merging..." : `Merge ${entries.length || ""} files`}
                    </Button>

                    <FFmpegStatus isLoadingEngine={isLoading} isProcessing={isProcessing} progress={progress} />
                    {(error || engineError) && <p className="text-sm text-destructive">{error || engineError}</p>}
                </div>

                <div className="space-y-3">
                    <p className="text-sm font-medium">Result</p>
                    <div className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-2xl border border-border/60 bg-muted/30 p-6">
                        {output ? (
                            <>
                                <audio src={output.url} controls className="w-full" />
                                <p className="text-xs text-muted-foreground">{formatBytes(output.blob.size)}</p>
                                <Button type="button" className="w-full rounded-full sm:w-auto" onClick={handleDownload}>
                                    <Download />
                                    Download audio
                                </Button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <Music className="h-8 w-8" />
                                <p className="text-xs">Merged audio will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
