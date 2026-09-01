"use client"

import { useState } from "react"
import { fetchFile } from "@ffmpeg/util"
import { Download, Minimize2, Music } from "lucide-react"

import { Button } from "@/components/ui/button"
import { AudioDropzone } from "@/components/tools/audio-dropzone"
import { FFmpegStatus } from "@/components/tools/ffmpeg-status"
import { useFFmpeg } from "@/lib/use-ffmpeg"
import { getAudioMeta } from "@/lib/audio-tool-utils"
import { bytesToBlob } from "@/lib/video-tool-utils"
import { formatBytes } from "@/lib/image-utils"
import { downloadBlob, replaceExtension } from "@/lib/pdf-tool-utils"

const BITRATES = [
    { value: "64k", label: "64 kbps", description: "Smallest, voice/podcast quality" },
    { value: "96k", label: "96 kbps", description: "Small, acceptable music quality" },
    { value: "128k", label: "128 kbps", description: "Balanced, standard quality" },
    { value: "192k", label: "192 kbps", description: "Larger, near-CD quality" },
] as const

export function AudioCompressorTool() {
    const { ensureLoaded, isLoading, progress, error: engineError, setError: setEngineError } = useFFmpeg()
    const [file, setFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [duration, setDuration] = useState(0)
    const [bitrate, setBitrate] = useState<(typeof BITRATES)[number]["value"]>("96k")
    const [output, setOutput] = useState<{ blob: Blob; url: string } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function handleClear() {
        setFile(null)
        setPreviewUrl(null)
        setDuration(0)
        setOutput(null)
        setError(null)
    }

    async function handleFileSelect(next: File) {
        setError(null)
        setOutput(null)
        try {
            const info = await getAudioMeta(next)
            setFile(next)
            setPreviewUrl(info.url)
            setDuration(info.duration)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not load this audio file.")
        }
    }

    async function handleCompress() {
        if (!file) return
        setIsProcessing(true)
        setError(null)
        setEngineError(null)
        setOutput(null)

        try {
            const ffmpeg = await ensureLoaded()
            const ext = file.name.split(".").pop() || "mp3"
            const inputName = `input.${ext}`
            const outputName = "output.mp3"

            await ffmpeg.writeFile(inputName, await fetchFile(file))
            await ffmpeg.exec(["-i", inputName, "-c:a", "libmp3lame", "-b:a", bitrate, outputName])

            const data = await ffmpeg.readFile(outputName)
            const blob = bytesToBlob(data as Uint8Array, "audio/mpeg")
            setOutput({ blob, url: URL.createObjectURL(blob) })

            await ffmpeg.deleteFile(inputName)
            await ffmpeg.deleteFile(outputName)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not compress this audio file.")
        } finally {
            setIsProcessing(false)
        }
    }

    function handleDownload() {
        if (!output || !file) return
        downloadBlob(output.blob, replaceExtension(file.name, "mp3"))
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Audio Compressor</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Reduce audio file size for storage and delivery by lowering the bitrate.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                    <AudioDropzone
                        onFileSelect={handleFileSelect}
                        file={file}
                        previewUrl={previewUrl}
                        meta={duration ? { duration } : null}
                        onClear={handleClear}
                    />

                    {file && (
                        <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/30 p-4">
                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">Bitrate</p>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {BITRATES.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setBitrate(option.value)}
                                            className={`rounded-xl border p-2.5 text-left transition-colors ${bitrate === option.value ? "border-primary bg-primary/5" : "border-border/60"
                                                }`}
                                        >
                                            <p className="text-xs font-medium">{option.label}</p>
                                            <p className="text-[11px] text-muted-foreground">{option.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                type="button"
                                className="w-full rounded-full"
                                onClick={handleCompress}
                                disabled={isProcessing || isLoading}
                            >
                                <Minimize2 />
                                {isProcessing ? "Compressing..." : "Compress audio"}
                            </Button>

                            <FFmpegStatus isLoadingEngine={isLoading} isProcessing={isProcessing} progress={progress} />
                        </div>
                    )}

                    {(error || engineError) && <p className="text-sm text-destructive">{error || engineError}</p>}
                </div>

                <div className="space-y-3">
                    <p className="text-sm font-medium">Result</p>
                    <div className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-2xl border border-border/60 bg-muted/30 p-6">
                        {output && file ? (
                            <>
                                <audio src={output.url} controls className="w-full" />
                                <p className="text-xs text-muted-foreground">
                                    {formatBytes(file.size)} → {formatBytes(output.blob.size)}
                                    {output.blob.size < file.size &&
                                        ` (-${Math.round((1 - output.blob.size / file.size) * 100)}%)`}
                                </p>
                                <Button type="button" className="w-full rounded-full sm:w-auto" onClick={handleDownload}>
                                    <Download />
                                    Download audio
                                </Button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <Music className="h-8 w-8" />
                                <p className="text-xs">Compressed audio will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
