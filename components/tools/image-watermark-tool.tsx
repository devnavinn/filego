"use client"

import { useEffect, useRef, useState } from "react"
import { Download, ImageOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { ImageDropzone } from "@/components/tools/image-dropzone"
import { formatBytes } from "@/lib/image-utils"
import { canvasToBlob, downloadBlob, loadImageElement, replaceExtension } from "@/lib/image-tool-utils"

type SourceState = {
    file: File
    img: HTMLImageElement
    width: number
    height: number
}

type Position = "top-left" | "top-right" | "center" | "bottom-left" | "bottom-right"

const POSITIONS: { value: Position; label: string }[] = [
    { value: "top-left", label: "Top left" },
    { value: "top-right", label: "Top right" },
    { value: "center", label: "Center" },
    { value: "bottom-left", label: "Bottom left" },
    { value: "bottom-right", label: "Bottom right" },
]

function resolveOutput(file: File): { mime: string; ext: string } {
    if (file.type === "image/jpeg" || file.type === "image/jpg") return { mime: "image/jpeg", ext: "jpg" }
    if (file.type === "image/webp") return { mime: "image/webp", ext: "webp" }
    return { mime: "image/png", ext: "png" }
}

export function ImageWatermarkTool() {
    const [source, setSource] = useState<SourceState | null>(null)
    const [text, setText] = useState("Filego")
    const [fontSize, setFontSize] = useState(32)
    const [color, setColor] = useState("#ffffff")
    const [opacity, setOpacity] = useState(70)
    const [position, setPosition] = useState<Position>("bottom-right")
    const [error, setError] = useState<string | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    async function handleFileSelect(file: File) {
        setError(null)
        try {
            const loaded = await loadImageElement(file)
            setSource({ file, img: loaded.img, width: loaded.width, height: loaded.height })
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not load that image.")
        }
    }

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || !source) return

        canvas.width = source.width
        canvas.height = source.height
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        ctx.clearRect(0, 0, source.width, source.height)
        ctx.drawImage(source.img, 0, 0, source.width, source.height)

        if (text.trim()) {
            const padding = Math.round(source.width * 0.03)
            ctx.globalAlpha = opacity / 100
            ctx.fillStyle = color
            ctx.font = `600 ${fontSize}px system-ui, sans-serif`

            let x = padding
            let y = padding
            ctx.textBaseline = "top"
            ctx.textAlign = "left"

            if (position === "top-right") {
                ctx.textAlign = "right"
                x = source.width - padding
            } else if (position === "bottom-left") {
                ctx.textBaseline = "bottom"
                y = source.height - padding
            } else if (position === "bottom-right") {
                ctx.textAlign = "right"
                ctx.textBaseline = "bottom"
                x = source.width - padding
                y = source.height - padding
            } else if (position === "center") {
                ctx.textAlign = "center"
                ctx.textBaseline = "middle"
                x = source.width / 2
                y = source.height / 2
            }

            ctx.fillText(text, x, y)
            ctx.globalAlpha = 1
        }
    }, [source, text, fontSize, color, opacity, position])

    async function handleDownload() {
        const canvas = canvasRef.current
        if (!canvas || !source) return

        try {
            const { mime, ext } = resolveOutput(source.file)
            const blob = await canvasToBlob(canvas, mime, mime === "image/png" ? undefined : 0.92)
            downloadBlob(blob, replaceExtension(source.file.name, ext))
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not export this image.")
        }
    }

    function handleClear() {
        setSource(null)
        setError(null)
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Image Watermark</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Add a text watermark to your images with live preview before downloading.
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
                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">Watermark text</p>
                                <Input
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Your watermark text"
                                    className="h-9 rounded-xl"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">Position</p>
                                <div className="flex flex-wrap gap-2">
                                    {POSITIONS.map((p) => (
                                        <Button
                                            key={p.value}
                                            type="button"
                                            variant={position === p.value ? "secondary" : "outline"}
                                            size="sm"
                                            className="rounded-full"
                                            onClick={() => setPosition(p.value)}
                                        >
                                            {p.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">Font size — {fontSize}px</p>
                                <Slider value={[fontSize]} onValueChange={([v]) => setFontSize(v)} min={12} max={96} step={2} />
                            </div>

                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">Opacity — {opacity}%</p>
                                <Slider value={[opacity]} onValueChange={([v]) => setOpacity(v)} min={10} max={100} step={5} />
                            </div>

                            <div className="flex items-center justify-between">
                                <p className="text-xs font-medium text-muted-foreground">Color</p>
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="h-7 w-10 cursor-pointer rounded border border-border/60 bg-transparent"
                                />
                            </div>
                        </div>
                    )}

                    {error && <p className="text-sm text-destructive">{error}</p>}
                </div>

                <div className="space-y-3">
                    <p className="text-sm font-medium">Preview</p>
                    <div className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-2xl border border-border/60 bg-muted/30 p-6">
                        {source ? (
                            <>
                                <canvas ref={canvasRef} className="max-h-56 max-w-full rounded-xl border border-border/60" />
                                <p className="text-xs text-muted-foreground">
                                    {source.width} x {source.height} px · {formatBytes(source.file.size)}
                                </p>
                                <Button type="button" className="w-full rounded-full sm:w-auto" onClick={handleDownload}>
                                    <Download />
                                    Download image
                                </Button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <ImageOff className="h-8 w-8" />
                                <p className="text-xs">Watermarked preview will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
