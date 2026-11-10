"use client"

import { useState } from "react"
import Link from "next/link"
import { AlignmentType, Document, Packer, Paragraph, TextRun } from "docx"
import { ArrowRight, Download, FileText, Languages, Loader2, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GenericFileDropzone } from "@/components/tools/generic-file-dropzone"
import { CopyButton } from "@/components/tools/copy-button"
import { usePdfJs } from "@/lib/use-pdfjs"
import { extractTextFromFile } from "@/lib/ai-file-text-extract"
import { AUTO_DETECT, TRANSLATE_LANGUAGES, findTranslateLanguage } from "@/lib/translate-languages"

type Status =
    | { kind: "idle" }
    | { kind: "extracting" }
    | { kind: "translating" }
    | { kind: "error"; message: string }
    | { kind: "too-long"; message: string }
    | { kind: "auth-required" }
    | { kind: "quota-exceeded"; message: string }

const TOOL_PATH = "/tools/ai-tools/document-translator"

function baseName(file: File | null) {
    return file ? file.name.replace(/\.[^.]+$/, "") : "document"
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function escapeHtml(value: string) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

export function DocumentTranslatorTool() {
    const { pdfjsLib } = usePdfJs()
    const [file, setFile] = useState<File | null>(null)
    const [sourceText, setSourceText] = useState("")
    const [sourceLanguage, setSourceLanguage] = useState(AUTO_DETECT)
    const [targetLanguage, setTargetLanguage] = useState("hi")
    const [status, setStatus] = useState<Status>({ kind: "idle" })
    const [translation, setTranslation] = useState("")
    const [translatedTo, setTranslatedTo] = useState(targetLanguage)

    const isRtl = Boolean(findTranslateLanguage(translatedTo)?.rtl)
    const isBusy = status.kind === "extracting" || status.kind === "translating"

    async function handleFileSelect(nextFile: File) {
        setFile(nextFile)
        setTranslation("")
        setSourceText("")
        setStatus({ kind: "extracting" })

        try {
            const text = await extractTextFromFile(nextFile, pdfjsLib, { preserveLines: true })
            setSourceText(text.trim())
            setStatus({ kind: "idle" })
        } catch (err) {
            setStatus({ kind: "error", message: err instanceof Error ? err.message : "Could not read this file." })
        }
    }

    async function handleTranslate() {
        if (!sourceText.trim()) return
        setStatus({ kind: "translating" })
        setTranslation("")

        try {
            const res = await fetch("/api/ai/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({ text: sourceText, sourceLanguage, targetLanguage }),
            })
            const data = await res.json().catch(() => null)

            if (res.status === 401) return setStatus({ kind: "auth-required" })
            if (res.status === 429) {
                return setStatus({ kind: "quota-exceeded", message: data?.error || "Daily AI limit reached." })
            }
            if (res.status === 413) {
                return setStatus({ kind: "too-long", message: data?.error || "This document is too long." })
            }
            if (!res.ok || !data?.ok || typeof data?.result?.translation !== "string") {
                return setStatus({ kind: "error", message: data?.error || "AI translation failed. Please try again." })
            }

            setTranslation(data.result.translation)
            setTranslatedTo(targetLanguage)
            setStatus({ kind: "idle" })
        } catch {
            setStatus({ kind: "error", message: "AI translation failed. Please try again." })
        }
    }

    function handleClear() {
        setFile(null)
        setSourceText("")
        setTranslation("")
        setStatus({ kind: "idle" })
    }

    async function downloadDocx() {
        const doc = new Document({
            sections: [
                {
                    children: translation.split("\n").map(
                        (line) =>
                            new Paragraph({
                                bidirectional: isRtl,
                                alignment: isRtl ? AlignmentType.RIGHT : AlignmentType.LEFT,
                                children: [new TextRun({ text: line, rightToLeft: isRtl })],
                            })
                    ),
                },
            ],
        })
        downloadBlob(await Packer.toBlob(doc), `${baseName(file)}-${translatedTo}.docx`)
    }

    function downloadTxt() {
        downloadBlob(new Blob([translation], { type: "text/plain;charset=utf-8" }), `${baseName(file)}-${translatedTo}.txt`)
    }

    /** Prints through the browser so every script (Devanagari, Arabic, CJK…) renders with system fonts. */
    function printPdf() {
        const iframe = document.createElement("iframe")
        iframe.style.position = "fixed"
        iframe.style.width = "0"
        iframe.style.height = "0"
        iframe.style.border = "0"
        document.body.appendChild(iframe)

        const doc = iframe.contentDocument
        if (!doc) return
        doc.open()
        doc.write(
            `<!doctype html><html lang="${translatedTo}" dir="${isRtl ? "rtl" : "ltr"}"><head><meta charset="utf-8">` +
                `<title>${escapeHtml(baseName(file))} (${escapeHtml(translatedTo)})</title>` +
                "<style>@page{margin:18mm}body{font:12pt/1.6 system-ui,sans-serif;color:#111;white-space:pre-wrap;word-wrap:break-word}</style>" +
                `</head><body>${escapeHtml(translation)}</body></html>`
        )
        doc.close()

        const win = iframe.contentWindow
        if (!win) return
        win.onafterprint = () => iframe.remove()
        setTimeout(() => {
            win.focus()
            win.print()
            // Fallback cleanup for browsers that don't fire afterprint.
            setTimeout(() => iframe.remove(), 60_000)
        }, 100)
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">AI Document Translator</h2>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Translate a PDF, DOCX, or TXT file into 35+ languages, including Hindi, Tamil, Bengali and more.
                Download the result as Word, PDF, or text.
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

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">From</p>
                    <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                        <SelectTrigger className="w-full rounded-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={AUTO_DETECT}>Detect automatically</SelectItem>
                            {TRANSLATE_LANGUAGES.map((lang) => (
                                <SelectItem key={lang.code} value={lang.code}>
                                    {lang.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <ArrowRight className="mx-auto hidden h-4 w-4 shrink-0 text-muted-foreground sm:mb-3 sm:block" />

                <div className="flex-1 space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">To</p>
                    <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                        <SelectTrigger className="w-full rounded-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {TRANSLATE_LANGUAGES.map((lang) => (
                                <SelectItem key={lang.code} value={lang.code}>
                                    {lang.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button
                    type="button"
                    className="rounded-full sm:w-auto"
                    disabled={!sourceText || isBusy || sourceLanguage === targetLanguage}
                    onClick={handleTranslate}
                >
                    {status.kind === "translating" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Languages className="h-4 w-4" />
                    )}
                    Translate
                </Button>
            </div>

            {sourceText && (
                <p className="mt-2 text-xs text-muted-foreground">
                    {sourceText.length.toLocaleString()} characters ready to translate.
                    {sourceLanguage === targetLanguage && " Pick a different target language."}
                </p>
            )}

            {status.kind === "extracting" && (
                <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Reading document...
                </p>
            )}

            {status.kind === "translating" && (
                <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Translating with AI... long documents can take up to a minute.
                </p>
            )}

            {status.kind === "auth-required" && (
                <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
                    <Link href={`/login?callbackUrl=${TOOL_PATH}`} className="underline">
                        Sign in
                    </Link>{" "}
                    to translate documents with AI.
                </p>
            )}

            {(status.kind === "quota-exceeded" || status.kind === "too-long") && (
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
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            onClick={() => (sourceText ? handleTranslate() : handleFileSelect(file))}
                        >
                            Try again
                        </Button>
                    )}
                </div>
            )}

            {translation && !isBusy && (
                <div className="mt-6 space-y-3 rounded-2xl border border-border/60 bg-muted/30 p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                            <Languages className="h-4 w-4" />
                            {findTranslateLanguage(translatedTo)?.label ?? "Translation"}
                        </div>
                        <CopyButton value={translation} label="Copy" variant="ghost" className="sm:w-auto" />
                    </div>

                    <Textarea
                        value={translation}
                        onChange={(e) => setTranslation(e.target.value)}
                        dir={isRtl ? "rtl" : "ltr"}
                        lang={translatedTo}
                        className="min-h-72 bg-background text-sm leading-6"
                    />

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button type="button" className="rounded-full" onClick={downloadDocx}>
                            <Download className="h-4 w-4" />
                            Download Word (.docx)
                        </Button>
                        <Button type="button" variant="outline" className="rounded-full" onClick={printPdf}>
                            <Printer className="h-4 w-4" />
                            Save as PDF
                        </Button>
                        <Button type="button" variant="outline" className="rounded-full" onClick={downloadTxt}>
                            <Download className="h-4 w-4" />
                            Download .txt
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        AI translations can contain mistakes. Review important documents before sharing them.
                    </p>
                </div>
            )}
        </div>
    )
}
