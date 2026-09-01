"use client"

import { useState } from "react"
import { PDFDocument } from "@cantoo/pdf-lib"
import { Minimize2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PdfDropzone } from "@/components/tools/pdf-dropzone"
import { formatBytes } from "@/lib/image-utils"
import { downloadBlob, pdfBytesToBlob, replaceExtension } from "@/lib/pdf-tool-utils"
import { usePdfJs } from "@/lib/use-pdfjs"

type Level = "low" | "recommended" | "high"

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
    const [result, setResult] = useState<{ blob: Blob } | null>(null)
    const [isCompressing, setIsCompressing] = useState(false)
    const [error, setError] = useState<string | null>(null)

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
            const config = LEVELS.find((l) => l.value === level)!
            const bytes = await file.arrayBuffer()

            const output = config.rasterize
                ? await compressRasterized(bytes, config.scale, config.quality)
                : await compressLossless(bytes)

            setResult({ blob: pdfBytesToBlob(output) })
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
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">PDF Compress</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
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
