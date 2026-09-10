"use client"

import { useEffect, useRef, useState } from "react"
import { fetchFile } from "@ffmpeg/util"
import { Download, Pause, Play, Scissors, Video } from "lucide-react"

import { Button } from "@/components/ui/button"
import { VideoDropzone } from "@/components/tools/video-dropzone"
import { VideoTimelineTrimmer } from "@/components/tools/video-timeline-trimmer"
import { FFmpegStatus } from "@/components/tools/ffmpeg-status"
import { useFFmpeg } from "@/lib/use-ffmpeg"
import {
    getVideoMeta,
    generateVideoThumbnails,
    bytesToBlob,
    type VideoMeta,
} from "@/lib/video-tool-utils"
import { downloadBlob, replaceExtension } from "@/lib/pdf-tool-utils"

const THUMBNAIL_COUNT = 14

export function VideoTrimmerTool() {
    const { ensureLoaded, isLoading, progress, error: engineError, setError: setEngineError } = useFFmpeg()
    const [file, setFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [meta, setMeta] = useState<VideoMeta | null>(null)
    const [range, setRange] = useState<[number, number]>([0, 0])
    const [output, setOutput] = useState<{ blob: Blob; url: string } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [thumbnails, setThumbnails] = useState<string[]>([])
    const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isPreviewing, setIsPreviewing] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const previewVideoRef = useRef<HTMLVideoElement | null>(null)

    function resetPlaybackState() {
        previewVideoRef.current?.pause()
        setIsPlaying(false)
        setIsPreviewing(false)
        setCurrentTime(0)
    }

    function handleClear() {
        resetPlaybackState()
        setFile(null)
        setPreviewUrl(null)
        setMeta(null)
        setOutput(null)
        setError(null)
        setRange([0, 0])
        setThumbnails([])
        setIsGeneratingThumbnails(false)
    }

    async function handleFileSelect(next: File) {
        resetPlaybackState()
        setError(null)
        setOutput(null)
        setThumbnails([])

        try {
            const info = await getVideoMeta(next)
            setFile(next)
            setPreviewUrl(info.url)
            setMeta(info)
            setRange([0, info.duration])

            setIsGeneratingThumbnails(true)
            try {
                const frames = await generateVideoThumbnails(next, info.duration, THUMBNAIL_COUNT)
                setThumbnails(frames)
            } catch {
                // Filmstrip is a nice-to-have; fall back to a plain timeline bar.
                setThumbnails([])
            } finally {
                setIsGeneratingThumbnails(false)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not load this video.")
        }
    }

    function handleTogglePlay() {
        const video = previewVideoRef.current
        if (!video) return

        if (isPlaying) {
            video.pause()
        } else {
            video.play()
        }
    }

    function handleTogglePreview() {
        const video = previewVideoRef.current
        if (!video) return

        if (isPreviewing) {
            video.pause()
            return
        }

        video.currentTime = range[0]
        setIsPreviewing(true)
        video.play()
    }

    // Generic playback bookkeeping, independent of whether playback was
    // started via the transport Play button or the bounded Preview button.
    useEffect(() => {
        const video = previewVideoRef.current
        if (!video) return

        function handlePlay() {
            setIsPlaying(true)
        }
        function handleStop() {
            setIsPlaying(false)
            setIsPreviewing(false)
        }
        function handleTimeUpdate() {
            setCurrentTime(video!.currentTime)
        }

        video.addEventListener("play", handlePlay)
        video.addEventListener("pause", handleStop)
        video.addEventListener("ended", handleStop)
        video.addEventListener("timeupdate", handleTimeUpdate)

        return () => {
            video.removeEventListener("play", handlePlay)
            video.removeEventListener("pause", handleStop)
            video.removeEventListener("ended", handleStop)
            video.removeEventListener("timeupdate", handleTimeUpdate)
        }
    }, [file])

    // Only clip playback to the selected range while an explicit preview is
    // active, so a normal Play doesn't get cut off at the trim end point.
    useEffect(() => {
        if (!isPreviewing) return
        const video = previewVideoRef.current
        if (!video) return

        function handleBoundaryCheck() {
            if (video!.currentTime >= range[1]) {
                video!.pause()
                video!.currentTime = range[0]
            }
        }

        video.addEventListener("timeupdate", handleBoundaryCheck)
        return () => video.removeEventListener("timeupdate", handleBoundaryCheck)
    }, [isPreviewing, range])

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

    const selectionSeconds = Math.max(0, range[1] - range[0])
    const playheadPercent = meta && meta.duration > 0 ? (currentTime / meta.duration) * 100 : null

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Video Trimmer</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Trim unwanted parts from a video by selecting a start and end point.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                    <VideoDropzone
                        ref={previewVideoRef}
                        onFileSelect={handleFileSelect}
                        file={file}
                        previewUrl={previewUrl}
                        meta={meta}
                        onClear={handleClear}
                        showControls={false}
                    />

                    {file && meta && (
                        <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/30 p-4">
                            <VideoTimelineTrimmer
                                duration={meta.duration}
                                range={range}
                                onRangeChange={setRange}
                                thumbnails={thumbnails}
                                isGeneratingThumbnails={isGeneratingThumbnails}
                                playheadPercent={playheadPercent}
                            />

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="shrink-0 rounded-full"
                                    onClick={handleTogglePlay}
                                >
                                    {isPlaying && !isPreviewing ? <Pause /> : <Play />}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 rounded-full"
                                    onClick={handleTogglePreview}
                                    disabled={range[1] <= range[0]}
                                >
                                    {isPreviewing ? <Pause /> : <Play />}
                                    {isPreviewing ? "Stop preview" : `Preview ${selectionSeconds.toFixed(1)}s`}
                                </Button>
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
