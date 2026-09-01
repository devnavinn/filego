"use client"

import { useState } from "react"
import { Download, ImageOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { ImageDropzone } from "@/components/tools/image-dropzone"
import { formatBytes } from "@/lib/image-utils"
import { canvasToBlob, downloadBlob, loadImageElement, replaceExtension } from "@/lib/image-tool-utils"

type TargetMime = "image/jpeg" | "image/png" | "image/webp"

type ConverterConfig = {
    title: string
    description: string
    accept: string
    hint: string
    targetMime: TargetMime
    targetExt: string
    needsBackground: boolean
    allowScale?: boolean
}

type SourceState = {
    file: File
    previewUrl: string
    width: number
    height: number
}

export function ImageFormatConverterCore({
    title,
    description,
    accept,
    hint,
    targetMime,
    targetExt,
    needsBackground,
    allowScale = false,
}: ConverterConfig) {
    const [source, setSource] = useState<SourceState | null>(null)
    const [quality, setQuality] = useState(90)
    const [bgColor, setBgColor] = useState("#ffffff")
    const [scalePercent, setScalePercent] = useState(100)
    const [output, setOutput] = useState<{ blob: Blob; url: string } | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isConverting, setIsConverting] = useState(false)

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

    async function handleConvert() {
        if (!source) return
        setIsConverting(true)
        setError(null)

        try {
            const loaded = await loadImageElement(source.file)
            const scale = allowScale ? scalePercent / 100 : 1
            const width = Math.max(1, Math.round(loaded.width * scale))
            const height = Math.max(1, Math.round(loaded.height * scale))

            const canvas = document.createElement("canvas")
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext("2d")
            if (!ctx) throw new Error("Canvas is not supported in this browser.")

            if (needsBackground) {
                ctx.fillStyle = bgColor
                ctx.fillRect(0, 0, width, height)
            }

            ctx.drawImage(loaded.img, 0, 0, width, height)
            URL.revokeObjectURL(loaded.url)

            const blob = await canvasToBlob(canvas, targetMime, targetMime === "image/png" ? undefined : quality / 100)
            const url = URL.createObjectURL(blob)
            setOutput({ blob, url })
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not convert this image.")
        } finally {
            setIsConverting(false)
        }
    }

    function handleDownload() {
        if (!output || !source) return
        downloadBlob(output.blob, replaceExtension(source.file.name, targetExt))
    }

    const showQuality = targetMime !== "image/png"

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">{description}</p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                    <ImageDropzone
                        onFileSelect={handleFileSelect}
                        file={source?.file ?? null}
                        onClear={source ? handleClear : undefined}
                        accept={accept}
                        hint={hint}
                    />

                    {source && (
                        <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/30 p-4">
                            <p className="text-xs text-muted-foreground">
                                {source.width} x {source.height} px
                            </p>

                            {allowScale && (
                                <div className="space-y-1.5">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Output size — {scalePercent}%
                                    </p>
                                    <Slider
                                        value={[scalePercent]}
                                        onValueChange={([v]) => setScalePercent(v)}
                                        min={25}
                                        max={400}
                                        step={25}
                                    />
                                </div>
                            )}

                            {showQuality && (
                                <div className="space-y-1.5">
                                    <p className="text-xs font-medium text-muted-foreground">Quality — {quality}%</p>
                                    <Slider
                                        value={[quality]}
                                        onValueChange={([v]) => setQuality(v)}
                                        min={10}
                                        max={100}
                                        step={5}
                                    />
                                </div>
                            )}

                            {needsBackground && (
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Background color (for transparency)
                                    </p>
                                    <input
                                        type="color"
                                        value={bgColor}
                                        onChange={(e) => setBgColor(e.target.value)}
                                        className="h-7 w-10 cursor-pointer rounded border border-border/60 bg-transparent"
                                    />
                                </div>
                            )}

                            <Button
                                type="button"
                                className="w-full rounded-full"
                                onClick={handleConvert}
                                disabled={isConverting}
                            >
                                {isConverting ? "Converting..." : `Convert to ${targetExt.toUpperCase()}`}
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
                                    alt="Converted result"
                                    className="max-h-56 max-w-full rounded-xl border border-border/60 object-contain"
                                />
                                <p className="text-xs text-muted-foreground">
                                    {formatBytes(output.blob.size)}
                                    {source && ` · from ${formatBytes(source.file.size)}`}
                                </p>
                                <Button type="button" className="w-full rounded-full sm:w-auto" onClick={handleDownload}>
                                    <Download />
                                    Download {targetExt.toUpperCase()}
                                </Button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <ImageOff className="h-8 w-8" />
                                <p className="text-xs">Converted image will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export function PngToJpgTool() {
    return (
        <ImageFormatConverterCore
            title="PNG to JPG"
            description="Convert PNG images into JPG format, flattening transparency onto a background color."
            accept="image/png"
            hint="PNG images"
            targetMime="image/jpeg"
            targetExt="jpg"
            needsBackground
        />
    )
}

export function JpgToPngTool() {
    return (
        <ImageFormatConverterCore
            title="JPG to PNG"
            description="Convert JPG images into lossless PNG format."
            accept="image/jpeg"
            hint="JPG or JPEG images"
            targetMime="image/png"
            targetExt="png"
            needsBackground={false}
        />
    )
}

export function WebpToJpgTool() {
    return (
        <ImageFormatConverterCore
            title="WEBP to JPG"
            description="Convert WEBP images into widely supported JPG format."
            accept="image/webp"
            hint="WEBP images"
            targetMime="image/jpeg"
            targetExt="jpg"
            needsBackground
        />
    )
}

export function WebpToPngTool() {
    return (
        <ImageFormatConverterCore
            title="WEBP to PNG"
            description="Convert WEBP images into lossless PNG format."
            accept="image/webp"
            hint="WEBP images"
            targetMime="image/png"
            targetExt="png"
            needsBackground={false}
        />
    )
}

export function SvgToPngTool() {
    return (
        <ImageFormatConverterCore
            title="SVG to PNG"
            description="Rasterize SVG graphics into PNG images at the size you choose."
            accept="image/svg+xml,.svg"
            hint="SVG files"
            targetMime="image/png"
            targetExt="png"
            needsBackground={false}
            allowScale
        />
    )
}
