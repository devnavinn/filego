"use client"

import { useState } from "react"
import { fetchFile } from "@ffmpeg/util"
import { Download, RefreshCw, Video } from "lucide-react"

import { Button } from "@/components/ui/button"
import { VideoDropzone } from "@/components/tools/video-dropzone"
import { FFmpegStatus } from "@/components/tools/ffmpeg-status"
import { useFFmpeg } from "@/lib/use-ffmpeg"
import { getVideoMeta, bytesToBlob, type VideoMeta } from "@/lib/video-tool-utils"
import { formatBytes } from "@/lib/image-utils"
import { downloadBlob, replaceExtension } from "@/lib/pdf-tool-utils"

type Format = "mp4" | "webm" | "mov" | "avi"

const FORMATS: Record<Format, { label: string; mime: string; args: (input: string, output: string) => string[] }> = {
    mp4: {
        label: "MP4",
        mime: "video/mp4",
        args: (input, output) => ["-i", input, "-c:v", "libx264", "-preset", "veryfast", "-c:a", "aac", output],
    },
    webm: {
        label: "WEBM",
        mime: "video/webm",
        args: (input, output) => ["-i", input, "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "32", "-c:a", "libopus", output],
    },
    mov: {
        label: "MOV",
        mime: "video/quicktime",
        args: (input, output) => ["-i", input, "-c:v", "libx264", "-preset", "veryfast", "-c:a", "aac", output],
    },
    avi: {
        label: "AVI",
        mime: "video/x-msvideo",
        args: (input, output) => ["-i", input, "-c:v", "mpeg4", "-qscale:v", "5", "-c:a", "libmp3lame", output],
    },
}

export function VideoConverterTool() {
    const { ensureLoaded, isLoading, progress, error: engineError, setError: setEngineError } = useFFmpeg()
    const [file, setFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [meta, setMeta] = useState<VideoMeta | null>(null)
    const [format, setFormat] = useState<Format>("mp4")
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

    async function handleConvert() {
        if (!file) return
        setIsProcessing(true)
        setError(null)
        setEngineError(null)
        setOutput(null)

        try {
            const ffmpeg = await ensureLoaded()
            const ext = file.name.split(".").pop() || "mp4"
            const inputName = `input.${ext}`
            const outputName = `output.${format}`
            const config = FORMATS[format]

            await ffmpeg.writeFile(inputName, await fetchFile(file))
            await ffmpeg.exec(config.args(inputName, outputName))

            const data = await ffmpeg.readFile(outputName)
            const blob = bytesToBlob(data as Uint8Array, config.mime)
            setOutput({ blob, url: URL.createObjectURL(blob) })

            await ffmpeg.deleteFile(inputName)
            await ffmpeg.deleteFile(outputName)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not convert this video.")
        } finally {
            setIsProcessing(false)
        }
    }

    function handleDownload() {
        if (!output || !file) return
        downloadBlob(output.blob, replaceExtension(file.name, format))
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Video Converter</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Convert videos between MP4, WEBM, MOV, and AVI formats.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                    <VideoDropzone onFileSelect={handleFileSelect} file={file} previewUrl={previewUrl} meta={meta} onClear={handleClear} />

                    {file && (
                        <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/30 p-4">
                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">Convert to</p>
                                <div className="flex flex-wrap gap-2">
                                    {(Object.keys(FORMATS) as Format[]).map((key) => (
                                        <Button
                                            key={key}
                                            type="button"
                                            variant={format === key ? "secondary" : "outline"}
                                            size="sm"
                                            className="rounded-full"
                                            onClick={() => setFormat(key)}
                                        >
                                            {FORMATS[key].label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                type="button"
                                className="w-full rounded-full"
                                onClick={handleConvert}
                                disabled={isProcessing || isLoading}
                            >
                                <RefreshCw />
                                {isProcessing ? "Converting..." : `Convert to ${format.toUpperCase()}`}
                            </Button>

                            <FFmpegStatus isLoadingEngine={isLoading} isProcessing={isProcessing} progress={progress} />
                        </div>
                    )}

                    {(error || engineError) && <p className="text-sm text-destructive">{error || engineError}</p>}
                </div>

                <div className="space-y-3">
                    <p className="text-sm font-medium">Result</p>
                    <div className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-2xl border border-border/60 bg-muted/30 p-6">
                        {output ? (
                            <>
                                <video src={output.url} controls className="max-h-56 max-w-full rounded-xl border border-border/60" />
                                <p className="text-xs text-muted-foreground">{formatBytes(output.blob.size)}</p>
                                <Button type="button" className="w-full rounded-full sm:w-auto" onClick={handleDownload}>
                                    <Download />
                                    Download video
                                </Button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <Video className="h-8 w-8" />
                                <p className="text-xs">Converted video will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
