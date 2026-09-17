"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, FileText, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GenericFileDropzone } from "@/components/tools/generic-file-dropzone"
import { CopyButton } from "@/components/tools/copy-button"
import { usePdfJs } from "@/lib/use-pdfjs"
import { canvasToBlob, downloadBlob } from "@/lib/image-tool-utils"
import { fileToBase64 } from "@/lib/file-to-base64"
import { textToImageBlob, textToPdfBlob } from "@/lib/text-export"

type Status =
    | { kind: "idle" }
    | { kind: "rendering"; message: string }
    | { kind: "recognizing" }
    | { kind: "error"; message: string }
    | { kind: "auth-required" }
    | { kind: "quota-exceeded"; message: string }

// Must match MAX_OCR_PAGES in lib/ai/gemini.ts — kept separate so this
// client component doesn't pull the server-only Gemini SDK into the bundle.
const MAX_OCR_PAGES = 12
const RENDER_SCALE = 1.8
const JPEG_QUALITY = 0.85

export function PdfOcrTool() {
    const { pdfjsLib } = usePdfJs()
    const [file, setFile] = useState<File | null>(null)
    const [status, setStatus] = useState<Status>({ kind: "idle" })
    const [text, setText] = useState<string | null>(null)
    const [pageCount, setPageCount] = useState(0)
    const [isExporting, setIsExporting] = useState(false)
    const [truncatedNote, setTruncatedNote] = useState<string | null>(null)

    async function handleFileSelect(nextFile: File) {
        if (!pdfjsLib) {
            setStatus({ kind: "error", message: "The PDF engine is still loading. Try again in a moment." })
            return
        }

        setFile(nextFile)
        setText(null)
        setPageCount(0)
        setTruncatedNote(null)
        setStatus({ kind: "rendering", message: "Reading PDF..." })

        try {
            const buffer = new Uint8Array(await nextFile.arrayBuffer())
            const doc = await pdfjsLib.getDocument({ data: buffer }).promise
            const pagesToProcess = Math.min(doc.numPages, MAX_OCR_PAGES)

            if (doc.numPages > MAX_OCR_PAGES) {
                setTruncatedNote(`This PDF has ${doc.numPages} pages — only the first ${MAX_OCR_PAGES} were processed.`)
            }

            const images: { imageBase64: string; mimeType: string }[] = []

            for (let pageNumber = 1; pageNumber <= pagesToProcess; pageNumber++) {
                setStatus({ kind: "rendering", message: `Rendering page ${pageNumber} of ${pagesToProcess}...` })

                const page = await doc.getPage(pageNumber)
                const viewport = page.getViewport({ scale: RENDER_SCALE })

                const canvas = document.createElement("canvas")
                canvas.width = Math.max(1, Math.floor(viewport.width))
                canvas.height = Math.max(1, Math.floor(viewport.height))

                const context = canvas.getContext("2d")
                if (!context) throw new Error("Canvas rendering is not available in this browser.")

                context.fillStyle = "#ffffff"
                context.fillRect(0, 0, canvas.width, canvas.height)

                await page.render({ canvasContext: context, viewport }).promise

                const blob = await canvasToBlob(canvas, "image/jpeg", JPEG_QUALITY)
                const imageBase64 = await fileToBase64(blob)
                images.push({ imageBase64, mimeType: "image/jpeg" })
            }

            setStatus({ kind: "recognizing" })

            const res = await fetch("/api/ai/pdf-ocr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({ pages: images }),
            })

            const data = await res.json().catch(() => null)

            if (res.status === 401) {
                setStatus({ kind: "auth-required" })
                return
            }

            if (res.status === 429) {
                setStatus({ kind: "quota-exceeded", message: data?.error || "Daily AI limit reached." })
                return
            }

            if (!res.ok || !data?.ok || !Array.isArray(data?.pages)) {
                setStatus({ kind: "error", message: data?.error || "AI text recognition failed. Please try again." })
                return
            }

            const recognizedPages = data.pages as string[]
            const combined = recognizedPages
                .map((pageText, index) => `--- Page ${index + 1} ---\n${pageText}`)
                .join("\n\n")

            setText(combined)
            setPageCount(recognizedPages.length)
            setStatus({ kind: "idle" })
        } catch (err) {
            setStatus({ kind: "error", message: err instanceof Error ? err.message : "Could not process this PDF." })
        }
    }

    function handleClear() {
        setFile(null)
        setText(null)
        setPageCount(0)
        setTruncatedNote(null)
        setStatus({ kind: "idle" })
    }

    function handleDownloadTxt() {
        if (!text) return
        downloadBlob(new Blob([text], { type: "text/plain" }), "pdf-ocr-text.txt")
    }

    async function handleDownloadPdf() {
        if (!text) return
        setIsExporting(true)
        try {
            downloadBlob(textToPdfBlob(text), "pdf-ocr-text.pdf")
        } finally {
            setIsExporting(false)
        }
    }

    async function handleDownloadImage() {
        if (!text) return
        setIsExporting(true)
        try {
            const blob = await textToImageBlob(text)
            downloadBlob(blob, "pdf-ocr-text.png")
        } catch {
            setStatus({ kind: "error", message: "Could not create an image from this text." })
        } finally {
            setIsExporting(false)
        }
    }

    const isBusy = status.kind === "rendering" || status.kind === "recognizing"

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">PDF OCR</h2>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Upload a scanned PDF and extract its text with AI — for documents with no selectable text layer.
            </p>

            <div className="mt-6">
                <GenericFileDropzone
                    file={file}
                    onFileSelect={handleFileSelect}
                    onClear={handleClear}
                    accept=".pdf,application/pdf"
                    hint="Click to upload or drag & drop a scanned PDF"
                    icon={FileText}
                />
            </div>

            {status.kind === "rendering" && (
                <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {status.message}
                </p>
            )}

            {status.kind === "recognizing" && (
                <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running OCR with AI...
                </p>
            )}

            {status.kind === "auth-required" && (
                <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
                    <Link href="/login?callbackUrl=/tools/ai-tools/pdf-ocr" className="underline">
                        Sign in
                    </Link>{" "}
                    to run OCR on PDFs with AI.
                </p>
            )}

            {status.kind === "quota-exceeded" && (
                <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
                    {status.message}{" "}
                    <Link href="/dashboard/premium" className="underline">
                        Upgrade for more
                    </Link>
                    .
                </p>
            )}

            {status.kind === "error" && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                    <p className="text-sm text-destructive">{status.message}</p>
                    {file && (
                        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => handleFileSelect(file)}>
                            Try again
                        </Button>
                    )}
                </div>
            )}

            {truncatedNote && !isBusy && (
                <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">{truncatedNote}</p>
            )}

            {text !== null && !isBusy && (
                <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                            Extracted text ({pageCount} {pageCount === 1 ? "page" : "pages"})
                        </p>
                        <div className="flex items-center gap-1.5">
                            <CopyButton value={text} label="Copy all" variant="ghost" className="sm:w-auto" />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button type="button" variant="ghost" size="sm" disabled={isExporting}>
                                        {isExporting ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <ChevronDown className="h-3.5 w-3.5" />
                                        )}
                                        Download
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={handleDownloadTxt}>Text (.txt)</DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleDownloadPdf}>PDF (.pdf)</DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleDownloadImage}>Image (.png)</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={16}
                        className="max-h-96 min-h-56 w-full resize-y rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm leading-6 text-foreground outline-none focus:border-primary"
                    />
                </div>
            )}
        </div>
    )
}
