"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ImageDropzone } from "@/components/tools/image-dropzone"
import { CopyButton } from "@/components/tools/copy-button"
import { fileToBase64 } from "@/lib/file-to-base64"
import { downloadBlob } from "@/lib/image-tool-utils"
import { textToImageBlob, textToPdfBlob } from "@/lib/text-export"
import type { OcrMode } from "@/lib/ai/gemini"

type Status =
    | { kind: "idle" }
    | { kind: "recognizing" }
    | { kind: "error"; message: string }
    | { kind: "auth-required" }
    | { kind: "quota-exceeded"; message: string }

const MAX_FILE_BYTES = 12 * 1024 * 1024

type ImageOcrToolProps = {
    mode: OcrMode
    title: string
    description: string
    signInCallbackUrl: string
    downloadFileName: string
}

const baseFileName = (name: string) => name.replace(/\.[^./\\]+$/, "") || "extracted-text"

export function ImageOcrTool({ mode, title, description, signInCallbackUrl, downloadFileName }: ImageOcrToolProps) {
    const [file, setFile] = useState<File | null>(null)
    const [status, setStatus] = useState<Status>({ kind: "idle" })
    const [text, setText] = useState<string | null>(null)
    const [isExporting, setIsExporting] = useState(false)

    async function handleFileSelect(nextFile: File) {
        if (nextFile.size > MAX_FILE_BYTES) {
            setStatus({ kind: "error", message: "Upload an image under 12 MB." })
            return
        }

        setFile(nextFile)
        setText(null)
        setStatus({ kind: "recognizing" })

        try {
            const imageBase64 = await fileToBase64(nextFile)
            const mimeType = nextFile.type || "image/jpeg"

            const res = await fetch("/api/ai/ocr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({ imageBase64, mimeType, mode }),
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

            if (!res.ok || !data?.ok || !data?.text) {
                setStatus({ kind: "error", message: data?.error || "AI text recognition failed. Please try again." })
                return
            }

            setText(data.text as string)
            setStatus({ kind: "idle" })
        } catch {
            setStatus({ kind: "error", message: "Could not read this image." })
        }
    }

    function handleClear() {
        setFile(null)
        setText(null)
        setStatus({ kind: "idle" })
    }

    function handleDownloadTxt() {
        if (!text) return
        downloadBlob(new Blob([text], { type: "text/plain" }), downloadFileName)
    }

    async function handleDownloadPdf() {
        if (!text) return
        setIsExporting(true)
        try {
            downloadBlob(textToPdfBlob(text), `${baseFileName(downloadFileName)}.pdf`)
        } catch (err) {
            setStatus({ kind: "error", message: err instanceof Error ? err.message : "Could not create a PDF from this text." })
        } finally {
            setIsExporting(false)
        }
    }

    async function handleDownloadImage() {
        if (!text) return
        setIsExporting(true)
        try {
            const blob = await textToImageBlob(text)
            downloadBlob(blob, `${baseFileName(downloadFileName)}.png`)
        } catch {
            setStatus({ kind: "error", message: "Could not create an image from this text." })
        } finally {
            setIsExporting(false)
        }
    }

    const isBusy = status.kind === "recognizing"

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{description}</p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <ImageDropzone
                    file={file}
                    onFileSelect={handleFileSelect}
                    onClear={file ? handleClear : undefined}
                    hint="PNG, JPG, WEBP, or HEIC — up to 12 MB"
                />

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Extracted text</p>
                        {text !== null && (
                            <div className="flex items-center gap-1.5">
                                <CopyButton value={text} label="Copy" variant="ghost" className="sm:w-auto" />
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
                        )}
                    </div>

                    {text !== null && !isBusy ? (
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            rows={12}
                            className="max-h-96 min-h-56 w-full resize-y rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm leading-6 text-foreground outline-none focus:border-primary"
                        />
                    ) : (
                        <div className="min-h-56 max-h-96 overflow-y-auto rounded-2xl border border-border/60 bg-muted/30 p-4">
                            {status.kind === "recognizing" && (
                                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Reading text from image...
                                </p>
                            )}

                            {status.kind === "auth-required" && (
                                <p className="text-sm text-amber-600 dark:text-amber-400">
                                    <Link href={`/login?callbackUrl=${signInCallbackUrl}`} className="underline">
                                        Sign in
                                    </Link>{" "}
                                    to extract text with AI.
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

                            {status.kind === "error" && (
                                <div className="flex flex-wrap items-center gap-3">
                                    <p className="text-sm text-destructive">{status.message}</p>
                                    {file && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="rounded-full"
                                            onClick={() => handleFileSelect(file)}
                                        >
                                            Try again
                                        </Button>
                                    )}
                                </div>
                            )}

                            {status.kind === "idle" && text === null && (
                                <p className="text-sm text-muted-foreground">Upload an image to extract its text.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
