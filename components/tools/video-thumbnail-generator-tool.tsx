"use client"

import { useRef, useState } from "react"
import { Camera, Download, ImageOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { VideoDropzone } from "@/components/tools/video-dropzone"
import { downloadBlob } from "@/lib/pdf-tool-utils"
import { getVideoMeta, formatDuration, type VideoMeta } from "@/lib/video-tool-utils"
import { canvasToBlob } from "@/lib/image-tool-utils"

export function VideoThumbnailGeneratorTool() {
    const [file, setFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [meta, setMeta] = useState<VideoMeta | null>(null)
    const [time, setTime] = useState(0)
    const [thumbnail, setThumbnail] = useState<{ blob: Blob; url: string } | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isCapturing, setIsCapturing] = useState(false)
    const videoRef = useRef<HTMLVideoElement | null>(null)

    function handleClear() {
        setFile(null)
        setPreviewUrl(null)
        setMeta(null)
        setThumbnail(null)
        setError(null)
        setTime(0)
    }

    async function handleFileSelect(next: File) {
        setError(null)
        setThumbnail(null)
        try {
            const info = await getVideoMeta(next)
            setFile(next)
            setPreviewUrl(info.url)
            setMeta(info)
            setTime(Math.min(1, info.duration / 2))
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not load this video.")
        }
    }

    function handleSeek(value: number) {
        setTime(value)
        const video = videoRef.current
        if (video) video.currentTime = value
    }

    async function handleCapture() {
        const video = videoRef.current
        if (!video) return
        setIsCapturing(true)
        setError(null)

        try {
            const canvas = document.createElement("canvas")
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            const ctx = canvas.getContext("2d")
            if (!ctx) throw new Error("Canvas is not supported in this browser.")

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            const blob = await canvasToBlob(canvas, "image/png")
            setThumbnail({ blob, url: URL.createObjectURL(blob) })
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not capture a thumbnail.")
        } finally {
            setIsCapturing(false)
        }
    }

    function handleDownload() {
        if (!thumbnail || !file) return
        downloadBlob(thumbnail.blob, `${file.name.replace(/\.[^./\\]+$/, "")}-thumbnail.png`)
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Thumbnail Generator</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Capture a frame from any point in your video as a downloadable image.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                    <VideoDropzone onFileSelect={handleFileSelect} file={file} onClear={handleClear} />

                    {file && meta && (
                        <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/30 p-4">
                            <video
                                ref={videoRef}
                                src={previewUrl ?? undefined}
                                className="hidden"
                                preload="metadata"
                            />

                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Time — {formatDuration(time)} / {formatDuration(meta.duration)}
                                </p>
                                <Slider
                                    value={[time]}
                                    onValueChange={([v]) => handleSeek(v)}
                                    min={0}
                                    max={meta.duration}
                                    step={0.1}
                                />
                            </div>

                            <Button
                                type="button"
                                className="w-full rounded-full"
                                onClick={handleCapture}
                                disabled={isCapturing}
                            >
                                <Camera />
                                {isCapturing ? "Capturing..." : "Capture frame"}
                            </Button>
                        </div>
                    )}

                    {error && <p className="text-sm text-destructive">{error}</p>}
                </div>

                <div className="space-y-3">
                    <p className="text-sm font-medium">Result</p>
                    <div className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-2xl border border-border/60 bg-muted/30 p-6">
                        {thumbnail ? (
                            <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={thumbnail.url}
                                    alt="Captured thumbnail"
                                    className="max-h-56 max-w-full rounded-xl border border-border/60 object-contain"
                                />
                                <Button type="button" className="w-full rounded-full sm:w-auto" onClick={handleDownload}>
                                    <Download />
                                    Download PNG
                                </Button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <ImageOff className="h-8 w-8" />
                                <p className="text-xs">Captured thumbnail will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
