"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Brush, Crown, Download, Eraser, Loader2, RefreshCw, SplitSquareHorizontal, Undo2, Wand2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ImageDropzone } from "@/components/tools/image-dropzone"
import { ToolSegmentedControl } from "@/components/tools/tool-segmented-control"
import { usePlan } from "@/hooks/use-plan"
import { fileToBase64 } from "@/lib/file-to-base64"
import { downloadBlob } from "@/lib/pdf-tool-utils"
import {
    PHOTO_EDIT_MAX_BASE64,
    PHOTO_EDIT_MAX_EDGE,
    PHOTO_EDIT_MAX_PROMPT,
    PHOTO_EDIT_PRESETS,
    type PhotoEditQuality,
} from "@/lib/photo-edit"
import { cn } from "@/lib/utils"

type Status =
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "editing" }
    | { kind: "error"; message: string }
    | { kind: "auth-required" }
    | { kind: "quota-exceeded"; message: string }

/** One step in the edit history. Version 0 is the uploaded photo. */
type Version = { url: string; blob: Blob; width: number; height: number; label: string }

/** A brush stroke in the photo's own pixel coordinates, so it survives resizing the view. */
type Stroke = { radius: number; points: { x: number; y: number }[] }

const TOOL_PATH = "/tools/ai-tools/ai-photo-editor"
const MARK_COLOR = "rgba(255, 0, 255, 0.55)"

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error("decode"))
        img.src = src
    })
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) =>
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("encode"))), "image/jpeg", quality)
    )
}

/** Draws an image (optionally with brush marks) at up to `maxEdge` px and encodes JPEG under the upload cap. */
async function encodeForUpload(source: HTMLImageElement, strokes: Stroke[] | null, maxEdge = PHOTO_EDIT_MAX_EDGE) {
    const scale = Math.min(1, maxEdge / Math.max(source.naturalWidth, source.naturalHeight))
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(source.naturalWidth * scale)
    canvas.height = Math.round(source.naturalHeight * scale)
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Your browser couldn't process this image.")
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
    if (strokes) drawStrokes(ctx, strokes, scale, "rgb(255, 0, 255)")

    for (const quality of [0.9, 0.8, 0.7, 0.6]) {
        const blob = await canvasToBlob(canvas, quality)
        const base64 = await fileToBase64(blob)
        if (base64.length <= PHOTO_EDIT_MAX_BASE64) return { blob, base64, width: canvas.width, height: canvas.height }
    }
    throw new Error("This photo is too detailed to upload. Try a smaller image.")
}

function drawStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[], scale: number, color: string) {
    ctx.save()
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    for (const stroke of strokes) {
        ctx.lineWidth = stroke.radius * 2 * scale
        if (stroke.points.length === 1) {
            ctx.beginPath()
            ctx.arc(stroke.points[0].x * scale, stroke.points[0].y * scale, stroke.radius * scale, 0, Math.PI * 2)
            ctx.fill()
            continue
        }
        ctx.beginPath()
        stroke.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x * scale, p.y * scale) : ctx.lineTo(p.x * scale, p.y * scale)))
        ctx.stroke()
    }
    ctx.restore()
}

