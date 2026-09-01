"use client"

import { useState } from "react"
import { Download, ImageOff, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ImageDropzone } from "@/components/tools/image-dropzone"
import { ToolSegmentedControl } from "@/components/tools/tool-segmented-control"
import { formatBytes } from "@/lib/image-utils"
import { canvasToBlob, downloadBlob, loadImageElement, replaceExtension } from "@/lib/image-tool-utils"

type SourceState = {
    file: File
    previewUrl: string
    width: number
    height: number
}

const MAX_INPUT_DIMENSION = 2000

function sharpen(imageData: ImageData) {
    const { width, height, data } = imageData
    const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0]
    const output = new Uint8ClampedArray(data)

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            for (let channel = 0; channel < 3; channel++) {
                let sum = 0
                let k = 0
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = ((y + ky) * width + (x + kx)) * 4 + channel
                        sum += data[idx] * kernel[k]
                        k++
                    }
                }
                output[(y * width + x) * 4 + channel] = sum
            }
        }
    }

    return new ImageData(output, width, height)
}

function resolveOutput(file: File): { mime: string; ext: string } {
    if (file.type === "image/jpeg" || file.type === "image/jpg") return { mime: "image/jpeg", ext: "jpg" }
    return { mime: "image/png", ext: "png" }
}

export function ImageUpscalerTool() {
    const [source, setSource] = useState<SourceState | null>(null)
    const [scale, setScale] = useState<"2" | "4">("2")
    const [enhance, setEnhance] = useState(true)
    const [output, setOutput] = useState<{ blob: Blob; url: string } | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    async function handleFileSelect(file: File) {
        setError(null)
        setOutput(null)
        try {
            const loaded = await loadImageElement(file)
            setSource({ file, previewUrl: loaded.url, width: loaded.width, height: loaded.height })
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not load that image.")
        }
    }

    function handleClear() {
        setSource(null)
        setOutput(null)
        setError(null)
    }

    async function handleUpscale() {
        if (!source) return

        if (source.width > MAX_INPUT_DIMENSION || source.height > MAX_INPUT_DIMENSION) {
            setError(`For best performance, use images up to ${MAX_INPUT_DIMENSION}px on each side.`)
            return
        }

        setIsProcessing(true)
        setError(null)

        try {
            const loaded = await loadImageElement(source.file)
            const factor = Number(scale)
            const width = loaded.width * factor
            const height = loaded.height * factor

            const canvas = document.createElement("canvas")
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext("2d")
            if (!ctx) throw new Error("Canvas is not supported in this browser.")

            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = "high"
            ctx.drawImage(loaded.img, 0, 0, width, height)
            URL.revokeObjectURL(loaded.url)

            if (enhance) {
                const imageData = ctx.getImageData(0, 0, width, height)
                ctx.putImageData(sharpen(imageData), 0, 0)
            }

            const { mime } = resolveOutput(source.file)
            const blob = await canvasToBlob(canvas, mime, mime === "image/jpeg" ? 0.95 : undefined)
            const url = URL.createObjectURL(blob)
            setOutput({ blob, url })
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not upscale this image.")
        } finally {
            setIsProcessing(false)
        }
    }

    function handleDownload() {
        if (!output || !source) return
        const { ext } = resolveOutput(source.file)
        downloadBlob(output.blob, replaceExtension(source.file.name, `${scale}x.${ext}`))
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Image Upscaler</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Enlarge images with high-quality resampling and edge sharpening.
            </p>
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                This is an enhanced resize, not a machine-learning model — it won&apos;t invent detail the way an AI
                upscaler would, but it enlarges cleanly with less blur.
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                    <ImageDropzone
                        onFileSelect={handleFileSelect}
                        file={source?.file ?? null}
                        onClear={source ? handleClear : undefined}
                        hint="PNG or JPG, up to 2000px"
                    />

                    {source && (
                        <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/30 p-4">
                            <p className="text-xs text-muted-foreground">
                                Original: {source.width} x {source.height} px · {formatBytes(source.file.size)}
                            </p>

                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">Scale</p>
                                <ToolSegmentedControl
                                    value={scale}
                                    onChange={setScale}
                                    options={[
                                        { value: "2", label: "2x" },
                                        { value: "4", label: "4x" },
                                    ]}
                                />
                            </div>

                            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                <input
                                    type="checkbox"
                                    checked={enhance}
                                    onChange={(e) => setEnhance(e.target.checked)}
                                    className="h-3.5 w-3.5 rounded border-border"
                                />
                                Apply edge sharpening
                            </label>

                            <p className="text-xs text-muted-foreground">
                                Output: {source.width * Number(scale)} x {source.height * Number(scale)} px
                            </p>

                            <Button
                                type="button"
                                className="w-full rounded-full"
                                onClick={handleUpscale}
                                disabled={isProcessing}
                            >
                                {isProcessing ? "Upscaling..." : `Upscale ${scale}x`}
                            </Button>
                        </div>
                    )}

                    {error && <p className="text-sm text-destructive">{error}</p>}
                </div>

                <div className="space-y-3">
                    <p className="text-sm font-medium">Result</p>
                    <div className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-2xl border border-border/60 bg-muted/30 p-6">
                        {output ? (
                            <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={output.url}
                                    alt="Upscaled result"
                                    className="max-h-56 max-w-full rounded-xl border border-border/60 object-contain"
                                />
                                <p className="text-xs text-muted-foreground">{formatBytes(output.blob.size)}</p>
                                <Button type="button" className="w-full rounded-full sm:w-auto" onClick={handleDownload}>
                                    <Download />
                                    Download image
                                </Button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <ImageOff className="h-8 w-8" />
                                <p className="text-xs">Upscaled image will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
