"use client"

import { useEffect, useRef, useState } from "react"

import { sizeCanvasForViewport, type PdfJsLib, type PdfJsViewport } from "@/lib/use-pdfjs"
import type { DetectedField, FieldValue, FormPage } from "@/lib/pdf-form-types"
import { cn } from "@/lib/utils"

type PdfFormFillCanvasProps = {
    pdfjsLib: PdfJsLib
    file: File
    page: FormPage
    fields: DetectedField[]
    values: Record<string, FieldValue>
    onChange: (name: string, value: FieldValue) => void
}

function boxScreenRect(viewport: PdfJsViewport, x: number, y: number, width: number, height: number) {
    const [x1, y1] = viewport.convertToViewportPoint(x, y)
    const [x2, y2] = viewport.convertToViewportPoint(x + width, y + height)
    return {
        left: Math.min(x1, x2),
        top: Math.min(y1, y2),
        width: Math.abs(x2 - x1),
        height: Math.abs(y2 - y1),
    }
}

export function PdfFormFillCanvas({ pdfjsLib, file, page, fields, values, onChange }: PdfFormFillCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const [viewport, setViewport] = useState<PdfJsViewport | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false

        async function render() {
            setError(null)
            setViewport(null)
            try {
                const buffer = await file.arrayBuffer()
                const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
                if (cancelled) return

                const pdfPage = await doc.getPage(page.index + 1)
                if (cancelled) return

                const containerWidth = containerRef.current?.parentElement?.clientWidth ?? 700
                const baseViewport = pdfPage.getViewport({ scale: 1, rotation: pdfPage.rotate })
                const scale = Math.min(1.6, Math.max(0.4, (containerWidth - 32) / baseViewport.width))
                const finalViewport = pdfPage.getViewport({ scale, rotation: pdfPage.rotate })

                const canvas = canvasRef.current
                if (!canvas) return
                const transform = sizeCanvasForViewport(canvas, finalViewport)
                const ctx = canvas.getContext("2d")
                if (!ctx) return

                await pdfPage.render({ canvasContext: ctx, viewport: finalViewport, transform }).promise
                if (cancelled) return

                setViewport(finalViewport)
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : "Could not render this page.")
            }
        }

        render()

        return () => {
            cancelled = true
        }
    }, [pdfjsLib, file, page.index])

    if (error) return <p className="text-sm text-destructive">{error}</p>

    return (
        <div
            ref={containerRef}
            className="relative mx-auto overflow-hidden rounded-xl border border-border/60 bg-muted/20"
            style={{ width: viewport?.width, height: viewport?.height }}
        >
            <canvas ref={canvasRef} className="pointer-events-none block" />

            {viewport && (
                <div className="absolute inset-0">
                    {fields.flatMap((field) =>
                        field.widgets
                            .filter((w) => w.pageIndex === page.index)
                            .map((widget, widgetIndex) => {
                                const rect = boxScreenRect(viewport, widget.rect.x, widget.rect.y, widget.rect.width, widget.rect.height)
                                const key = `${field.name}-${widgetIndex}`
                                const style = { left: rect.left, top: rect.top, width: rect.width, height: rect.height }

                                if (field.kind === "text") {
                                    const value = typeof values[field.name] === "string" ? (values[field.name] as string) : ""
                                    return field.multiline ? (
                                        <textarea
                                            key={key}
                                            value={value}
                                            onChange={(e) => onChange(field.name, e.target.value)}
                                            className="absolute resize-none rounded-[3px] border border-primary/50 bg-primary/5 p-1 text-xs leading-tight text-foreground outline-none focus:border-primary focus:bg-background"
                                            style={style}
                                        />
                                    ) : (
                                        <input
                                            key={key}
                                            type="text"
                                            value={value}
                                            onChange={(e) => onChange(field.name, e.target.value)}
                                            className="absolute rounded-[3px] border border-primary/50 bg-primary/5 px-1 text-xs text-foreground outline-none focus:border-primary focus:bg-background"
                                            style={style}
                                        />
                                    )
                                }

                                if (field.kind === "checkbox") {
                                    const checked = Boolean(values[field.name])
                                    return (
                                        <input
                                            key={key}
                                            type="checkbox"
                                            checked={checked}
                                            onChange={(e) => onChange(field.name, e.target.checked)}
                                            className="absolute cursor-pointer accent-primary"
                                            style={style}
                                        />
                                    )
                                }

                                if (field.kind === "radio") {
                                    const selected = typeof values[field.name] === "string" ? values[field.name] : ""
                                    return (
                                        <input
                                            key={key}
                                            type="radio"
                                            name={field.name}
                                            checked={Boolean(widget.optionValue) && selected === widget.optionValue}
                                            onChange={() => widget.optionValue && onChange(field.name, widget.optionValue)}
                                            className="absolute cursor-pointer accent-primary"
                                            style={style}
                                        />
                                    )
                                }

                                if (field.kind === "dropdown") {
                                    const selected = typeof values[field.name] === "string" ? (values[field.name] as string) : ""
                                    return (
                                        <select
                                            key={key}
                                            value={selected}
                                            onChange={(e) => onChange(field.name, e.target.value)}
                                            className="absolute rounded-[3px] border border-primary/50 bg-primary/5 text-xs text-foreground outline-none focus:border-primary focus:bg-background"
                                            style={style}
                                        >
                                            <option value="" disabled>
                                                Choose...
                                            </option>
                                            {(field.options ?? []).map((opt) => (
                                                <option key={opt} value={opt}>
                                                    {opt}
                                                </option>
                                            ))}
                                        </select>
                                    )
                                }

                                if (field.kind === "optionList") {
                                    const selected = Array.isArray(values[field.name]) ? (values[field.name] as string[]) : []
                                    return (
                                        <select
                                            key={key}
                                            multiple
                                            value={selected}
                                            onChange={(e) =>
                                                onChange(
                                                    field.name,
                                                    Array.from(e.target.selectedOptions).map((o) => o.value)
                                                )
                                            }
                                            className="absolute rounded-[3px] border border-primary/50 bg-primary/5 text-xs text-foreground outline-none focus:border-primary focus:bg-background"
                                            style={style}
                                        >
                                            {(field.options ?? []).map((opt) => (
                                                <option key={opt} value={opt}>
                                                    {opt}
                                                </option>
                                            ))}
                                        </select>
                                    )
                                }

                                return (
                                    <div
                                        key={key}
                                        title="This field type isn't supported for filling here."
                                        className={cn(
                                            "absolute flex items-center justify-center rounded-[3px] border border-dashed border-muted-foreground/40 bg-muted/40 text-[9px] text-muted-foreground"
                                        )}
                                        style={style}
                                    >
                                        Unsupported
                                    </div>
                                )
                            })
                    )}
                </div>
            )}
        </div>
    )
}