export function AiPhotoEditorTool() {
    const { tier } = usePlan()
    const isPro = tier === "pro"

    const [file, setFile] = useState<File | null>(null)
    const [versions, setVersions] = useState<Version[]>([])
    const [current, setCurrent] = useState(0)
    const [prompt, setPrompt] = useState("")
    const [quality, setQuality] = useState<PhotoEditQuality>("standard")
    const [status, setStatus] = useState<Status>({ kind: "idle" })

    const [brushOn, setBrushOn] = useState(false)
    const [brushSize, setBrushSize] = useState(28)
    const [strokes, setStrokes] = useState<Stroke[]>([])
    const [compare, setCompare] = useState(false)
    const [split, setSplit] = useState(50)

    const imgRef = useRef<HTMLImageElement | null>(null)
    const overlayRef = useRef<HTMLCanvasElement | null>(null)
    const drawing = useRef<Stroke | null>(null)

    const version = versions[current] ?? null
    const previous = current > 0 ? versions[current - 1] : null
    const isBusy = status.kind === "loading" || status.kind === "editing"

    // Free every version's object URL when the tool unmounts.
    const versionsRef = useRef(versions)
    useEffect(() => {
        versionsRef.current = versions
    }, [versions])
    useEffect(() => () => versionsRef.current.forEach((v) => URL.revokeObjectURL(v.url)), [])

    const redrawOverlay = useCallback(() => {
        const canvas = overlayRef.current
        const img = imgRef.current
        if (!canvas || !img || !version) return
        const rect = img.getBoundingClientRect()
        const dpr = window.devicePixelRatio || 1
        canvas.width = Math.round(rect.width * dpr)
        canvas.height = Math.round(rect.height * dpr)
        canvas.style.width = `${rect.width}px`
        canvas.style.height = `${rect.height}px`
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        drawStrokes(ctx, drawing.current ? [...strokes, drawing.current] : strokes, (rect.width / version.width) * dpr, MARK_COLOR)
    }, [strokes, version])

    useEffect(() => {
        redrawOverlay()
        const img = imgRef.current
        if (!img) return
        const observer = new ResizeObserver(redrawOverlay)
        observer.observe(img)
        return () => observer.disconnect()
    }, [redrawOverlay])

    async function handleFileSelect(next: File) {
        setStatus({ kind: "loading" })
        const url = URL.createObjectURL(next)
        try {
            const img = await loadImage(url)
            const encoded = await encodeForUpload(img, null)
            versions.forEach((v) => URL.revokeObjectURL(v.url))
            setFile(next)
            setVersions([{ url: URL.createObjectURL(encoded.blob), blob: encoded.blob, width: encoded.width, height: encoded.height, label: "Original" }])
            setCurrent(0)
            setStrokes([])
            setCompare(false)
            setStatus({ kind: "idle" })
        } catch (error) {
            const heic = /\.(heic|heif)$/i.test(next.name)
            setStatus({
                kind: "error",
                message: heic
                    ? "Your browser can't open HEIC photos. Convert it with our HEIC to JPG tool first."
                    : error instanceof Error && error.message !== "decode"
                      ? error.message
                      : "Couldn't open this image. Upload a JPG, PNG, or WebP photo.",
            })
        } finally {
            URL.revokeObjectURL(url)
        }
    }

    function handleClear() {
        versions.forEach((v) => URL.revokeObjectURL(v.url))
        setFile(null)
        setVersions([])
        setCurrent(0)
        setStrokes([])
        setPrompt("")
        setStatus({ kind: "idle" })
    }

    // --- Brush -------------------------------------------------------------

    function pointFromEvent(event: React.PointerEvent<HTMLCanvasElement>) {
        const rect = event.currentTarget.getBoundingClientRect()
        const scale = version ? version.width / rect.width : 1
        return { x: (event.clientX - rect.left) * scale, y: (event.clientY - rect.top) * scale, scale }
    }

    function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
        if (!brushOn || isBusy) return
        event.currentTarget.setPointerCapture(event.pointerId)
        const { x, y, scale } = pointFromEvent(event)
        drawing.current = { radius: (brushSize / 2) * scale, points: [{ x, y }] }
        redrawOverlay()
    }

    function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
        if (!drawing.current) return
        const { x, y } = pointFromEvent(event)
        drawing.current.points.push({ x, y })
        redrawOverlay()
    }

    function onPointerUp() {
        if (!drawing.current) return
        const stroke = drawing.current
        drawing.current = null
        setStrokes((prev) => [...prev, stroke])
    }

    // --- Edit --------------------------------------------------------------

    async function runEdit(editPrompt: string) {
        if (!version || isBusy) return
        const text = editPrompt.trim()
        if (text.length < 3) {
            setStatus({ kind: "error", message: "Describe the edit you want, or pick one of the quick edits." })
            return
        }
        setStatus({ kind: "editing" })
        setCompare(false)
        try {
            const img = await loadImage(version.url)
            const photo = await encodeForUpload(img, null)
            // The marked copy only shows where to edit, so a smaller version keeps the request under the size limit.
            const marked = strokes.length > 0 ? await encodeForUpload(img, strokes, 1024) : null

            const res = await fetch("/api/ai/photo-edit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({ image: photo.base64, marked: marked?.base64, prompt: text, quality }),
            })
            const data = await res.json().catch(() => null)
            if (res.status === 401) return setStatus({ kind: "auth-required" })
            if (res.status === 429) return setStatus({ kind: "quota-exceeded", message: data?.error || "Daily AI limit reached." })
            if (!res.ok || !data?.ok || typeof data.image !== "string") {
                return setStatus({ kind: "error", message: data?.error || "AI couldn't edit this photo. Please try again." })
            }

            const bytes = Uint8Array.from(atob(data.image), (c) => c.charCodeAt(0))
            const blob = new Blob([bytes], { type: data.mimeType || "image/jpeg" })
            const next: Version = { url: URL.createObjectURL(blob), blob, width: data.width, height: data.height, label: text }
            // Editing an older version discards the versions after it, like undo history.
            setVersions((prev) => {
                prev.slice(current + 1).forEach((v) => URL.revokeObjectURL(v.url))
                return [...prev.slice(0, current + 1), next]
            })
            setCurrent(current + 1)
            setStrokes([])
            setBrushOn(false)
            setStatus({ kind: "idle" })
        } catch (error) {
            setStatus({ kind: "error", message: error instanceof Error ? error.message : "AI couldn't edit this photo. Please try again." })
        }
    }

    function applyPreset(presetPrompt: string, needsMarks?: boolean) {
        if (needsMarks && strokes.length === 0) {
            setBrushOn(true)
            setStatus({ kind: "error", message: "Brush over the thing you want to erase, then tap Erase again." })
            return
        }
        setPrompt(presetPrompt)
        void runEdit(presetPrompt)
    }

    function download() {
        if (!version || !file) return
        const base = file.name.replace(/\.[^.]+$/, "") || "photo"
        downloadBlob(version.blob, current === 0 ? `${base}.jpg` : `${base}-edited.jpg`)
    }

    // --- Render ------------------------------------------------------------

    if (!version) {
        return (
            <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
                <Header />
                <div className="mt-6">
                    <ImageDropzone onFileSelect={handleFileSelect} file={null} accept="image/jpeg,image/png,image/webp,image/heic,image/heif" hint="JPG, PNG, or WebP" />
                </div>
                {status.kind === "loading" && (
                    <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Opening photo...
                    </p>
                )}
                {status.kind === "error" && (
                    <p className="mt-3 text-sm text-destructive">
                        {status.message}{" "}
                        {/HEIC/.test(status.message) && (
                            <Link href="/tools/image-tools/heic-to-jpg" className="underline">
                                Open HEIC to JPG
                            </Link>
                        )}
                    </p>
                )}
                <div className="mt-6 flex flex-wrap gap-2">
                    {["Remove a person or object", "Change the background", "Professional headshot", "Product photo", "Enhance a photo"].map((label) => (
                        <span key={label} className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground">
                            {label}
                        </span>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <Header />

            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
                {/* Canvas */}
                <div className="space-y-3">
                    <div className="relative flex min-h-64 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-muted/40 p-2">
                        <div className="relative inline-block max-w-full">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                ref={imgRef}
                                src={version.url}
                                alt="Photo being edited"
                                className="block max-h-[70vh] max-w-full rounded-lg select-none"
                                draggable={false}
                                onLoad={redrawOverlay}
                            />
                            {compare && previous && (
                                // Before/after: the previous version, clipped to the left of the slider.
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={previous.url}
                                    alt="Before this edit"
                                    className="pointer-events-none absolute inset-0 h-full w-full rounded-lg object-fill"
                                    style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
                                />
                            )}
                            {compare && previous && (
                                <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${split}%` }} />
                            )}
                            <canvas
                                ref={overlayRef}
                                className={cn("absolute inset-0 rounded-lg touch-none", brushOn ? "cursor-crosshair" : "pointer-events-none", compare && "hidden")}
                                onPointerDown={onPointerDown}
                                onPointerMove={onPointerMove}
                                onPointerUp={onPointerUp}
                                onPointerCancel={onPointerUp}
                            />
                            {status.kind === "editing" && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg bg-background/60 backdrop-blur-[2px]">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <p className="text-sm font-medium">Editing... about 10–40 seconds</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {compare && previous && (
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={split}
                            onChange={(e) => setSplit(Number(e.target.value))}
                            className="w-full accent-primary"
                            aria-label="Before and after"
                        />
                    )}

                    {/* History */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {versions.map((v, i) => (
                            <button
                                key={v.url}
                                type="button"
                                onClick={() => {
                                    setCurrent(i)
                                    setStrokes([])
                                    setCompare(false)
                                }}
                                disabled={isBusy}
                                title={v.label}
                                className={cn(
                                    "relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2",
                                    i === current ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                                )}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={v.url} alt="" className="h-full w-full object-cover" />
                                <span className="absolute bottom-0 left-0 rounded-tr bg-black/60 px-1 text-[10px] text-white">{i === 0 ? "Orig" : i}</span>
                            </button>
                        ))}
                        <div className="ms-auto flex shrink-0 gap-1.5">
                            {current > 0 && (
                                <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={() => {
                                        setCurrent(current - 1)
                                        // Strokes are in this version's pixels; the previous one may be a different size.
                                        setStrokes([])
                                        setCompare(false)
                                    }}
                                    disabled={isBusy}
                                >
                                    <Undo2 className="h-3.5 w-3.5" />
                                    Undo
                                </Button>
                            )}
                            {previous && (
                                <Button type="button" variant={compare ? "secondary" : "ghost"} size="sm" className="rounded-full" onClick={() => setCompare((c) => !c)} disabled={isBusy}>
                                    <SplitSquareHorizontal className="h-3.5 w-3.5" />
                                    Compare
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="space-y-4">
                    <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/30 p-3">
                        <div className="flex items-center justify-between gap-2">
                            <Button
                                type="button"
                                variant={brushOn ? "default" : "outline"}
                                size="sm"
                                className="rounded-full"
                                onClick={() => setBrushOn((b) => !b)}
                                disabled={isBusy || compare}
                            >
                                <Brush className="h-3.5 w-3.5" />
                                {brushOn ? "Brushing" : "Brush an area"}
                            </Button>
                            {strokes.length > 0 && (
                                <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={() => setStrokes([])} disabled={isBusy}>
                                    <X className="h-3.5 w-3.5" />
                                    Clear marks
                                </Button>
                            )}
                        </div>
                        {brushOn && (
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                Size
                                <input type="range" min={8} max={90} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="flex-1 accent-primary" />
                            </label>
                        )}
                        <p className="text-xs text-muted-foreground">
                            {strokes.length > 0
                                ? "Your edit will only change the brushed area."
                                : "Optional: paint over something to erase or change just that part."}
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground">Quick edits</p>
                        <div className="flex flex-wrap gap-1.5">
                            {PHOTO_EDIT_PRESETS.map((preset) => (
                                <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => applyPreset(preset.prompt, preset.needsMarks)}
                                    disabled={isBusy}
                                    className={cn(
                                        "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-colors disabled:opacity-50",
                                        preset.needsMarks
                                            ? "border-primary/40 bg-primary/5 text-primary hover:bg-primary/10"
                                            : "border-border/60 hover:border-primary/50 hover:bg-primary/5"
                                    )}
                                >
                                    {preset.needsMarks && <Eraser className="h-3 w-3" />}
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <form
                        className="space-y-2"
                        onSubmit={(e) => {
                            e.preventDefault()
                            void runEdit(prompt)
                        }}
                    >
                        <p className="text-xs font-medium text-muted-foreground">Or describe your edit</p>
                        <Textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value.slice(0, PHOTO_EDIT_MAX_PROMPT))}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    void runEdit(prompt)
                                }
                            }}
                            placeholder={strokes.length > 0 ? 'e.g. "replace with a potted plant"' : 'e.g. "remove the man on the left", "make the sky blue", "change the background to a beach"'}
                            className="min-h-20 resize-y rounded-2xl text-sm"
                            disabled={isBusy}
                        />

                        <div className="flex items-center justify-between gap-2">
                            <ToolSegmentedControl
                                value={quality}
                                onChange={(value) => setQuality(value === "hd" && !isPro ? "standard" : value)}
                                options={[
                                    { value: "standard", label: "Standard" },
                                    { value: "hd", label: isPro ? "HD" : "HD (Pro)" },
                                ]}
                            />
                            <Button type="submit" className="rounded-full" disabled={isBusy || prompt.trim().length < 3}>
                                {status.kind === "editing" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                                Apply
                            </Button>
                        </div>
                        {!isPro && (
                            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Crown className="h-3 w-3" />
                                <Link href="/dashboard/premium" className="underline">
                                    Pro
                                </Link>{" "}
                                unlocks HD: a higher-quality model at 2K resolution.
                            </p>
                        )}
                    </form>

                    {status.kind === "auth-required" && (
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                            <Link href={`/login?callbackUrl=${TOOL_PATH}`} className="underline">
                                Sign in
                            </Link>{" "}
                            to edit photos with AI.
                        </p>
                    )}
                    {status.kind === "quota-exceeded" && (
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                            {status.message}{" "}
                            <Link href="/dashboard/premium" className="underline">
                                Upgrade for more
                            </Link>
                            .
                        </p>
                    )}
                    {status.kind === "error" && <p className="text-sm text-destructive">{status.message}</p>}

                    <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
                        <Button type="button" className="rounded-full" onClick={download} disabled={isBusy}>
                            <Download className="h-4 w-4" />
                            Download {current > 0 ? "edited photo" : "photo"}
                        </Button>
                        <Button type="button" variant="outline" className="rounded-full" onClick={handleClear} disabled={isBusy}>
                            <RefreshCw className="h-4 w-4" />
                            New photo
                        </Button>
                    </div>
                    <p className="text-[11px] leading-4 text-muted-foreground">
                        Each edit uses one AI generation. Edited images carry Google&apos;s invisible SynthID watermark. Only
                        edit photos you have the right to use, and don&apos;t use edits to mislead or impersonate anyone.
                    </p>
                </div>
            </div>
        </div>
    )
}

function Header() {
    return (
        <>
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">AI Photo Editor</h2>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Edit photos by describing what you want: remove people or objects, change the background, fix lighting,
                or create a professional headshot. Brush over an area to change just that part.
            </p>
        </>
    )
}
