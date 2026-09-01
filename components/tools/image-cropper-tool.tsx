"use client"

import { useRef, useState } from "react"
import { Download, ImageOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ImageDropzone } from "@/components/tools/image-dropzone"
import { cn } from "@/lib/utils"
import { formatBytes } from "@/lib/image-utils"
import { canvasToBlob, downloadBlob, loadImageElement, replaceExtension } from "@/lib/image-tool-utils"

type SourceState = {
    file: File
    previewUrl: string
    naturalWidth: number
    naturalHeight: number
    displayWidth: number
    displayHeight: number
}

type CropRect = { x: number; y: number; width: number; height: number }

type DragMode = "move" | "nw" | "ne" | "sw" | "se"

type DragState = {
    mode: DragMode
    startX: number
    startY: number
    startRect: CropRect
}

const MAX_DISPLAY_WIDTH = 460
const MIN_CROP_SIZE = 24

const ASPECT_PRESETS: { label: string; value: number | null }[] = [
    { label: "Free", value: null },
    { label: "1:1", value: 1 },
    { label: "4:3", value: 4 / 3 },
    { label: "3:4", value: 3 / 4 },
    { label: "16:9", value: 16 / 9 },
]

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

function resolveOutput(file: File): { mime: string; ext: string } {
    if (file.type === "image/jpeg" || file.type === "image/jpg") return { mime: "image/jpeg", ext: "jpg" }
    if (file.type === "image/webp") return { mime: "image/webp", ext: "webp" }
    return { mime: "image/png", ext: "png" }
}

