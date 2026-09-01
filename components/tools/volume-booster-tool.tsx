"use client"

import { useState } from "react"
import { fetchFile } from "@ffmpeg/util"
import { Download, Music, Volume2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { AudioDropzone } from "@/components/tools/audio-dropzone"
import { FFmpegStatus } from "@/components/tools/ffmpeg-status"
import { useFFmpeg } from "@/lib/use-ffmpeg"
import { getAudioMeta } from "@/lib/audio-tool-utils"
import { bytesToBlob } from "@/lib/video-tool-utils"
import { downloadBlob, replaceExtension } from "@/lib/pdf-tool-utils"

export function VolumeBoosterTool() {
    const { ensureLoaded, isLoading, progress, error: engineError, setError: setEngineError } = useFFmpeg()
    const [file, setFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [duration, setDuration] = useState(0)
    const [boost, setBoost] = useState(150)
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

    async function handleBoost() {
        if (!file) return
        setIsProcessing(true)
        setError(null)
        setEngineError(null)
        setOutput(null)

        try {
            const ffmpeg = await ensureLoaded()
            const ext = file.name.split(".").pop() || "mp3"
            const inputName = `input.${ext}`
            const outputName = `output.${ext}`

            await ffmpeg.writeFile(inputName, await fetchFile(file))
            await ffmpeg.exec(["-i", inputName, "-af", `volume=${(boost / 100).toFixed(2)}`, "-c:a", "libmp3lame", "-q:a", "2", outputName])

            const data = await ffmpeg.readFile(outputName)
            const blob = bytesToBlob(data as Uint8Array, "audio/mpeg")
            setOutput({ blob, url: URL.createObjectURL(blob) })

            await ffmpeg.deleteFile(inputName)
            await ffmpeg.deleteFile(outputName)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not boost this audio file.")
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
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Volume Booster</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Increase audio loudness by a chosen percentage.
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
                                <p className="text-xs font-medium text-muted-foreground">Volume — {boost}%</p>
                                <Slider value={[boost]} onValueChange={([v]) => setBoost(v)} min={50} max={400} step={10} />
                                <p className="text-[11px] text-muted-foreground">
                                    100% keeps the original level. Above 100% increases loudness — very high boosts
                                    may introduce distortion.
                                </p>
                            </div>

                            <Button
                                type="button"
                                className="w-full rounded-full"
                                onClick={handleBoost}
                                disabled={isProcessing || isLoading}
                            >
                                <Volume2 />
                                {isProcessing ? "Processing..." : "Apply volume change"}
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
                                <Button type="button" className="w-full rounded-full sm:w-auto" onClick={handleDownload}>
                                    <Download />
                                    Download audio
                                </Button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <Music className="h-8 w-8" />
                                <p className="text-xs">Processed audio will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
