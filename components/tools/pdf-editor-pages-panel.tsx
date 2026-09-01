"use client"

import { useEffect, useState } from "react"
import { ArrowDown, ArrowUp, RotateCw, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { PdfJsLib } from "@/lib/use-pdfjs"
import type { EditorPage } from "@/lib/pdf-editor-types"

type PdfEditorPagesPanelProps = {
    pdfjsLib: PdfJsLib
    file: File
    pages: EditorPage[]
    activePageId: string
    onSelectPage: (pageId: string) => void
    onRotatePage: (pageId: string) => void
    onDeletePage: (pageId: string) => void
    onMovePage: (pageId: string, direction: -1 | 1) => void
}

export function PdfEditorPagesPanel({
    pdfjsLib,
    file,
    pages,
    activePageId,
    onSelectPage,
    onRotatePage,
    onDeletePage,
    onMovePage,
}: PdfEditorPagesPanelProps) {
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
                canvas.width = viewport.width
                canvas.height = viewport.height
                const ctx = canvas.getContext("2d")
                if (!ctx) continue

                await page.render({ canvasContext: ctx, viewport }).promise
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
        <div className="w-full shrink-0 space-y-2 overflow-y-auto lg:w-40">
            {pages.map((page, index) => {
                const thumbUrl = thumbnails[page.originalIndex]
                const isActive = page.id === activePageId

                return (
                    <div
                        key={page.id}
                        onClick={() => onSelectPage(page.id)}
                        className={cn(
                            "group cursor-pointer overflow-hidden rounded-xl border bg-muted/30 transition-colors",
                            isActive ? "border-primary ring-2 ring-primary/30" : "border-border/60"
                        )}
                    >
                        <div className="flex aspect-[3/4] items-center justify-center overflow-hidden bg-background p-1">
                            {thumbUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={thumbUrl}
                                    alt={`Page ${index + 1}`}
                                    className="max-h-full max-w-full object-contain"
                                    style={{ transform: `rotate(${page.rotationDelta}deg)` }}
                                />
                            ) : (
                                <div className="h-full w-full animate-pulse bg-muted" />
                            )}
                        </div>

                        <div className="flex items-center justify-between gap-1 border-t border-border/60 bg-background/90 px-1 py-1">
                            <span className="text-[10px] font-medium text-muted-foreground">{index + 1}</span>
                            <div className="flex items-center gap-0.5">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-xs"
                                    className="rounded-full"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onMovePage(page.id, -1)
                                    }}
                                    disabled={index === 0}
                                >
                                    <ArrowUp />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-xs"
                                    className="rounded-full"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onMovePage(page.id, 1)
                                    }}
                                    disabled={index === pages.length - 1}
                                >
                                    <ArrowDown />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-xs"
                                    className="rounded-full"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onRotatePage(page.id)
                                    }}
                                >
                                    <RotateCw />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-xs"
                                    className="rounded-full"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onDeletePage(page.id)
                                    }}
                                    disabled={pages.length <= 1}
                                >
                                    <Trash2 />
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
