"use client"

import { useRef, useState } from "react"
import {
    Bold,
    Circle,
    Download,
    Eraser,
    ImagePlus,
    Loader2,
    MinusSquare,
    MousePointer2,
    Pencil,
    PenLine,
    RectangleHorizontal,
    Type,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { PdfDropzone } from "@/components/tools/pdf-dropzone"
import { PdfEditorPagesPanel } from "@/components/tools/pdf-editor-pages-panel"
import { PdfEditorCanvas } from "@/components/tools/pdf-editor-canvas"
import { usePdfJs } from "@/lib/use-pdfjs"
import { downloadBlob, pdfBytesToBlob, replaceExtension } from "@/lib/pdf-tool-utils"
import { exportEditedPdf } from "@/lib/pdf-editor-export"
import type { EditorElement, EditorPage, EditorTool } from "@/lib/pdf-editor-types"
import { cn } from "@/lib/utils"

type PendingImage = { dataUrl: string; mimeType: "image/png" | "image/jpeg"; width: number; height: number }

const TOOLS: { value: EditorTool; label: string; icon: typeof MousePointer2 }[] = [
    { value: "select", label: "Select", icon: MousePointer2 },
    { value: "text", label: "Text", icon: Type },
    { value: "edit-text", label: "Edit text", icon: PenLine },
    { value: "image", label: "Image", icon: ImagePlus },
    { value: "rect", label: "Rectangle", icon: RectangleHorizontal },
    { value: "ellipse", label: "Ellipse", icon: Circle },
    { value: "line", label: "Line", icon: MinusSquare },
    { value: "draw", label: "Draw", icon: Pencil },
    { value: "whiteout", label: "Whiteout", icon: Eraser },
]

function readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error("Could not read this image."))
        reader.readAsDataURL(file)
    })
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error("Could not read this image."))
        img.src = src
    })
}

async function toPendingImage(file: File): Promise<PendingImage> {
    const dataUrl = await readAsDataUrl(file)
    const img = await loadImageElement(dataUrl)

    if (file.type === "image/png" || file.type === "image/jpeg") {
        return { dataUrl, mimeType: file.type, width: img.naturalWidth, height: img.naturalHeight }
    }

    const canvas = document.createElement("canvas")
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas is not supported in this browser.")
    ctx.drawImage(img, 0, 0)

    return { dataUrl: canvas.toDataURL("image/png"), mimeType: "image/png", width: img.naturalWidth, height: img.naturalHeight }
}

