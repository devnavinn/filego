"use client"

import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import { sizeCanvasForViewport, type PdfJsLib } from "@/lib/use-pdfjs"
import type { FormPage } from "@/lib/pdf-form-types"

type PdfFormPagesPanelProps = {
    pdfjsLib: PdfJsLib
    file: File
    pages: FormPage[]
    activePageIndex: number
    fieldCountByPage?: Record<number, number>
    onSelectPage: (pageIndex: number) => void
}

export function PdfFormPagesPanel({
    pdfjsLib,
    file,
    pages,
    activePageIndex,
    fieldCountByPage,
    onSelectPage,
}: PdfFormPagesPanelProps) {
    const [thumbnails, setThumbnails] = useState<Record<number, string>>({})

    useEffect(() => {
        let cancelled = false

        async function render() {
            const buffer = await file.arrayBuffer()
            const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
            if (cancelled) return

            for (let i = 1; i <= doc.numPages; i++) {
                if (cancelled) return
                const page = await doc.getPage(i)
                const viewport = page.getViewport({ scale: 120 / page.getViewport({ scale: 1 }).width })

                const canvas = document.createElement("canvas")
                const transform = sizeCanvasForViewport(canvas, viewport)
                const ctx = canvas.getContext("2d")
                if (!ctx) continue

                await page.render({ canvasContext: ctx, viewport, transform }).promise
                if (cancelled) return

                const url = canvas.toDataURL("image/jpeg", 0.7)
                setThumbnails((prev) => ({ ...prev, [i - 1]: url }))
            }
        }

        render()

        return () => {
            cancelled = true
        }
    }, [file, pdfjsLib])

    return (
        <div className="flex w-full shrink-0 gap-2 overflow-x-auto pb-1 lg:w-32 lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0">
            {pages.map((page) => {
                const thumbUrl = thumbnails[page.index]
                const isActive = page.index === activePageIndex
                const count = fieldCountByPage?.[page.index] ?? 0

                return (
                    <button
                        key={page.index}
                        type="button"
                        onClick={() => onSelectPage(page.index)}
                        className={cn(
                            "group relative w-20 shrink-0 overflow-hidden rounded-xl border bg-muted/30 text-left transition-colors lg:w-full",
                            isActive ? "border-primary ring-2 ring-primary/30" : "border-border/60"
                        )}
                    >
                        <div className="flex aspect-[3/4] items-center justify-center overflow-hidden bg-background p-1">
                            {thumbUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={thumbUrl}
                                    alt={`Page ${page.index + 1}`}
                                    className="max-h-full max-w-full object-contain"
                                />
                            ) : (
                                <div className="h-full w-full animate-pulse bg-muted" />
                            )}
                        </div>
                        <div className="flex items-center justify-between gap-1 border-t border-border/60 bg-background/90 px-1.5 py-1">
                            <span className="text-[10px] font-medium text-muted-foreground">{page.index + 1}</span>
                            {count > 0 && (
                                <span className="rounded-full bg-primary/10 px-1.5 text-[10px] font-medium text-primary">
                                    {count}
                                </span>
                            )}
                        </div>
                    </button>
                )
            })}
        </div>
    )
}
