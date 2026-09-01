"use client"

import { useState } from "react"
import { fetchFile } from "@ffmpeg/util"
import { Download, Scissors, Video } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { VideoDropzone } from "@/components/tools/video-dropzone"
import { FFmpegStatus } from "@/components/tools/ffmpeg-status"
import { useFFmpeg } from "@/lib/use-ffmpeg"
import { getVideoMeta, formatDuration, bytesToBlob, type VideoMeta } from "@/lib/video-tool-utils"
import { downloadBlob, replaceExtension } from "@/lib/pdf-tool-utils"

export function VideoTrimmerTool() {
    const { ensureLoaded, isLoading, progress, error: engineError, setError: setEngineError } = useFFmpeg()
    const [file, setFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [meta, setMeta] = useState<VideoMeta | null>(null)
    const [range, setRange] = useState<[number, number]>([0, 0])
    const [output, setOutput] = useState<{ blob: Blob; url: string } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function handleClear() {
        setFile(null)
        setPreviewUrl(null)
        setMeta(null)
        setOutput(null)
        setError(null)
        setRange([0, 0])
    }

    async function handleFileSelect(next: File) {
        setError(null)
        setOutput(null)
        try {
            const info = await getVideoMeta(next)
            setFile(next)
            setPreviewUrl(info.url)
            setMeta(info)
            setRange([0, info.duration])
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not load this video.")
        }
    }

    async function handleTrim() {
        if (!file || !meta) return
        setIsProcessing(true)
        setError(null)
        setEngineError(null)
        setOutput(null)

        try {
            const ffmpeg = await ensureLoaded()
            const ext = file.name.split(".").pop() || "mp4"
            const inputName = `input.${ext}`
            const outputName = `output.${ext === "mov" || ext === "avi" ? "mp4" : ext}`

            await ffmpeg.writeFile(inputName, await fetchFile(file))

            const [start, end] = range
            await ffmpeg.exec([
                "-i", inputName,
                "-ss", start.toFixed(2),
                "-to", end.toFixed(2),
                "-c:v", "libx264",
                "-c:a", "aac",
                outputName,
            ])

            const data = await ffmpeg.readFile(outputName)
            const blob = bytesToBlob(data as Uint8Array, "video/mp4")
            setOutput({ blob, url: URL.createObjectURL(blob) })

            await ffmpeg.deleteFile(inputName)
            await ffmpeg.deleteFile(outputName)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not trim this video.")
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
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Video Trimmer</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Trim unwanted parts from a video by selecting a start and end point.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                    <VideoDropzone onFileSelect={handleFileSelect} file={file} previewUrl={previewUrl} meta={meta} onClear={handleClear} />

                    {file && meta && (
                        <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/30 p-4">
                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">
                                    {formatDuration(range[0])} – {formatDuration(range[1])} ·{" "}
                                    {formatDuration(range[1] - range[0])} selected
                                </p>
                                <Slider
                                    value={range}
                                    onValueChange={(v) => setRange([v[0], v[1]] as [number, number])}
                                    min={0}
                                    max={meta.duration}
                                    step={0.1}
                                    minStepsBetweenThumbs={1}
                                />
                            </div>

                            <Button
                                type="button"
                                className="w-full rounded-full"
                                onClick={handleTrim}
                                disabled={isProcessing || isLoading || range[1] <= range[0]}
                            >
                                <Scissors />
                                {isProcessing ? "Trimming..." : "Trim video"}
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
                                <Button type="button" className="w-full rounded-full sm:w-auto" onClick={handleDownload}>
                                    <Download />
                                    Download video
                                </Button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <Video className="h-8 w-8" />
                                <p className="text-xs">Trimmed video will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
