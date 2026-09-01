"use client"

import { useEffect, useRef, useState } from "react"
import { Move, X } from "lucide-react"

import type { PdfJsLib, PdfJsViewport } from "@/lib/use-pdfjs"
import type { EditorElement, EditorPage, EditorTool } from "@/lib/pdf-editor-types"
import { DEFAULT_FONT_SIZE, DEFAULT_SHAPE_COLOR, DEFAULT_STROKE_WIDTH, DEFAULT_TEXT_COLOR } from "@/lib/pdf-editor-types"
import { cn } from "@/lib/utils"

type PendingImage = { dataUrl: string; mimeType: "image/png" | "image/jpeg"; width: number; height: number }

type PdfEditorCanvasProps = {
    pdfjsLib: PdfJsLib
    file: File
    page: EditorPage
    elements: EditorElement[]
    tool: EditorTool
    pendingImage: PendingImage | null
    selectedElementId: string | null
    onSelectElement: (id: string | null) => void
    onCreateElement: (element: EditorElement) => void
    onUpdateElement: (id: string, patch: Partial<EditorElement>) => void
    onDeleteElement: (id: string) => void
    onToolConsumed: () => void
}

type Point = [number, number]

/** A detected existing text run, in the same native bottom-left-origin box convention as EditorElement. */
type TextRun = { str: string; x: number; y: number; width: number; height: number; fontSize: number }

type DragState =
    | { mode: "move"; elementId: string; startScreen: Point; original: EditorElement }
    | { mode: "resize"; elementId: string; handle: string; anchorScreen: Point }
    | { mode: "line-endpoint"; elementId: string; endpoint: 1 | 2 }
    | { mode: "create-box"; tool: EditorTool; anchorScreen: Point; tempId: string }
    | { mode: "draw"; tempId: string }

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

