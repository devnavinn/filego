"use client"

import { useState } from "react"
import { fetchFile } from "@ffmpeg/util"
import { Download, Music, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { AudioDropzone } from "@/components/tools/audio-dropzone"
import { FFmpegStatus } from "@/components/tools/ffmpeg-status"
import { useFFmpeg } from "@/lib/use-ffmpeg"
import { getAudioMeta } from "@/lib/audio-tool-utils"
import { bytesToBlob } from "@/lib/video-tool-utils"
import { formatBytes } from "@/lib/image-utils"
import { downloadBlob, replaceExtension } from "@/lib/pdf-tool-utils"

type Format = "mp3" | "wav" | "m4a" | "ogg" | "flac"

const FORMATS: Record<Format, { label: string; mime: string; args: (input: string, output: string) => string[] }> = {
    mp3: { label: "MP3", mime: "audio/mpeg", args: (i, o) => ["-i", i, "-c:a", "libmp3lame", "-q:a", "2", o] },
    wav: { label: "WAV", mime: "audio/wav", args: (i, o) => ["-i", i, "-c:a", "pcm_s16le", o] },
    m4a: { label: "M4A (AAC)", mime: "audio/mp4", args: (i, o) => ["-i", i, "-c:a", "aac", "-b:a", "192k", o] },
    ogg: { label: "OGG", mime: "audio/ogg", args: (i, o) => ["-i", i, "-c:a", "libvorbis", "-q:a", "5", o] },
    flac: { label: "FLAC", mime: "audio/flac", args: (i, o) => ["-i", i, "-c:a", "flac", o] },
}

export function AudioConverterTool() {
    const { ensureLoaded, isLoading, progress, error: engineError, setError: setEngineError } = useFFmpeg()
    const [file, setFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [duration, setDuration] = useState(0)
    const [format, setFormat] = useState<Format>("mp3")
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

    async function handleConvert() {
        if (!file) return
        setIsProcessing(true)
        setError(null)
        setEngineError(null)
        setOutput(null)

        try {
            const ffmpeg = await ensureLoaded()
            const ext = file.name.split(".").pop() || "mp3"
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
            setError(err instanceof Error ? err.message : "Could not convert this audio file.")
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
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Audio Converter</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Convert audio files between MP3, WAV, M4A, OGG, and FLAC formats.
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
                                <p className="text-xs">Converted audio will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
