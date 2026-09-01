"use client"

import { useState } from "react"
import { fetchFile } from "@ffmpeg/util"
import { Download, Minimize2, Video } from "lucide-react"

import { Button } from "@/components/ui/button"
import { VideoDropzone } from "@/components/tools/video-dropzone"
import { FFmpegStatus } from "@/components/tools/ffmpeg-status"
import { useFFmpeg } from "@/lib/use-ffmpeg"
import { getVideoMeta, bytesToBlob, type VideoMeta } from "@/lib/video-tool-utils"
import { formatBytes } from "@/lib/image-utils"
import { downloadBlob, replaceExtension } from "@/lib/pdf-tool-utils"

type Quality = "high" | "balanced" | "small"
type Resolution = "original" | "1080" | "720" | "480"

const QUALITY_PRESETS: { value: Quality; label: string; crf: number; description: string }[] = [
    { value: "high", label: "High quality", crf: 20, description: "Larger file, best quality" },
    { value: "balanced", label: "Balanced", crf: 26, description: "Good quality, solid savings" },
    { value: "small", label: "Small size", crf: 32, description: "Smallest file, lower quality" },
]

const RESOLUTIONS: { value: Resolution; label: string; height?: number }[] = [
    { value: "original", label: "Original" },
    { value: "1080", label: "1080p", height: 1080 },
    { value: "720", label: "720p", height: 720 },
    { value: "480", label: "480p", height: 480 },
]

export function VideoCompressorTool() {
    const { ensureLoaded, isLoading, progress, error: engineError, setError: setEngineError } = useFFmpeg()
    const [file, setFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [meta, setMeta] = useState<VideoMeta | null>(null)
    const [quality, setQuality] = useState<Quality>("balanced")
    const [resolution, setResolution] = useState<Resolution>("original")
    const [output, setOutput] = useState<{ blob: Blob; url: string } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function handleClear() {
        setFile(null)
        setPreviewUrl(null)
        setMeta(null)
        setOutput(null)
        setError(null)
    }

    async function handleFileSelect(next: File) {
        setError(null)
        setOutput(null)
        try {
            const info = await getVideoMeta(next)
            setFile(next)
            setPreviewUrl(info.url)
            setMeta(info)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not load this video.")
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
            const ext = file.name.split(".").pop() || "mp4"
            const inputName = `input.${ext}`
            const outputName = "output.mp4"

            await ffmpeg.writeFile(inputName, await fetchFile(file))

            const preset = QUALITY_PRESETS.find((p) => p.value === quality)!
            const resOption = RESOLUTIONS.find((r) => r.value === resolution)!

            const args = ["-i", inputName, "-c:v", "libx264", "-crf", String(preset.crf), "-preset", "veryfast"]
            if (resOption.height) args.push("-vf", `scale=-2:${resOption.height}`)
            args.push("-c:a", "aac", "-b:a", "128k", outputName)

            await ffmpeg.exec(args)

            const data = await ffmpeg.readFile(outputName)
            const blob = bytesToBlob(data as Uint8Array, "video/mp4")
            setOutput({ blob, url: URL.createObjectURL(blob) })

            await ffmpeg.deleteFile(inputName)
            await ffmpeg.deleteFile(outputName)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not compress this video.")
        } finally {
            setIsProcessing(false)
        }
    }

    function handleDownload() {
        if (!output || !file) return
        downloadBlob(output.blob, replaceExtension(file.name, "mp4"))
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Video Compressor</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Reduce video file size for uploads and sharing, right in your browser.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                    <VideoDropzone onFileSelect={handleFileSelect} file={file} previewUrl={previewUrl} meta={meta} onClear={handleClear} />

                    {file && (
                        <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/30 p-4">
                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">Quality</p>
                                <div className="grid gap-2 sm:grid-cols-3">
                                    {QUALITY_PRESETS.map((preset) => (
                                        <button
                                            key={preset.value}
                                            type="button"
                                            onClick={() => setQuality(preset.value)}
                                            className={`rounded-xl border p-2.5 text-left transition-colors ${quality === preset.value ? "border-primary bg-primary/5" : "border-border/60"
                                                }`}
                                        >
                                            <p className="text-xs font-medium">{preset.label}</p>
                                            <p className="text-[11px] text-muted-foreground">{preset.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">Max resolution</p>
                                <div className="flex flex-wrap gap-2">
                                    {RESOLUTIONS.map((res) => (
                                        <Button
                                            key={res.value}
                                            type="button"
                                            variant={resolution === res.value ? "secondary" : "outline"}
                                            size="sm"
                                            className="rounded-full"
                                            onClick={() => setResolution(res.value)}
                                        >
                                            {res.label}
                                        </Button>
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
                                {isProcessing ? "Compressing..." : "Compress video"}
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
                                <video src={output.url} controls className="max-h-56 max-w-full rounded-xl border border-border/60" />
                                <p className="text-xs text-muted-foreground">
                                    {formatBytes(file.size)} → {formatBytes(output.blob.size)}
                                    {output.blob.size < file.size &&
                                        ` (-${Math.round((1 - output.blob.size / file.size) * 100)}%)`}
                                </p>
                                <Button type="button" className="w-full rounded-full sm:w-auto" onClick={handleDownload}>
                                    <Download />
                                    Download video
                                </Button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <Video className="h-8 w-8" />
                                <p className="text-xs">Compressed video will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
