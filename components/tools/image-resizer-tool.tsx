"use client"

import { useState } from "react"
import { Download, ImageOff, Link2, Unlink } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ImageDropzone } from "@/components/tools/image-dropzone"
import { formatBytes } from "@/lib/image-utils"
import { canvasToBlob, downloadBlob, loadImageElement, replaceExtension } from "@/lib/image-tool-utils"

type SourceState = {
    file: File
    previewUrl: string
    width: number
    height: number
}

const PRESETS = [25, 50, 75, 100]

function resolveOutput(file: File): { mime: string; ext: string } {
    if (file.type === "image/jpeg" || file.type === "image/jpg") return { mime: "image/jpeg", ext: "jpg" }
    if (file.type === "image/webp") return { mime: "image/webp", ext: "webp" }
    return { mime: "image/png", ext: "png" }
}

export function ImageResizerTool() {
    const [source, setSource] = useState<SourceState | null>(null)
    const [width, setWidth] = useState(0)
    const [height, setHeight] = useState(0)
    const [lockAspect, setLockAspect] = useState(true)
    const [output, setOutput] = useState<{ blob: Blob; url: string } | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isResizing, setIsResizing] = useState(false)

    async function handleFileSelect(file: File) {
        setError(null)
        setOutput(null)
        try {
            const loaded = await loadImageElement(file)
            setSource({ file, previewUrl: loaded.url, width: loaded.width, height: loaded.height })
            setWidth(loaded.width)
            setHeight(loaded.height)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not load that image.")
        }
    }

    function handleWidthChange(value: number) {
        setWidth(value)
        if (lockAspect && source) {
            setHeight(Math.max(1, Math.round((value * source.height) / source.width)))
        }
    }

    function handleHeightChange(value: number) {
        setHeight(value)
        if (lockAspect && source) {
            setWidth(Math.max(1, Math.round((value * source.width) / source.height)))
        }
    }

    function applyPreset(percent: number) {
        if (!source) return
        const nextWidth = Math.max(1, Math.round((source.width * percent) / 100))
        const nextHeight = Math.max(1, Math.round((source.height * percent) / 100))
        setWidth(nextWidth)
        setHeight(nextHeight)
    }

    async function handleResize() {
        if (!source || width < 1 || height < 1) return
        setIsResizing(true)
        setError(null)

        try {
            const loaded = await loadImageElement(source.file)
            const canvas = document.createElement("canvas")
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext("2d")
            if (!ctx) throw new Error("Canvas is not supported in this browser.")

            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = "high"
            ctx.drawImage(loaded.img, 0, 0, width, height)
            URL.revokeObjectURL(loaded.url)

            const { mime } = resolveOutput(source.file)
            const blob = await canvasToBlob(canvas, mime, mime === "image/png" ? undefined : 0.92)
            const url = URL.createObjectURL(blob)
            setOutput({ blob, url })
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not resize this image.")
        } finally {
            setIsResizing(false)
        }
    }

    function handleDownload() {
        if (!output || !source) return
        const { ext } = resolveOutput(source.file)
        downloadBlob(output.blob, replaceExtension(source.file.name, ext))
    }

    function handleClear() {
        setSource(null)
        setOutput(null)
        setError(null)
        setWidth(0)
        setHeight(0)
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Image Resizer</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Resize images to exact dimensions while keeping quality sharp.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                    <ImageDropzone
                        onFileSelect={handleFileSelect}
                        file={source?.file ?? null}
                        onClear={source ? handleClear : undefined}
                        hint="PNG, JPG, or WEBP"
                    />

                    {source && (
                        <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/30 p-4">
                            <p className="text-xs text-muted-foreground">
                                Original: {source.width} x {source.height} px · {formatBytes(source.file.size)}
                            </p>

                            <div className="flex items-end gap-2">
                                <div className="flex-1 space-y-1.5">
                                    <p className="text-xs font-medium text-muted-foreground">Width (px)</p>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={width}
                                        onChange={(e) => handleWidthChange(Number(e.target.value))}
                                        className="h-9 rounded-xl"
                                    />
                                </div>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="mb-0.5 rounded-full"
                                    onClick={() => setLockAspect((v) => !v)}
                                    title={lockAspect ? "Aspect ratio locked" : "Aspect ratio unlocked"}
                                >
                                    {lockAspect ? <Link2 /> : <Unlink />}
                                </Button>

                                <div className="flex-1 space-y-1.5">
                                    <p className="text-xs font-medium text-muted-foreground">Height (px)</p>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={height}
                                        onChange={(e) => handleHeightChange(Number(e.target.value))}
                                        className="h-9 rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {PRESETS.map((preset) => (
                                    <Button
                                        key={preset}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="rounded-full"
                                        onClick={() => applyPreset(preset)}
                                    >
                                        {preset}%
                                    </Button>
                                ))}
                            </div>

                            <Button
                                type="button"
                                className="w-full rounded-full"
                                onClick={handleResize}
                                disabled={isResizing}
                            >
                                {isResizing ? "Resizing..." : "Resize image"}
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
                                    alt="Resized result"
                                    className="max-h-56 max-w-full rounded-xl border border-border/60 object-contain"
                                />
                                <p className="text-xs text-muted-foreground">
                                    {width} x {height} px · {formatBytes(output.blob.size)}
                                </p>
                                <Button type="button" className="w-full rounded-full sm:w-auto" onClick={handleDownload}>
                                    <Download />
                                    Download image
                                </Button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <ImageOff className="h-8 w-8" />
                                <p className="text-xs">Resized image will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
