"use client"

import { useState } from "react"
import Link from "next/link"
import { FileText, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { GenericFileDropzone } from "@/components/tools/generic-file-dropzone"
import { CopyButton } from "@/components/tools/copy-button"
import { usePdfJs } from "@/lib/use-pdfjs"
import { canvasToBlob, downloadBlob } from "@/lib/image-tool-utils"
import { fileToBase64 } from "@/lib/file-to-base64"

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
    const [pages, setPages] = useState<string[] | null>(null)
    const [truncatedNote, setTruncatedNote] = useState<string | null>(null)

    async function handleFileSelect(nextFile: File) {
        if (!pdfjsLib) {
            setStatus({ kind: "error", message: "The PDF engine is still loading. Try again in a moment." })
            return
        }

        setFile(nextFile)
        setPages(null)
        setTruncatedNote(null)
        setStatus({ kind: "rendering", message: "Reading PDF..." })

        try {
            const buffer = new Uint8Array(await nextFile.arrayBuffer())
            const doc = await pdfjsLib.getDocument({ data: buffer }).promise
            const pageCount = Math.min(doc.numPages, MAX_OCR_PAGES)

            if (doc.numPages > MAX_OCR_PAGES) {
                setTruncatedNote(`This PDF has ${doc.numPages} pages — only the first ${MAX_OCR_PAGES} were processed.`)
            }

            const images: { imageBase64: string; mimeType: string }[] = []

            for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
                setStatus({ kind: "rendering", message: `Rendering page ${pageNumber} of ${pageCount}...` })

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

            setPages(data.pages as string[])
            setStatus({ kind: "idle" })
        } catch (err) {
            setStatus({ kind: "error", message: err instanceof Error ? err.message : "Could not process this PDF." })
        }
    }

    function handleClear() {
        setFile(null)
        setPages(null)
        setTruncatedNote(null)
        setStatus({ kind: "idle" })
    }

    const combinedText = pages
        ? pages.map((text, index) => `--- Page ${index + 1} ---\n${text}`).join("\n\n")
        : ""

    function handleDownload() {
        if (!combinedText) return
        downloadBlob(new Blob([combinedText], { type: "text/plain" }), "pdf-ocr-text.txt")
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

            {pages && !isBusy && (
                <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                            Extracted text ({pages.length} {pages.length === 1 ? "page" : "pages"})
                        </p>
                        <div className="flex items-center gap-1.5">
                            <CopyButton value={combinedText} label="Copy all" variant="ghost" className="sm:w-auto" />
                            <Button type="button" variant="ghost" size="sm" onClick={handleDownload}>
                                Download .txt
                            </Button>
                        </div>
                    </div>

                    <div className="max-h-96 space-y-4 overflow-y-auto rounded-2xl border border-border/60 bg-muted/30 p-4">
                        {pages.map((text, index) => (
                            <div key={index}>
                                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                    Page {index + 1}
                                </p>
                                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-foreground">
                                    {text || "No text recognized on this page."}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
