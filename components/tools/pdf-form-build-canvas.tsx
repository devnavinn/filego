"use client"

import { useEffect, useRef, useState } from "react"
import { Move, X } from "lucide-react"

import { sizeCanvasForViewport, type PdfJsLib, type PdfJsViewport } from "@/lib/use-pdfjs"
import {
    DEFAULT_CHECKBOX_SIZE,
    DEFAULT_FIELD_FONT_SIZE,
    DEFAULT_TEXT_FIELD_HEIGHT,
    DEFAULT_TEXT_FIELD_WIDTH,
    type BuildTool,
    type FormPage,
    type NewFormField,
} from "@/lib/pdf-form-types"
import { cn } from "@/lib/utils"

type PdfFormBuildCanvasProps = {
    pdfjsLib: PdfJsLib
    file: File
    page: FormPage
    fields: NewFormField[]
    tool: BuildTool
    selectedFieldId: string | null
    onSelectField: (id: string | null) => void
    onCreateField: (field: NewFormField) => void
    onUpdateField: (id: string, patch: Partial<NewFormField>) => void
    onDeleteField: (id: string) => void
    onToolConsumed: () => void
}

type Point = [number, number]

type DragState =
    | { mode: "move"; fieldId: string; startScreen: Point; original: NewFormField }
    | { mode: "resize"; fieldId: string; handle: string; anchorScreen: Point }
    | { mode: "create"; anchorScreen: Point; tempId: string; moved: boolean }

const HANDLES = ["nw", "ne", "sw", "se"] as const

