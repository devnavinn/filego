"use client"

import { useState } from "react"
import Link from "next/link"
import { FileText, Loader2, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { GenericFileDropzone } from "@/components/tools/generic-file-dropzone"
import { CopyButton } from "@/components/tools/copy-button"
import { usePdfJs } from "@/lib/use-pdfjs"
import { extractTextFromFile } from "@/lib/ai-file-text-extract"
import type { DocumentSummary } from "@/lib/ai/gemini"

type Status =
    | { kind: "idle" }
    | { kind: "extracting" }
    | { kind: "generating" }
    | { kind: "error"; message: string }
    | { kind: "auth-required" }
    | { kind: "quota-exceeded"; message: string }

export function DocumentSummarizerTool() {
    const { pdfjsLib } = usePdfJs()
    const [file, setFile] = useState<File | null>(null)
    const [status, setStatus] = useState<Status>({ kind: "idle" })
    const [result, setResult] = useState<DocumentSummary | null>(null)

    async function handleFileSelect(nextFile: File) {
        setFile(nextFile)
        setResult(null)
        setStatus({ kind: "extracting" })

        try {
            const text = await extractTextFromFile(nextFile, pdfjsLib)
            await generateSummary(text)
        } catch (err) {
            setStatus({ kind: "error", message: err instanceof Error ? err.message : "Could not read this file." })
        }
    }

    async function generateSummary(text: string) {
        setStatus({ kind: "generating" })

        try {
            const res = await fetch("/api/ai/summarize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({ text }),
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

            if (!res.ok || !data?.ok || !data?.result) {
                setStatus({ kind: "error", message: data?.error || "AI summarization failed. Please try again." })
                return
            }

            setResult(data.result as DocumentSummary)
            setStatus({ kind: "idle" })
        } catch {
            setStatus({ kind: "error", message: "AI summarization failed. Please try again." })
        }
    }

    function handleClear() {
        setFile(null)
        setResult(null)
        setStatus({ kind: "idle" })
    }

    const isBusy = status.kind === "extracting" || status.kind === "generating"
    const copyValue = result
        ? [result.summary, "", "Key points:", ...result.keyPoints.map((point) => `- ${point}`)].join("\n")
        : ""

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Document Summarizer</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Upload a PDF, DOCX, or TXT file and get an AI-generated summary with key points.
            </p>

            <div className="mt-6">
                <GenericFileDropzone
                    file={file}
                    onFileSelect={handleFileSelect}
                    onClear={handleClear}
                    accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                    hint="Click to upload or drag & drop a PDF, DOCX, or TXT file"
                    icon={FileText}
                />
            </div>

            {status.kind === "extracting" && (
                <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Reading document...
                </p>
            )}

            {status.kind === "generating" && (
                <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Summarizing with AI...
                </p>
            )}

            {status.kind === "auth-required" && (
                <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
                    <Link href="/login?callbackUrl=/tools/ai-tools/document-summarizer" className="underline">
                        Sign in
                    </Link>{" "}
                    to summarize documents with AI.
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

            {result && !isBusy && (
                <div className="mt-6 space-y-4 rounded-2xl border border-border/60 bg-muted/30 p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                            <Sparkles className="h-4 w-4" />
                            Summary
                        </div>
                        <CopyButton value={copyValue} label="Copy" variant="ghost" className="sm:w-auto" />
                    </div>

                    <p className="text-sm leading-6 text-foreground">{result.summary}</p>

                    {result.keyPoints.length > 0 && (
                        <div>
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Key points
                            </p>
                            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-foreground">
                                {result.keyPoints.map((point, index) => (
                                    <li key={index}>{point}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