export function PdfEditorCanvas({
    pdfjsLib,
    file,
    page,
    elements,
    tool,
    pendingImage,
    selectedElementId,
    onSelectElement,
    onCreateElement,
    onUpdateElement,
    onDeleteElement,
    onToolConsumed,
}: PdfEditorCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const overlayRef = useRef<HTMLDivElement | null>(null)
    const [viewport, setViewport] = useState<PdfJsViewport | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [textRuns, setTextRuns] = useState<TextRun[]>([])
    const dragRef = useRef<DragState | null>(null)

    useEffect(() => {
        let cancelled = false

        async function render() {
            setError(null)
            try {
                const buffer = await file.arrayBuffer()
                const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
                if (cancelled) return

                const pdfPage = await doc.getPage(page.originalIndex + 1)
                if (cancelled) return

                const totalRotation = (pdfPage.rotate + page.rotationDelta) % 360
                const containerWidth = overlayRef.current?.parentElement?.clientWidth ?? 700
                const baseViewport = pdfPage.getViewport({ scale: 1, rotation: totalRotation })
                const scale = Math.min(1.6, Math.max(0.4, (containerWidth - 32) / baseViewport.width))
                const finalViewport = pdfPage.getViewport({ scale, rotation: totalRotation })

                const canvas = canvasRef.current
                if (!canvas) return
                canvas.width = finalViewport.width
                canvas.height = finalViewport.height
                const ctx = canvas.getContext("2d")
                if (!ctx) return

                await pdfPage.render({ canvasContext: ctx, viewport: finalViewport }).promise
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
    }, [pdfjsLib, file, page.originalIndex, page.rotationDelta])

    useEffect(() => {
        let cancelled = false

        async function loadTextRuns() {
            try {
                const buffer = await file.arrayBuffer()
                const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
                if (cancelled) return

                const pdfPage = await doc.getPage(page.originalIndex + 1)
                if (cancelled) return

                const { items } = await pdfPage.getTextContent()
                if (cancelled) return

                const runs: TextRun[] = items
                    .filter((item) => item.str.trim().length > 0)
                    .map((item) => {
                        const fontSize = Math.hypot(item.transform[0], item.transform[1]) || item.height || 12
                        const height = item.height || fontSize
                        return {
                            str: item.str,
                            x: item.transform[4],
                            y: item.transform[5],
                            width: item.width,
                            height,
                            fontSize,
                        }
                    })

                setTextRuns(runs)
            } catch {
                if (!cancelled) setTextRuns([])
            }
        }

        loadTextRuns()

        return () => {
            cancelled = true
        }
    }, [pdfjsLib, file, page.originalIndex])

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (!selectedElementId) return
            const active = document.activeElement
            if (active && (active.tagName === "TEXTAREA" || active.tagName === "INPUT")) return

            if (e.key === "Delete" || e.key === "Backspace") {
                e.preventDefault()
                onDeleteElement(selectedElementId)
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [selectedElementId, onDeleteElement])

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
            onSelectElement(null)
            return
        }

        if (tool === "edit-text") {
            const [px, py] = toPdf(screen)
            const hit = textRuns.find(
                (run) => px >= run.x && px <= run.x + run.width && py >= run.y && py <= run.y + run.height
            )
            if (!hit) return

            const padding = hit.height * 0.15
            const boxX = hit.x - padding
            const boxY = hit.y - padding
            const boxWidth = hit.width + padding * 2
            const boxHeight = hit.height + padding * 2

            const whiteoutId = genId()
            onCreateElement({
                id: whiteoutId,
                pageId: page.id,
                type: "whiteout",
                x: boxX,
                y: boxY,
                width: boxWidth,
                height: boxHeight,
                color: "#ffffff",
                strokeWidth: 0,
                filled: true,
            })

            const textId = genId()
            onCreateElement({
                id: textId,
                pageId: page.id,
                type: "text",
                x: boxX,
                y: boxY,
                width: boxWidth,
                height: boxHeight,
                content: hit.str,
                fontSize: Math.max(8, Math.round(hit.fontSize)),
                color: DEFAULT_TEXT_COLOR,
                bold: false,
            })

            onSelectElement(textId)
            onToolConsumed()
            return
        }

        if (tool === "text") {
            // element.y is the BOTTOM edge in native PDF space; the click point should
            // land at the visual top-left, so the box extends downward from the click.
            const [x, yTop] = toPdf(screen)
            const height = DEFAULT_FONT_SIZE * 1.6
            const id = genId()
            onCreateElement({
                id,
                pageId: page.id,
                type: "text",
                x,
                y: yTop - height,
                width: 200,
                height,
                content: "",
                fontSize: DEFAULT_FONT_SIZE,
                color: DEFAULT_TEXT_COLOR,
                bold: false,
            })
            onSelectElement(id)
            onToolConsumed()
            return
        }

        if (tool === "image" && pendingImage) {
            const [x, yTop] = toPdf(screen)
            const maxW = 220
            const ratio = pendingImage.height / pendingImage.width
            const width = Math.min(maxW, pendingImage.width)
            const height = width * ratio
            const id = genId()
            onCreateElement({
                id,
                pageId: page.id,
                type: "image",
                x,
                y: yTop - height,
                width,
                height,
                dataUrl: pendingImage.dataUrl,
                mimeType: pendingImage.mimeType,
            })
            onSelectElement(id)
            onToolConsumed()
            return
        }

        if (tool === "rect" || tool === "ellipse" || tool === "whiteout" || tool === "line") {
            e.currentTarget.setPointerCapture(e.pointerId)
            const tempId = genId()
            dragRef.current = { mode: "create-box", tool, anchorScreen: screen, tempId }

            if (tool === "line") {
                const [x, y] = toPdf(screen)
                onCreateElement({ id: tempId, pageId: page.id, type: "line", x1: x, y1: y, x2: x, y2: y, color: DEFAULT_SHAPE_COLOR, strokeWidth: DEFAULT_STROKE_WIDTH })
            } else {
                const [x, y] = toPdf(screen)
                onCreateElement({
                    id: tempId,
                    pageId: page.id,
                    type: tool,
                    x,
                    y,
                    width: 1,
                    height: 1,
                    color: tool === "whiteout" ? "#ffffff" : DEFAULT_SHAPE_COLOR,
                    strokeWidth: DEFAULT_STROKE_WIDTH,
                    filled: tool === "whiteout",
                })
            }
            onSelectElement(tempId)
            return
        }

        if (tool === "draw") {
            e.currentTarget.setPointerCapture(e.pointerId)
            const tempId = genId()
            const [x, y] = toPdf(screen)
            dragRef.current = { mode: "draw", tempId }
            onCreateElement({ id: tempId, pageId: page.id, type: "draw", points: [{ x, y }], color: DEFAULT_SHAPE_COLOR, strokeWidth: DEFAULT_STROKE_WIDTH })
            onSelectElement(tempId)
        }
    }

    function handleBackgroundPointerMove(e: React.PointerEvent) {
        const drag = dragRef.current
        if (!drag || !viewport) return
        const screen = screenPointFromEvent(e)

        if (drag.mode === "create-box") {
            const [ax, ay] = toPdf(drag.anchorScreen)
            const [cx, cy] = toPdf(screen)

            if (drag.tool === "line") {
                onUpdateElement(drag.tempId, { x2: cx, y2: cy } as Partial<EditorElement>)
            } else {
                onUpdateElement(drag.tempId, {
                    x: Math.min(ax, cx),
                    y: Math.min(ay, cy),
                    width: Math.max(4, Math.abs(cx - ax)),
                    height: Math.max(4, Math.abs(cy - ay)),
                } as Partial<EditorElement>)
            }
            return
        }

        if (drag.mode === "draw") {
            const [x, y] = toPdf(screen)
            const current = elements.find((el) => el.id === drag.tempId)
            if (current?.type === "draw") {
                onUpdateElement(drag.tempId, { points: [...current.points, { x, y }] } as Partial<EditorElement>)
            }
        }
    }

    function handleBackgroundPointerUp() {
        dragRef.current = null
        if (tool !== "select") onToolConsumed()
    }

    function startMove(e: React.PointerEvent, element: EditorElement) {
        if (tool !== "select") return
        e.stopPropagation()
        e.preventDefault()
        onSelectElement(element.id)
        e.currentTarget.setPointerCapture(e.pointerId)
        dragRef.current = { mode: "move", elementId: element.id, startScreen: screenPointFromEvent(e), original: element }
    }

    function startResize(e: React.PointerEvent, element: EditorElement, handle: string) {
        e.stopPropagation()
        e.preventDefault()
        if (!viewport || !("x" in element)) return
        e.currentTarget.setPointerCapture(e.pointerId)

        // element.(x,y) is the native bottom-left corner, which at rotation 0 is the
        // on-screen "sw" corner — so the screen-space handle names below map to the
        // opposite native corner accordingly (not a simple top/bottom mirror of the name).
        const opposite: Record<string, [number, number]> = {
            nw: [element.x + element.width, element.y],
            ne: [element.x, element.y],
            sw: [element.x + element.width, element.y + element.height],
            se: [element.x, element.y + element.height],
        }
        const [ox, oy] = opposite[handle]
        const anchorScreen = viewport.convertToViewportPoint(ox, oy)
        dragRef.current = { mode: "resize", elementId: element.id, handle, anchorScreen }
    }

    function startLineEndpoint(e: React.PointerEvent, element: EditorElement, endpoint: 1 | 2) {
        e.stopPropagation()
        e.preventDefault()
        onSelectElement(element.id)
        e.currentTarget.setPointerCapture(e.pointerId)
        dragRef.current = { mode: "line-endpoint", elementId: element.id, endpoint }
    }

    function handleElementPointerMove(e: React.PointerEvent) {
        const drag = dragRef.current
        if (!drag || !viewport) return
        const screen = screenPointFromEvent(e)

        if (drag.mode === "move") {
            const [sx, sy] = toPdf(drag.startScreen)
            const [cx, cy] = toPdf(screen)
            const dx = cx - sx
            const dy = cy - sy
            const original = drag.original

            if (original.type === "line") {
                onUpdateElement(drag.elementId, {
                    x1: original.x1 + dx,
                    y1: original.y1 + dy,
                    x2: original.x2 + dx,
                    y2: original.y2 + dy,
                } as Partial<EditorElement>)
            } else if (original.type === "draw") {
                onUpdateElement(drag.elementId, {
                    points: original.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
                } as Partial<EditorElement>)
            } else {
                onUpdateElement(drag.elementId, { x: original.x + dx, y: original.y + dy } as Partial<EditorElement>)
            }
            return
        }

        if (drag.mode === "resize") {
            const [ax, ay] = toPdf(drag.anchorScreen)
            const [cx, cy] = toPdf(screen)
            onUpdateElement(drag.elementId, {
                x: Math.min(ax, cx),
                y: Math.min(ay, cy),
                width: Math.max(8, Math.abs(cx - ax)),
                height: Math.max(8, Math.abs(cy - ay)),
            } as Partial<EditorElement>)
            return
        }

        if (drag.mode === "line-endpoint") {
            const [x, y] = toPdf(screen)
            onUpdateElement(drag.elementId, drag.endpoint === 1 ? ({ x1: x, y1: y } as Partial<EditorElement>) : ({ x2: x, y2: y } as Partial<EditorElement>))
        }
    }

    function handleElementPointerUp() {
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
                {viewport && tool === "edit-text" &&
                    textRuns.map((run, i) => {
                        const rect = boxScreenRect(viewport, run.x, run.y, run.width, run.height)
                        return (
                            <div
                                key={i}
                                className="pointer-events-none absolute rounded-sm bg-primary/10 outline outline-1 outline-primary/30"
                                style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
                            />
                        )
                    })}

                {viewport &&
                    elements.map((element) => {
                        const isSelected = element.id === selectedElementId

                        if (element.type === "line") {
                            const [x1, y1] = viewport.convertToViewportPoint(element.x1, element.y1)
                            const [x2, y2] = viewport.convertToViewportPoint(element.x2, element.y2)
                            return (
                                <svg key={element.id} className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
                                    <line
                                        x1={x1} y1={y1} x2={x2} y2={y2}
                                        stroke={element.color}
                                        strokeWidth={element.strokeWidth}
                                        className="pointer-events-auto cursor-move"
                                        onPointerDown={(e) => startMove(e as unknown as React.PointerEvent, element)}
                                        onPointerMove={handleElementPointerMove}
                                        onPointerUp={handleElementPointerUp}
                                    />
                                    {isSelected && tool === "select" && (
                                        <>
                                            <circle cx={x1} cy={y1} r={6} fill="var(--color-background)" stroke="var(--color-primary)" strokeWidth={2}
                                                className="pointer-events-auto cursor-pointer"
                                                onPointerDown={(e) => startLineEndpoint(e as unknown as React.PointerEvent, element, 1)}
                                                onPointerMove={handleElementPointerMove}
                                                onPointerUp={handleElementPointerUp}
                                            />
                                            <circle cx={x2} cy={y2} r={6} fill="var(--color-background)" stroke="var(--color-primary)" strokeWidth={2}
                                                className="pointer-events-auto cursor-pointer"
                                                onPointerDown={(e) => startLineEndpoint(e as unknown as React.PointerEvent, element, 2)}
                                                onPointerMove={handleElementPointerMove}
                                                onPointerUp={handleElementPointerUp}
                                            />
                                        </>
                                    )}
                                </svg>
                            )
                        }

                        if (element.type === "draw") {
                            const screenPoints = element.points.map((p) => viewport.convertToViewportPoint(p.x, p.y))
                            const pointsAttr = screenPoints.map(([x, y]) => `${x},${y}`).join(" ")
                            return (
                                <svg key={element.id} className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
                                    <polyline
                                        points={pointsAttr}
                                        fill="none"
                                        stroke={element.color}
                                        strokeWidth={element.strokeWidth}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className={cn("pointer-events-auto", tool === "select" && "cursor-move")}
                                        onPointerDown={(e) => startMove(e as unknown as React.PointerEvent, element)}
                                        onPointerMove={handleElementPointerMove}
                                        onPointerUp={handleElementPointerUp}
                                    />
                                </svg>
                            )
                        }

                        const rect = boxScreenRect(viewport, element.x, element.y, element.width, element.height)

                        return (
                            <div
                                key={element.id}
                                className={cn(
                                    "absolute",
                                    isSelected && tool === "select" ? "outline outline-2 outline-primary" : ""
                                )}
                                style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
                                onPointerDown={(e) => startMove(e, element)}
                                onPointerMove={handleElementPointerMove}
                                onPointerUp={handleElementPointerUp}
                            >
                                {element.type === "text" && (
                                    <textarea
                                        value={element.content}
                                        onChange={(e) => onUpdateElement(element.id, { content: e.target.value } as Partial<EditorElement>)}
                                        onPointerDown={(e) => {
                                            if (tool === "select") {
                                                e.stopPropagation()
                                                onSelectElement(element.id)
                                            }
                                        }}
                                        placeholder="Type here"
                                        className="h-full w-full resize-none border-0 bg-transparent p-0.5 leading-tight outline-none placeholder:text-muted-foreground/50"
                                        style={{
                                            fontSize: rect.height && element.height ? (rect.width / element.width) * element.fontSize : element.fontSize,
                                            color: element.color,
                                            fontWeight: element.bold ? 700 : 400,
                                        }}
                                    />
                                )}

                                {element.type === "image" && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={element.dataUrl} alt="" className="pointer-events-none h-full w-full object-contain" draggable={false} />
                                )}

                                {element.type === "rect" && (
                                    <div
                                        className="pointer-events-none h-full w-full"
                                        style={
                                            element.filled
                                                ? { backgroundColor: element.color }
                                                : { border: `${element.strokeWidth}px solid ${element.color}` }
                                        }
                                    />
                                )}

                                {element.type === "whiteout" && <div className="pointer-events-none h-full w-full bg-white" />}

                                {element.type === "ellipse" && (
                                    <div
                                        className="pointer-events-none h-full w-full rounded-full"
                                        style={
                                            element.filled
                                                ? { backgroundColor: element.color }
                                                : { border: `${element.strokeWidth}px solid ${element.color}` }
                                        }
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
                                                onDeleteElement(element.id)
                                            }}
                                        >
                                            <X className="h-3 w-3" />
                                        </button>

                                        <div
                                            className="absolute -top-3 left-1/2 flex h-5 w-5 -translate-x-1/2 cursor-move items-center justify-center rounded-full border border-primary bg-background text-muted-foreground"
                                            onPointerDown={(e) => startMove(e, element)}
                                            onPointerMove={handleElementPointerMove}
                                            onPointerUp={handleElementPointerUp}
                                        >
                                            <Move className="h-3 w-3" />
                                        </div>

                                        {HANDLES.map((handle) => (
                                            <div
                                                key={handle}
                                                onPointerDown={(e) => startResize(e, element, handle)}
                                                onPointerMove={handleElementPointerMove}
                                                onPointerUp={handleElementPointerUp}
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
