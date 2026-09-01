"use client"

import { useState } from "react"
import { fetchFile } from "@ffmpeg/util"
import { Download, FileImage, ImageOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { VideoDropzone } from "@/components/tools/video-dropzone"
import { FFmpegStatus } from "@/components/tools/ffmpeg-status"
import { ToolSegmentedControl } from "@/components/tools/tool-segmented-control"
import { useFFmpeg } from "@/lib/use-ffmpeg"
import { getVideoMeta, formatDuration, bytesToBlob, type VideoMeta } from "@/lib/video-tool-utils"
import { formatBytes } from "@/lib/image-utils"
import { downloadBlob } from "@/lib/pdf-tool-utils"

const MAX_GIF_SECONDS = 10

export function VideoToGifTool() {
    const { ensureLoaded, isLoading, progress, error: engineError, setError: setEngineError } = useFFmpeg()
    const [file, setFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [meta, setMeta] = useState<VideoMeta | null>(null)
    const [range, setRange] = useState<[number, number]>([0, 0])
    const [fps, setFps] = useState<"8" | "12" | "18">("12")
    const [width, setWidth] = useState<"320" | "480" | "640">("480")
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
            setRange([0, Math.min(info.duration, MAX_GIF_SECONDS)])
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

            await ffmpeg.writeFile(inputName, await fetchFile(file))

            const [start, end] = range
            const duration = (end - start).toFixed(2)
            const filter = `fps=${fps},scale=${width}:-1:flags=lanczos`

            await ffmpeg.exec([
                "-ss", start.toFixed(2), "-t", duration, "-i", inputName,
                "-vf", `${filter},palettegen`, "palette.png",
            ])

            await ffmpeg.exec([
                "-ss", start.toFixed(2), "-t", duration, "-i", inputName,
                "-i", "palette.png",
                "-filter_complex", `${filter}[x];[x][1:v]paletteuse`,
                "output.gif",
            ])

            const data = await ffmpeg.readFile("output.gif")
            const blob = bytesToBlob(data as Uint8Array, "image/gif")
            setOutput({ blob, url: URL.createObjectURL(blob) })

            await ffmpeg.deleteFile(inputName)
            await ffmpeg.deleteFile("palette.png")
            await ffmpeg.deleteFile("output.gif")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not convert this video to GIF.")
        } finally {
            setIsProcessing(false)
        }
    }

    function handleDownload() {
        if (!output || !file) return
        downloadBlob(output.blob, `${file.name.replace(/\.[^./\\]+$/, "")}.gif`)
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Video to GIF</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Convert a short clip into an animated GIF (up to {MAX_GIF_SECONDS}s).
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
                                    onValueChange={(v) => {
                                        const [s, e] = v
                                        setRange(e - s > MAX_GIF_SECONDS ? [s, s + MAX_GIF_SECONDS] : [s, e])
                                    }}
                                    min={0}
                                    max={meta.duration}
                                    step={0.1}
                                    minStepsBetweenThumbs={1}
                                />
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                                <div className="flex-1 space-y-1.5">
                                    <p className="text-xs font-medium text-muted-foreground">Frame rate</p>
                                    <ToolSegmentedControl
                                        value={fps}
                                        onChange={setFps}
                                        options={[
                                            { value: "8", label: "8 fps" },
                                            { value: "12", label: "12 fps" },
                                            { value: "18", label: "18 fps" },
                                        ]}
                                    />
                                </div>
                                <div className="flex-1 space-y-1.5">
                                    <p className="text-xs font-medium text-muted-foreground">Width</p>
                                    <ToolSegmentedControl
                                        value={width}
                                        onChange={setWidth}
                                        options={[
                                            { value: "320", label: "320px" },
                                            { value: "480", label: "480px" },
                                            { value: "640", label: "640px" },
                                        ]}
                                    />
                                </div>
                            </div>

                            <Button
                                type="button"
                                className="w-full rounded-full"
                                onClick={handleConvert}
                                disabled={isProcessing || isLoading || range[1] <= range[0]}
                            >
                                <FileImage />
                                {isProcessing ? "Converting..." : "Convert to GIF"}
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
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={output.url}
                                    alt="Converted GIF"
                                    className="max-h-56 max-w-full rounded-xl border border-border/60"
                                />
                                <p className="text-xs text-muted-foreground">{formatBytes(output.blob.size)}</p>
                                <Button type="button" className="w-full rounded-full sm:w-auto" onClick={handleDownload}>
                                    <Download />
                                    Download GIF
                                </Button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <ImageOff className="h-8 w-8" />
                                <p className="text-xs">Converted GIF will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
