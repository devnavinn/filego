"use client"

import { useState } from "react"
import { PDFDocument } from "@cantoo/pdf-lib"
import { Minimize2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { PdfDropzone } from "@/components/tools/pdf-dropzone"
import { formatBytes } from "@/lib/image-utils"
import { downloadBlob, pdfBytesToBlob, replaceExtension } from "@/lib/pdf-tool-utils"
import { usePdfJs, type PdfJsLib } from "@/lib/use-pdfjs"

type Level = "low" | "recommended" | "high" | "target"

type SizeUnit = "KB" | "MB"

const QUICK_TARGETS: { label: string; kb: number }[] = [
    { label: "50 KB", kb: 50 },
    { label: "100 KB", kb: 100 },
    { label: "200 KB", kb: 200 },
    { label: "500 KB", kb: 500 },
    { label: "1 MB", kb: 1024 },
]

const SCALE_TIERS = [1.5, 1.2, 1.0, 0.8, 0.6, 0.45]
const QUALITY_SEARCH_ITERATIONS = 5
const MIN_QUALITY = 0.1
const MAX_QUALITY = 0.92

async function compressToTargetSize(
    pdfjsLib: PdfJsLib,
    bytes: ArrayBuffer,
    targetBytes: number,
    onProgress: (message: string) => void
): Promise<{ bytes: Uint8Array; achievedTarget: boolean }> {
    const source = await pdfjsLib.getDocument({ data: new Uint8Array(bytes) }).promise
    let lastAttempt: Uint8Array | null = null

    for (const scale of SCALE_TIERS) {
        onProgress(`Rendering pages at ${Math.round(scale * 100)}% scale...`)

        const pages: { canvas: HTMLCanvasElement; width: number; height: number }[] = []
        for (let i = 1; i <= source.numPages; i++) {
            const page = await source.getPage(i)
            const viewport = page.getViewport({ scale })

            const canvas = document.createElement("canvas")
            canvas.width = Math.max(1, Math.floor(viewport.width))
            canvas.height = Math.max(1, Math.floor(viewport.height))
            const ctx = canvas.getContext("2d")
            if (!ctx) throw new Error("Canvas is not supported in this browser.")

            await page.render({ canvasContext: ctx, viewport }).promise

            const originalViewport = page.getViewport({ scale: 1 })
            pages.push({ canvas, width: originalViewport.width, height: originalViewport.height })
        }

        async function buildAt(quality: number): Promise<Uint8Array> {
            const output = await PDFDocument.create()
            for (const p of pages) {
                const jpegDataUrl = p.canvas.toDataURL("image/jpeg", quality)
                const jpegBytes = Uint8Array.from(atob(jpegDataUrl.split(",")[1]), (c) => c.charCodeAt(0))
                const jpegImage = await output.embedJpg(jpegBytes)
                const outputPage = output.addPage([p.width, p.height])
                outputPage.drawImage(jpegImage, { x: 0, y: 0, width: p.width, height: p.height })
            }
            return output.save()
        }

        let lo = MIN_QUALITY
        let hi = MAX_QUALITY
        let bestUnderTarget: Uint8Array | null = null

        for (let iteration = 0; iteration < QUALITY_SEARCH_ITERATIONS; iteration++) {
            const mid = (lo + hi) / 2
            onProgress(`Trying quality ${Math.round(mid * 100)}% at ${Math.round(scale * 100)}% scale...`)

            const attempt = await buildAt(mid)
            lastAttempt = attempt

            if (attempt.byteLength <= targetBytes) {
                bestUnderTarget = attempt
                lo = mid
            } else {
                hi = mid
            }
        }

        if (bestUnderTarget) {
            return { bytes: bestUnderTarget, achievedTarget: true }
        }
    }

    return { bytes: lastAttempt as Uint8Array, achievedTarget: false }
}

const LEVELS: {
    value: Level
    label: string
    description: string
    scale: number
    quality: number
    rasterize: boolean
}[] = [
        {
            value: "low",
            label: "Low (safe)",
            description: "Re-packs the PDF structure only. Text stays selectable; savings are modest.",
            scale: 0,
            quality: 0,
            rasterize: false,
        },
        {
            value: "recommended",
            label: "Recommended",
            description: "Re-renders each page as a high-quality image. Good balance of size and clarity.",
            scale: 1.5,
            quality: 0.75,
            rasterize: true,
        },
        {
            value: "high",
            label: "High compression",
            description: "Smaller files, lower image clarity — best for archiving or quick sharing.",
            scale: 1.0,
            quality: 0.5,
            rasterize: true,
        },
    ]

export function PdfCompressTool() {
    const { pdfjsLib, error: pdfjsError } = usePdfJs()
    const [file, setFile] = useState<File | null>(null)
    const [level, setLevel] = useState<Level>("recommended")
    const [progress, setProgress] = useState("")
    const [result, setResult] = useState<{ blob: Blob; missedTarget?: boolean } | null>(null)
    const [isCompressing, setIsCompressing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [targetValue, setTargetValue] = useState("100")
    const [targetUnit, setTargetUnit] = useState<SizeUnit>("KB")

    function handleClear() {
        setFile(null)
        setResult(null)
        setError(null)
    }

    async function compressLossless(bytes: ArrayBuffer) {
        const doc = await PDFDocument.load(bytes)
        return doc.save({ useObjectStreams: true })
    }

    async function compressRasterized(bytes: ArrayBuffer, scale: number, quality: number) {
        if (!pdfjsLib) throw new Error("The PDF engine is still loading. Try again in a moment.")

        const source = await pdfjsLib.getDocument({ data: new Uint8Array(bytes) }).promise
        const output = await PDFDocument.create()

        for (let i = 1; i <= source.numPages; i++) {
            setProgress(`Compressing page ${i} of ${source.numPages}...`)

            const page = await source.getPage(i)
            const viewport = page.getViewport({ scale })

            const canvas = document.createElement("canvas")
            canvas.width = viewport.width
            canvas.height = viewport.height
            const ctx = canvas.getContext("2d")
            if (!ctx) throw new Error("Canvas is not supported in this browser.")

            await page.render({ canvasContext: ctx, viewport }).promise

            const jpegDataUrl = canvas.toDataURL("image/jpeg", quality)
            const jpegBytes = Uint8Array.from(atob(jpegDataUrl.split(",")[1]), (c) => c.charCodeAt(0))
            const jpegImage = await output.embedJpg(jpegBytes)

            const originalViewport = page.getViewport({ scale: 1 })
            const outputPage = output.addPage([originalViewport.width, originalViewport.height])
            outputPage.drawImage(jpegImage, {
                x: 0,
                y: 0,
                width: originalViewport.width,
                height: originalViewport.height,
            })
        }

        return output.save()
    }

    async function handleCompress() {
        if (!file) return
        setIsCompressing(true)
        setError(null)
        setResult(null)

        try {
            const bytes = await file.arrayBuffer()

            if (level === "target") {
                if (!pdfjsLib) throw new Error("The PDF engine is still loading. Try again in a moment.")

                const parsedValue = Number(targetValue)
                if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
                    throw new Error("Enter a target size greater than 0.")
                }

                const targetBytes = Math.round(parsedValue * (targetUnit === "MB" ? 1024 * 1024 : 1024))
                const { bytes: output, achievedTarget } = await compressToTargetSize(pdfjsLib, bytes, targetBytes, setProgress)

                setResult({ blob: pdfBytesToBlob(output), missedTarget: !achievedTarget })
            } else {
                const config = LEVELS.find((l) => l.value === level)!
                const output = config.rasterize
                    ? await compressRasterized(bytes, config.scale, config.quality)
                    : await compressLossless(bytes)

                setResult({ blob: pdfBytesToBlob(output) })
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not compress this PDF. Make sure it isn't password protected.")
        } finally {
            setIsCompressing(false)
            setProgress("")
        }
    }

    function handleDownload() {
        if (!result || !file) return
        downloadBlob(result.blob, replaceExtension(file.name, "compressed.pdf"))
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">PDF Compress</h2>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Reduce PDF file size. Higher compression re-renders pages as images, so text stops being
                selectable — pick Low if you need to keep the PDF fully intact.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                    <PdfDropzone onFileSelect={setFile} file={file} onClear={handleClear} />

                    {file && (
                        <div className="space-y-3">
                            {LEVELS.map((option) => (
                                <label
                                    key={option.value}
                                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-colors ${level === option.value ? "border-primary bg-primary/5" : "border-border/60 bg-muted/30"
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="compress-level"
                                        checked={level === option.value}
                                        onChange={() => setLevel(option.value)}
                                        className="mt-1 h-3.5 w-3.5"
                                    />
                                    <div>
                                        <p className="text-sm font-medium">{option.label}</p>
                                        <p className="text-xs text-muted-foreground">{option.description}</p>
                                    </div>
                                </label>
                            ))}

                            <label
                                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-colors ${level === "target" ? "border-primary bg-primary/5" : "border-border/60 bg-muted/30"
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="compress-level"
                                    checked={level === "target"}
                                    onChange={() => setLevel("target")}
                                    className="mt-1 h-3.5 w-3.5"
                                />
                                <div className="flex-1 space-y-3">
                                    <div>
                                        <p className="text-sm font-medium">Target size</p>
                                        <p className="text-xs text-muted-foreground">
                                            Automatically finds the highest quality that still fits your target file size —
                                            handy for portals that cap uploads at a fixed size.
                                        </p>
                                    </div>

                                    {level === "target" && (
                                        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex flex-wrap gap-1.5">
                                                {QUICK_TARGETS.map((quick) => (
                                                    <button
                                                        key={quick.label}
                                                        type="button"
                                                        onClick={() => {
                                                            const isMb = quick.kb >= 1024
                                                            setTargetUnit(isMb ? "MB" : "KB")
                                                            setTargetValue(String(isMb ? quick.kb / 1024 : quick.kb))
                                                        }}
                                                        className="rounded-full border border-border/60 bg-background px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted"
                                                    >
                                                        {quick.label}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={targetValue}
                                                    onChange={(e) => setTargetValue(e.target.value)}
                                                    className="h-9 max-w-28 rounded-full"
                                                />
                                                <Select value={targetUnit} onValueChange={(v) => setTargetUnit(v as SizeUnit)}>
                                                    <SelectTrigger className="h-9 w-24 rounded-full">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="KB">KB</SelectItem>
                                                        <SelectItem value="MB">MB</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </label>

                            {pdfjsError && <p className="text-sm text-destructive">{pdfjsError}</p>}
                            {error && <p className="text-sm text-destructive">{error}</p>}

                            <Button
                                type="button"
                                className="w-full rounded-full"
                                onClick={handleCompress}
                                disabled={isCompressing}
                            >
                                <Minimize2 />
                                {isCompressing ? progress || "Compressing..." : "Compress PDF"}
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-muted/30 p-6 text-center">
                    {result && file ? (
                        <>
                            <p className="text-sm font-medium">Compression complete</p>
                            <p className="text-xs text-muted-foreground">
                                {formatBytes(file.size)} → {formatBytes(result.blob.size)}
                                {result.blob.size < file.size &&
                                    ` (-${Math.round((1 - result.blob.size / file.size) * 100)}%)`}
                            </p>
                            {result.missedTarget && (
                                <p className="max-w-xs text-xs text-amber-600 dark:text-amber-400">
                                    Couldn&rsquo;t fully reach your target size without becoming unreadable — this is the
                                    smallest we could get. Try a less aggressive target, or split the PDF into fewer
                                    pages first.
                                </p>
                            )}
                            <Button type="button" className="rounded-full" onClick={handleDownload}>
                                Download compressed PDF
                            </Button>
                        </>
                    ) : (
                        <p className="text-xs text-muted-foreground">Your compressed PDF will appear here.</p>
                    )}
                </div>
            </div>
        </div>
    )
}