function genId() {
    return crypto.randomUUID()
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

export function PdfFormBuildCanvas({
    pdfjsLib,
    file,
    page,
    fields,
    tool,
    selectedFieldId,
    onSelectField,
    onCreateField,
    onUpdateField,
    onDeleteField,
    onToolConsumed,
}: PdfFormBuildCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const overlayRef = useRef<HTMLDivElement | null>(null)
    const [viewport, setViewport] = useState<PdfJsViewport | null>(null)
    const [error, setError] = useState<string | null>(null)
    const dragRef = useRef<DragState | null>(null)

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

                const containerWidth = overlayRef.current?.parentElement?.clientWidth ?? 700
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

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (!selectedFieldId) return
            const active = document.activeElement
            if (active && (active.tagName === "TEXTAREA" || active.tagName === "INPUT")) return

            if (e.key === "Delete" || e.key === "Backspace") {
                e.preventDefault()
                onDeleteField(selectedFieldId)
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [selectedFieldId, onDeleteField])

    function screenPointFromEvent(e: React.PointerEvent): Point {
        const rect = overlayRef.current!.getBoundingClientRect()
        return [e.clientX - rect.left, e.clientY - rect.top]
    }

    function toPdf(point: Point): Point {
        return viewport!.convertToPdfPoint(point[0], point[1])
    }

    function handleBackgroundPointerDown(e: React.PointerEvent) {
        if (!viewport) return
        const screen = screenPointFromEvent(e)

        if (tool === "select") {
            onSelectField(null)
            return
        }

        e.currentTarget.setPointerCapture(e.pointerId)
        const tempId = genId()
        const [x, yTop] = toPdf(screen)

        if (tool === "checkbox") {
            onCreateField({
                id: tempId,
                pageIndex: page.index,
                type: "checkbox",
                name: "",
                x,
                y: yTop - DEFAULT_CHECKBOX_SIZE,
                width: DEFAULT_CHECKBOX_SIZE,
                height: DEFAULT_CHECKBOX_SIZE,
                value: "",
                checked: false,
                fontSize: DEFAULT_FIELD_FONT_SIZE,
                required: false,
            })
        } else {
            onCreateField({
                id: tempId,
                pageIndex: page.index,
                type: "text",
                name: "",
                x,
                y: yTop - DEFAULT_TEXT_FIELD_HEIGHT,
                width: DEFAULT_TEXT_FIELD_WIDTH,
                height: DEFAULT_TEXT_FIELD_HEIGHT,
                value: "",
                checked: false,
                fontSize: DEFAULT_FIELD_FONT_SIZE,
                required: false,
            })
        }

        dragRef.current = { mode: "create", anchorScreen: screen, tempId, moved: false }
        onSelectField(tempId)
    }

    function handleBackgroundPointerMove(e: React.PointerEvent) {
        const drag = dragRef.current
        if (!drag || !viewport || drag.mode !== "create") return
        const screen = screenPointFromEvent(e)
        const dx = Math.abs(screen[0] - drag.anchorScreen[0])
        const dy = Math.abs(screen[1] - drag.anchorScreen[1])
        if (dx < 4 && dy < 4) return

        const [ax, ay] = toPdf(drag.anchorScreen)
        const [cx, cy] = toPdf(screen)
        drag.moved = true

        onUpdateField(drag.tempId, {
            x: Math.min(ax, cx),
            y: Math.min(ay, cy),
            width: Math.max(8, Math.abs(cx - ax)),
            height: Math.max(8, Math.abs(cy - ay)),
        })
    }

    function handleBackgroundPointerUp() {
        dragRef.current = null
        if (tool !== "select") onToolConsumed()
    }

    function startMove(e: React.PointerEvent, field: NewFormField) {
        if (tool !== "select") return
        e.stopPropagation()
        e.preventDefault()
        onSelectField(field.id)
        e.currentTarget.setPointerCapture(e.pointerId)
        dragRef.current = { mode: "move", fieldId: field.id, startScreen: screenPointFromEvent(e), original: field }
    }

    function startResize(e: React.PointerEvent, field: NewFormField, handle: string) {
        e.stopPropagation()
        e.preventDefault()
        if (!viewport) return
        e.currentTarget.setPointerCapture(e.pointerId)

        const opposite: Record<string, [number, number]> = {
            nw: [field.x + field.width, field.y],
            ne: [field.x, field.y],
            sw: [field.x + field.width, field.y + field.height],
            se: [field.x, field.y + field.height],
        }
        const [ox, oy] = opposite[handle]
        const anchorScreen = viewport.convertToViewportPoint(ox, oy)
        dragRef.current = { mode: "resize", fieldId: field.id, handle, anchorScreen }
    }

    function handleFieldPointerMove(e: React.PointerEvent) {
        const drag = dragRef.current
        if (!drag || !viewport) return
        const screen = screenPointFromEvent(e)

        if (drag.mode === "move") {
            const [sx, sy] = toPdf(drag.startScreen)
            const [cx, cy] = toPdf(screen)
            const dx = cx - sx
            const dy = cy - sy
            onUpdateField(drag.fieldId, { x: drag.original.x + dx, y: drag.original.y + dy })
            return
        }

        if (drag.mode === "resize") {
            const [ax, ay] = toPdf(drag.anchorScreen)
            const [cx, cy] = toPdf(screen)
            onUpdateField(drag.fieldId, {
                x: Math.min(ax, cx),
                y: Math.min(ay, cy),
                width: Math.max(8, Math.abs(cx - ax)),
                height: Math.max(8, Math.abs(cy - ay)),
            })
        }
    }

    function handleFieldPointerUp() {
        dragRef.current = null
    }

    if (error) return <p className="text-sm text-destructive">{error}</p>

    return (
        <div
            className="relative mx-auto touch-none select-none overflow-hidden rounded-xl border border-border/60 bg-muted/20"
            style={{ width: viewport?.width, height: viewport?.height }}
        >
            <canvas ref={canvasRef} className="pointer-events-none block" />
            <div
                ref={overlayRef}
                className="absolute inset-0"
                onPointerDown={handleBackgroundPointerDown}
                onPointerMove={handleBackgroundPointerMove}
                onPointerUp={handleBackgroundPointerUp}
                style={{ cursor: tool === "select" ? "default" : "crosshair" }}
            >
                {viewport &&
                    fields
                        .filter((f) => f.pageIndex === page.index)
                        .map((field) => {
                            const isSelected = field.id === selectedFieldId
                            const rect = boxScreenRect(viewport, field.x, field.y, field.width, field.height)

                            return (
                                <div
                                    key={field.id}
                                    className={cn(
                                        "absolute rounded-[3px] border-2 border-dashed",
                                        field.type === "checkbox" ? "border-primary/60 bg-primary/5" : "border-primary/50 bg-primary/5",
                                        isSelected && tool === "select" ? "outline outline-2 outline-primary" : ""
                                    )}
                                    style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
                                    onPointerDown={(e) => startMove(e, field)}
                                    onPointerMove={handleFieldPointerMove}
                                    onPointerUp={handleFieldPointerUp}
                                >
                                    {field.type === "text" && (
                                        <input
                                            type="text"
                                            value={field.value}
                                            placeholder="Type value..."
                                            onChange={(e) => onUpdateField(field.id, { value: e.target.value })}
                                            onPointerDown={(e) => {
                                                if (tool === "select") {
                                                    e.stopPropagation()
                                                    onSelectField(field.id)
                                                }
                                            }}
                                            className="h-full w-full border-0 bg-transparent px-1 leading-tight text-foreground outline-none placeholder:text-muted-foreground/50"
                                            style={{ fontSize: Math.min(14, rect.height * 0.6) }}
                                        />
                                    )}

                                    {field.type === "checkbox" && (
                                        <input
                                            type="checkbox"
                                            checked={field.checked}
                                            onChange={(e) => onUpdateField(field.id, { checked: e.target.checked })}
                                            onPointerDown={(e) => {
                                                if (tool === "select") e.stopPropagation()
                                            }}
                                            className="h-full w-full cursor-pointer accent-primary"
                                        />
                                    )}

                                    {isSelected && tool === "select" && (
                                        <>
                                            <button
                                                type="button"
                                                className="absolute -top-3 -left-3 flex h-5 w-5 items-center justify-center rounded-full border border-primary bg-background text-muted-foreground"
                                                onPointerDown={(e) => e.stopPropagation()}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onDeleteField(field.id)
                                                }}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>

                                            <div
                                                className="absolute -top-3 left-1/2 flex h-5 w-5 -translate-x-1/2 cursor-move items-center justify-center rounded-full border border-primary bg-background text-muted-foreground"
                                                onPointerDown={(e) => startMove(e, field)}
                                                onPointerMove={handleFieldPointerMove}
                                                onPointerUp={handleFieldPointerUp}
                                            >
                                                <Move className="h-3 w-3" />
                                            </div>

                                            {HANDLES.map((handle) => (
                                                <div
                                                    key={handle}
                                                    onPointerDown={(e) => startResize(e, field, handle)}
                                                    onPointerMove={handleFieldPointerMove}
                                                    onPointerUp={handleFieldPointerUp}
                                                    className={cn(
                                                        "absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background",
                                                        handle === "nw" && "top-0 left-0 cursor-nwse-resize",
                                                        handle === "ne" && "top-0 left-full cursor-nesw-resize",
                                                        handle === "sw" && "top-full left-0 cursor-nesw-resize",
                                                        handle === "se" && "top-full left-full cursor-nwse-resize"
                                                    )}
                                                />
                                            ))}
                                        </>
                                    )}
                                </div>
                            )
                        })}
            </div>
        </div>
    )
}
