"use client"

import { useState } from "react"
import { fetchFile } from "@ffmpeg/util"
import { Download, Music, Music2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { VideoDropzone } from "@/components/tools/video-dropzone"
import { FFmpegStatus } from "@/components/tools/ffmpeg-status"
import { ToolSegmentedControl } from "@/components/tools/tool-segmented-control"
import { useFFmpeg } from "@/lib/use-ffmpeg"
import { getVideoMeta, bytesToBlob, type VideoMeta } from "@/lib/video-tool-utils"
import { formatBytes } from "@/lib/image-utils"
import { downloadBlob, replaceExtension } from "@/lib/pdf-tool-utils"

type Quality = "128" | "192" | "320"

const QUALITY_OPTIONS: Record<Quality, string> = {
    "128": "Standard (128 kbps)",
    "192": "High (192 kbps)",
    "320": "Best (320 kbps)",
}

export function VideoToMp3Tool() {
    const { ensureLoaded, isLoading, progress, error: engineError, setError: setEngineError } = useFFmpeg()
    const [file, setFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [meta, setMeta] = useState<VideoMeta | null>(null)
    const [quality, setQuality] = useState<Quality>("192")
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
            const outputName = "output.mp3"

            await ffmpeg.writeFile(inputName, await fetchFile(file))
            await ffmpeg.exec(["-i", inputName, "-vn", "-c:a", "libmp3lame", "-b:a", `${quality}k`, outputName])

            const data = await ffmpeg.readFile(outputName)
            const blob = bytesToBlob(data as Uint8Array, "audio/mpeg")
            setOutput({ blob, url: URL.createObjectURL(blob) })

            await ffmpeg.deleteFile(inputName)
            await ffmpeg.deleteFile(outputName)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not convert this video to MP3.")
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
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">Video to MP3</h2>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Convert a video file into an MP3 audio track, right in your browser.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                    <VideoDropzone onFileSelect={handleFileSelect} file={file} previewUrl={previewUrl} meta={meta} onClear={handleClear} />

                    {file && (
                        <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/30 p-4">
                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">MP3 quality</p>
                                <ToolSegmentedControl
                                    value={quality}
                                    onChange={setQuality}
                                    options={(Object.keys(QUALITY_OPTIONS) as Quality[]).map((key) => ({
                                        value: key,
                                        label: QUALITY_OPTIONS[key],
                                    }))}
                                />
                            </div>

                            <Button
                                type="button"
                                className="w-full rounded-full"
                                onClick={handleConvert}
                                disabled={isProcessing || isLoading}
                            >
                                <Music2 />
                                {isProcessing ? "Converting..." : "Convert to MP3"}
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
                                <audio src={output.url} controls className="w-full" />
                                <p className="text-xs text-muted-foreground">{formatBytes(output.blob.size)}</p>
                                <Button type="button" className="w-full rounded-full sm:w-auto" onClick={handleDownload}>
                                    <Download />
                                    Download MP3
                                </Button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <Music className="h-8 w-8" />
                                <p className="text-xs">Your converted MP3 will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