export function ImageCropperTool() {
    const [source, setSource] = useState<SourceState | null>(null)
    const [cropRect, setCropRect] = useState<CropRect | null>(null)
    const [aspect, setAspect] = useState<number | null>(null)
    const [output, setOutput] = useState<{ blob: Blob; url: string } | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isCropping, setIsCropping] = useState(false)
    const dragRef = useRef<DragState | null>(null)

    async function handleFileSelect(file: File) {
        setError(null)
        setOutput(null)
        try {
            const loaded = await loadImageElement(file)
            const scale = Math.min(1, MAX_DISPLAY_WIDTH / loaded.width)
            const displayWidth = Math.round(loaded.width * scale)
            const displayHeight = Math.round(loaded.height * scale)

            setSource({
                file,
                previewUrl: loaded.url,
                naturalWidth: loaded.width,
                naturalHeight: loaded.height,
                displayWidth,
                displayHeight,
            })

            const boxWidth = Math.round(displayWidth * 0.8)
            const boxHeight = Math.round(displayHeight * 0.8)
            setAspect(null)
            setCropRect({
                x: Math.round((displayWidth - boxWidth) / 2),
                y: Math.round((displayHeight - boxHeight) / 2),
                width: boxWidth,
                height: boxHeight,
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not load that image.")
        }
    }

    function applyAspect(ratio: number | null) {
        setAspect(ratio)
        if (!source || !cropRect || ratio === null) return

        let width = cropRect.width
        let height = Math.round(width / ratio)

        if (height > source.displayHeight) {
            height = source.displayHeight
            width = Math.round(height * ratio)
        }

        setCropRect({
            x: clamp(cropRect.x, 0, source.displayWidth - width),
            y: clamp(cropRect.y, 0, source.displayHeight - height),
            width,
            height,
        })
    }

    function startDrag(e: React.PointerEvent<HTMLDivElement>, mode: DragMode) {
        if (!cropRect) return
        e.preventDefault()
        e.stopPropagation()
        e.currentTarget.setPointerCapture(e.pointerId)
        dragRef.current = { mode, startX: e.clientX, startY: e.clientY, startRect: { ...cropRect } }
    }

    function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
        const drag = dragRef.current
        if (!drag || !source) return

        const dx = e.clientX - drag.startX
        const dy = e.clientY - drag.startY
        const bounds = { width: source.displayWidth, height: source.displayHeight }
        const start = drag.startRect

        if (drag.mode === "move") {
            setCropRect({
                x: clamp(start.x + dx, 0, bounds.width - start.width),
                y: clamp(start.y + dy, 0, bounds.height - start.height),
                width: start.width,
                height: start.height,
            })
            return
        }

        let { x, y, width, height } = start

        if (drag.mode === "se") {
            width = clamp(start.width + dx, MIN_CROP_SIZE, bounds.width - start.x)
            height = aspect ? Math.round(width / aspect) : clamp(start.height + dy, MIN_CROP_SIZE, bounds.height - start.y)
        } else if (drag.mode === "sw") {
            width = clamp(start.width - dx, MIN_CROP_SIZE, start.x + start.width)
            height = aspect ? Math.round(width / aspect) : clamp(start.height + dy, MIN_CROP_SIZE, bounds.height - start.y)
            x = start.x + start.width - width
        } else if (drag.mode === "ne") {
            width = clamp(start.width + dx, MIN_CROP_SIZE, bounds.width - start.x)
            height = aspect ? Math.round(width / aspect) : clamp(start.height - dy, MIN_CROP_SIZE, start.y + start.height)
            y = start.y + start.height - height
        } else if (drag.mode === "nw") {
            width = clamp(start.width - dx, MIN_CROP_SIZE, start.x + start.width)
            height = aspect ? Math.round(width / aspect) : clamp(start.height - dy, MIN_CROP_SIZE, start.y + start.height)
            x = start.x + start.width - width
            y = start.y + start.height - height
        }

        x = clamp(x, 0, bounds.width - width)
        y = clamp(y, 0, bounds.height - height)

        setCropRect({ x, y, width, height })
    }

    function endDrag(e: React.PointerEvent<HTMLDivElement>) {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
        }
        dragRef.current = null
    }

    async function handleCrop() {
        if (!source || !cropRect) return
        setIsCropping(true)
        setError(null)

        try {
            const loaded = await loadImageElement(source.file)
            const scaleToNatural = source.naturalWidth / source.displayWidth

            const sx = Math.round(cropRect.x * scaleToNatural)
            const sy = Math.round(cropRect.y * scaleToNatural)
            const sw = Math.round(cropRect.width * scaleToNatural)
            const sh = Math.round(cropRect.height * scaleToNatural)

            const canvas = document.createElement("canvas")
            canvas.width = sw
            canvas.height = sh
            const ctx = canvas.getContext("2d")
            if (!ctx) throw new Error("Canvas is not supported in this browser.")

            ctx.drawImage(loaded.img, sx, sy, sw, sh, 0, 0, sw, sh)
            URL.revokeObjectURL(loaded.url)

            const { mime } = resolveOutput(source.file)
            const blob = await canvasToBlob(canvas, mime, mime === "image/png" ? undefined : 0.92)
            const url = URL.createObjectURL(blob)
            setOutput({ blob, url })
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not crop this image.")
        } finally {
            setIsCropping(false)
        }
    }

    function handleDownload() {
        if (!output || !source) return
        const { ext } = resolveOutput(source.file)
        downloadBlob(output.blob, replaceExtension(source.file.name, ext))
    }

    const handleClass =
        "absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background touch-none"

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Image Cropper</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Drag the crop box to select the area you need, then export the cropped image.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                    <ImageDropzone onFileSelect={handleFileSelect} hint="PNG, JPG, or WEBP" />

                    {source && cropRect && (
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {ASPECT_PRESETS.map((preset) => (
                                    <Button
                                        key={preset.label}
                                        type="button"
                                        variant={aspect === preset.value ? "secondary" : "outline"}
                                        size="sm"
                                        className="rounded-full"
                                        onClick={() => applyAspect(preset.value)}
                                    >
                                        {preset.label}
                                    </Button>
                                ))}
                            </div>

                            <div
                                className="relative mx-auto touch-none select-none overflow-hidden rounded-xl bg-black/5"
                                style={{ width: source.displayWidth, height: source.displayHeight }}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={source.previewUrl}
                                    alt={source.file.name}
                                    className="pointer-events-none absolute inset-0 h-full w-full object-contain"
                                    draggable={false}
                                />

                                {/* dim outside the crop box */}
                                <div
                                    className="pointer-events-none absolute inset-x-0 top-0 bg-black/50"
                                    style={{ height: cropRect.y }}
                                />
                                <div
                                    className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/50"
                                    style={{ height: source.displayHeight - cropRect.y - cropRect.height }}
                                />
                                <div
                                    className="pointer-events-none absolute bg-black/50"
                                    style={{ left: 0, top: cropRect.y, width: cropRect.x, height: cropRect.height }}
                                />
                                <div
                                    className="pointer-events-none absolute bg-black/50"
                                    style={{
                                        left: cropRect.x + cropRect.width,
                                        top: cropRect.y,
                                        right: 0,
                                        height: cropRect.height,
                                    }}
                                />

                                <div
                                    onPointerDown={(e) => startDrag(e, "move")}
                                    onPointerMove={handlePointerMove}
                                    onPointerUp={endDrag}
                                    className="absolute cursor-move touch-none border-2 border-primary"
                                    style={{
                                        left: cropRect.x,
                                        top: cropRect.y,
                                        width: cropRect.width,
                                        height: cropRect.height,
                                    }}
                                >
                                    {(["nw", "ne", "sw", "se"] as const).map((corner) => (
                                        <div
                                            key={corner}
                                            onPointerDown={(e) => startDrag(e, corner)}
                                            onPointerMove={handlePointerMove}
                                            onPointerUp={endDrag}
                                            className={cn(
                                                handleClass,
                                                corner === "nw" && "top-0 left-0 cursor-nwse-resize",
                                                corner === "ne" && "top-0 left-full cursor-nesw-resize",
                                                corner === "sw" && "top-full left-0 cursor-nesw-resize",
                                                corner === "se" && "top-full left-full cursor-nwse-resize"
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>

                            <p className="text-center text-xs text-muted-foreground">
                                Crop area: {Math.round(cropRect.width * (source.naturalWidth / source.displayWidth))} x{" "}
                                {Math.round(cropRect.height * (source.naturalWidth / source.displayWidth))} px
                            </p>

                            <Button
                                type="button"
                                className="w-full rounded-full"
                                onClick={handleCrop}
                                disabled={isCropping}
                            >
                                {isCropping ? "Cropping..." : "Crop image"}
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
                                    alt="Cropped result"
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
                                <p className="text-xs">Cropped image will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