export function PdfEditorTool() {
    const { pdfjsLib, error: engineError } = usePdfJs()
    const [file, setFile] = useState<File | null>(null)
    const [pages, setPages] = useState<EditorPage[]>([])
    const [elements, setElements] = useState<EditorElement[]>([])
    const [activePageId, setActivePageId] = useState<string | null>(null)
    const [tool, setTool] = useState<EditorTool>("select")
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
    const [pendingImage, setPendingImage] = useState<PendingImage | null>(null)
    const [isLoadingFile, setIsLoadingFile] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const imageInputRef = useRef<HTMLInputElement | null>(null)

    const activePage = pages.find((p) => p.id === activePageId) ?? null
    const pageElements = elements.filter((el) => el.pageId === activePageId)
    const selectedElement = elements.find((el) => el.id === selectedElementId) ?? null

    async function handleFileSelect(next: File) {
        if (!pdfjsLib) {
            setError("The PDF engine is still loading. Try again in a moment.")
            return
        }

        setIsLoadingFile(true)
        setError(null)

        try {
            const buffer = await next.arrayBuffer()
            const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
            const nextPages: EditorPage[] = []

            for (let i = 1; i <= doc.numPages; i++) {
                const pdfPage = await doc.getPage(i)
                const viewport = pdfPage.getViewport({ scale: 1, rotation: 0 })
                nextPages.push({
                    id: crypto.randomUUID(),
                    originalIndex: i - 1,
                    width: viewport.width,
                    height: viewport.height,
                    rotationDelta: 0,
                })
            }

            setFile(next)
            setPages(nextPages)
            setElements([])
            setActivePageId(nextPages[0]?.id ?? null)
            setSelectedElementId(null)
            setTool("select")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not read this PDF.")
        } finally {
            setIsLoadingFile(false)
        }
    }

    function handleClear() {
        setFile(null)
        setPages([])
        setElements([])
        setActivePageId(null)
        setSelectedElementId(null)
        setPendingImage(null)
        setTool("select")
        setError(null)
    }

    function handleToolSelect(next: EditorTool) {
        setSelectedElementId(null)
        if (next === "image") {
            imageInputRef.current?.click()
            return
        }
        setPendingImage(null)
        setTool(next)
    }

    async function handleImageFileChosen(imageFile: File) {
        try {
            const pending = await toPendingImage(imageFile)
            setPendingImage(pending)
            setTool("image")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not read this image.")
        }
    }

    function updateElement(id: string, patch: Partial<EditorElement>) {
        setElements((prev) => prev.map((el) => (el.id === id ? ({ ...el, ...patch } as EditorElement) : el)))
    }

    function createElement(element: EditorElement) {
        setElements((prev) => [...prev, element])
    }

    function deleteElement(id: string) {
        setElements((prev) => prev.filter((el) => el.id !== id))
        setSelectedElementId((current) => (current === id ? null : current))
    }

    function handleToolConsumed() {
        setTool("select")
        setPendingImage(null)
    }

    function handleRotatePage(pageId: string) {
        setPages((prev) =>
            prev.map((p) => (p.id === pageId ? { ...p, rotationDelta: (p.rotationDelta + 90) % 360 } : p))
        )
    }

    function handleDeletePage(pageId: string) {
        setPages((prev) => {
            const next = prev.filter((p) => p.id !== pageId)
            if (activePageId === pageId) setActivePageId(next[0]?.id ?? null)
            return next
        })
        setElements((prev) => prev.filter((el) => el.pageId !== pageId))
    }

    function handleMovePage(pageId: string, direction: -1 | 1) {
        setPages((prev) => {
            const index = prev.findIndex((p) => p.id === pageId)
            const target = index + direction
            if (target < 0 || target >= prev.length) return prev
            const next = [...prev]
            ;[next[index], next[target]] = [next[target], next[index]]
            return next
        })
    }

    async function handleExport() {
        if (!file) return
        setIsExporting(true)
        setError(null)

        try {
            const buffer = await file.arrayBuffer()
            const bytes = await exportEditedPdf(buffer, pages, elements)
            downloadBlob(pdfBytesToBlob(bytes), replaceExtension(file.name, "edited.pdf"))
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not export this PDF.")
        } finally {
            setIsExporting(false)
        }
    }

    if (!file) {
        return (
            <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
                <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Edit PDF</h2>
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                    Edit existing text, add new text, images, shapes, and drawings to any PDF, then manage pages
                    and export.
                </p>
                <div className="mt-6">
                    <PdfDropzone onFileSelect={handleFileSelect} />
                </div>
                {isLoadingFile && <p className="mt-3 text-sm text-muted-foreground">Reading PDF...</p>}
                {(error || engineError) && <p className="mt-3 text-sm text-destructive">{error || engineError}</p>}
            </div>
        )
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                <div className="flex flex-wrap items-center gap-1">
                    {TOOLS.map((t) => (
                        <Button
                            key={t.value}
                            type="button"
                            variant={tool === t.value ? "secondary" : "ghost"}
                            size="sm"
                            className="rounded-full"
                            onClick={() => handleToolSelect(t.value)}
                            title={t.label}
                        >
                            <t.icon />
                            <span className="hidden sm:inline">{t.label}</span>
                        </Button>
                    ))}
                    <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const chosen = e.target.files?.[0]
                            if (chosen) handleImageFileChosen(chosen)
                            e.target.value = ""
                        }}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={handleClear}>
                        Start over
                    </Button>
                    <Button type="button" size="sm" className="rounded-full" onClick={handleExport} disabled={isExporting}>
                        {isExporting ? <Loader2 className="animate-spin" /> : <Download />}
                        {isExporting ? "Exporting..." : "Download PDF"}
                    </Button>
                </div>
            </div>

            {selectedElement && (
                <div className="flex flex-wrap items-center gap-3 border-b border-border/60 py-2">
                    {selectedElement.type === "text" && (
                        <>
                            <input
                                type="color"
                                value={selectedElement.color}
                                onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                                className="h-7 w-9 cursor-pointer rounded border border-border/60 bg-transparent"
                            />
                            <div className="flex items-center gap-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon-sm"
                                    className="rounded-full"
                                    onClick={() =>
                                        updateElement(selectedElement.id, {
                                            fontSize: Math.max(8, selectedElement.fontSize - 2),
                                        })
                                    }
                                >
                                    -
                                </Button>
                                <span className="w-8 text-center text-xs">{selectedElement.fontSize}</span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon-sm"
                                    className="rounded-full"
                                    onClick={() =>
                                        updateElement(selectedElement.id, {
                                            fontSize: Math.min(120, selectedElement.fontSize + 2),
                                        })
                                    }
                                >
                                    +
                                </Button>
                            </div>
                            <Button
                                type="button"
                                variant={selectedElement.bold ? "secondary" : "outline"}
                                size="icon-sm"
                                className="rounded-full"
                                onClick={() => updateElement(selectedElement.id, { bold: !selectedElement.bold })}
                            >
                                <Bold />
                            </Button>
                        </>
                    )}

                    {(selectedElement.type === "rect" || selectedElement.type === "ellipse") && (
                        <>
                            <input
                                type="color"
                                value={selectedElement.color}
                                onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                                className="h-7 w-9 cursor-pointer rounded border border-border/60 bg-transparent"
                            />
                            <Button
                                type="button"
                                variant={selectedElement.filled ? "secondary" : "outline"}
                                size="sm"
                                className="rounded-full"
                                onClick={() => updateElement(selectedElement.id, { filled: !selectedElement.filled })}
                            >
                                Filled
                            </Button>
                        </>
                    )}

                    {(selectedElement.type === "line" || selectedElement.type === "draw") && (
                        <input
                            type="color"
                            value={selectedElement.color}
                            onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                            className="h-7 w-9 cursor-pointer rounded border border-border/60 bg-transparent"
                        />
                    )}

                    <span className="text-xs text-muted-foreground">Press Delete to remove</span>
                </div>
            )}

            <div className="mt-3 flex flex-col gap-3 lg:flex-row">
                {pdfjsLib && (
                    <PdfEditorPagesPanel
                        pdfjsLib={pdfjsLib}
                        file={file}
                        pages={pages}
                        activePageId={activePageId ?? ""}
                        onSelectPage={(id) => {
                            setActivePageId(id)
                            setSelectedElementId(null)
                        }}
                        onRotatePage={handleRotatePage}
                        onDeletePage={handleDeletePage}
                        onMovePage={handleMovePage}
                    />
                )}

                <div className={cn("min-w-0 flex-1 overflow-x-auto py-2")}>
                    {pdfjsLib && activePage ? (
                        <PdfEditorCanvas
                            pdfjsLib={pdfjsLib}
                            file={file}
                            page={activePage}
                            elements={pageElements}
                            tool={tool}
                            pendingImage={pendingImage}
                            selectedElementId={selectedElementId}
                            onSelectElement={setSelectedElementId}
                            onCreateElement={createElement}
                            onUpdateElement={updateElement}
                            onDeleteElement={deleteElement}
                            onToolConsumed={handleToolConsumed}
                        />
                    ) : (
                        <p className="p-6 text-sm text-muted-foreground">Loading editor...</p>
                    )}
                </div>
            </div>

            {(error || engineError) && <p className="mt-2 text-sm text-destructive">{error || engineError}</p>}

            <p className="mt-2 text-xs text-muted-foreground">
                {tool === "select" &&
                    "Click an element to select, drag to move, corner handles to resize."}
                {tool === "edit-text" &&
                    "Click any highlighted text to cover it and replace it with an editable copy."}
                {tool !== "select" && tool !== "edit-text" &&
                    `Click${["rect", "ellipse", "line", "whiteout"].includes(tool) ? " and drag" : ""} on the page to place a ${tool === "whiteout" ? "whiteout box" : tool}.`}
            </p>
        </div>
    )
}
