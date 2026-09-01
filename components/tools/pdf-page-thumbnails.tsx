"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Circle, Loader2, RotateCw } from "lucide-react"

import { sizeCanvasForViewport, usePdfJs } from "@/lib/use-pdfjs"
import { cn } from "@/lib/utils"

type PageThumb = { pageIndex: number; url: string }

type PdfPageThumbnailsProps = {
    file: File
    selectedPages?: Set<number>
    onToggle?: (pageIndex: number) => void
    rotations?: Record<number, number>
    onRotate?: (pageIndex: number) => void
    onPageCount?: (count: number) => void
    className?: string
}

export function PdfPageThumbnails({
    file,
    selectedPages,
    onToggle,
    rotations,
    onRotate,
    onPageCount,
    className,
}: PdfPageThumbnailsProps) {
    const { pdfjsLib, error: pdfjsError } = usePdfJs()
    const [thumbs, setThumbs] = useState<PageThumb[]>([])
    const [isRendering, setIsRendering] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!pdfjsLib) return
        let cancelled = false

        async function render() {
            setIsRendering(true)
            setError(null)
            setThumbs([])

            try {
                const buffer = await file.arrayBuffer()
                const doc = await pdfjsLib!.getDocument({ data: new Uint8Array(buffer) }).promise
                if (cancelled) return

                onPageCount?.(doc.numPages)

                for (let i = 1; i <= doc.numPages; i++) {
                    if (cancelled) return
                    const page = await doc.getPage(i)
                    const viewport = page.getViewport({ scale: 1 })
                    const scale = 180 / viewport.width
                    const scaledViewport = page.getViewport({ scale })

                    const canvas = document.createElement("canvas")
                    const transform = sizeCanvasForViewport(canvas, scaledViewport)
                    const ctx = canvas.getContext("2d")
                    if (!ctx) continue

                    await page.render({ canvasContext: ctx, viewport: scaledViewport, transform }).promise
                    if (cancelled) return

                    const url = canvas.toDataURL("image/jpeg", 0.7)
                    setThumbs((prev) => [...prev, { pageIndex: i - 1, url }])
                }
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : "Could not read this PDF.")
            } finally {
                if (!cancelled) setIsRendering(false)
            }
        }

        render()

        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [file, pdfjsLib])

    if (pdfjsError) return <p className="text-sm text-destructive">{pdfjsError}</p>
    if (error) return <p className="text-sm text-destructive">{error}</p>

    return (
        <div className={cn("space-y-3", className)}>
            {isRendering && thumbs.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Reading pages...
                </div>
            )}

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                {thumbs.map((thumb) => {
                    const selected = selectedPages?.has(thumb.pageIndex) ?? false
                    const rotation = rotations?.[thumb.pageIndex] ?? 0

                    return (
                        <div
                            key={thumb.pageIndex}
                            className={cn(
                                "group relative overflow-hidden rounded-xl border bg-muted/30 transition-colors",
                                onToggle ? "cursor-pointer" : "",
                                selected ? "border-primary ring-2 ring-primary/30" : "border-border/60"
                            )}
                            onClick={() => onToggle?.(thumb.pageIndex)}
                        >
                            <div className="flex aspect-[3/4] items-center justify-center overflow-hidden bg-background p-1.5">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={thumb.url}
                                    alt={`Page ${thumb.pageIndex + 1}`}
                                    className="max-h-full max-w-full object-contain transition-transform"
                                    style={{ transform: `rotate(${rotation}deg)` }}
                                />
                            </div>

                            <div className="flex items-center justify-between border-t border-border/60 bg-background/90 px-1.5 py-1">
                                <span className="text-[10px] font-medium text-muted-foreground">
                                    {thumb.pageIndex + 1}
                                </span>
                                <div className="flex items-center gap-1">
                                    {onRotate && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onRotate(thumb.pageIndex)
                                            }}
                                            className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                                        >
                                            <RotateCw className="h-3 w-3" />
                                        </button>
                                    )}
                                    {onToggle &&
                                        (selected ? (
                                            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                                        ) : (
                                            <Circle className="h-3.5 w-3.5 text-muted-foreground/50" />
                                        ))}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
