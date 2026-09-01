"use client"

import { useRef, useState } from "react"
import { PDFDocument } from "@cantoo/pdf-lib"
import { ArrowDown, ArrowUp, Combine, Download, FileText, Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatBytes } from "@/lib/image-utils"
import { downloadBlob, pdfBytesToBlob } from "@/lib/pdf-tool-utils"

type FileEntry = { id: string; file: File }

export function PdfMergeTool() {
    const [entries, setEntries] = useState<FileEntry[]>([])
    const [isMerging, setIsMerging] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement | null>(null)

    function addFiles(fileList: FileList | null) {
        const files = Array.from(fileList ?? []).filter((f) => f.type === "application/pdf")
        if (files.length === 0) return
        setError(null)
        setEntries((prev) => [...prev, ...files.map((file) => ({ id: crypto.randomUUID(), file }))])
    }

    function removeEntry(id: string) {
        setEntries((prev) => prev.filter((entry) => entry.id !== id))
    }

    function moveEntry(index: number, direction: -1 | 1) {
        setEntries((prev) => {
            const next = [...prev]
            const target = index + direction
            if (target < 0 || target >= next.length) return prev
            ;[next[index], next[target]] = [next[target], next[index]]
            return next
        })
    }

    async function handleMerge() {
        if (entries.length < 2) return
        setIsMerging(true)
        setError(null)

        try {
            const merged = await PDFDocument.create()

            for (const entry of entries) {
                const bytes = await entry.file.arrayBuffer()
                const doc = await PDFDocument.load(bytes)
                const pages = await merged.copyPages(doc, doc.getPageIndices())
                pages.forEach((page) => merged.addPage(page))
            }

            const bytes = await merged.save()
            downloadBlob(pdfBytesToBlob(bytes), "merged.pdf")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not merge these PDFs. Make sure they aren't password protected.")
        } finally {
            setIsMerging(false)
        }
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Merge PDF</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Combine two or more PDF files into one document, in the order you choose.
            </p>

            <div className="mt-6 space-y-4">
                <div
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault()
                        addFiles(e.dataTransfer.files)
                    }}
                    role="button"
                    tabIndex={0}
                    className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-border/60 bg-muted/30 p-6 text-center transition-colors hover:bg-muted/50 sm:p-8"
                >
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <p className="text-sm font-medium">Click to add PDFs or drag & drop</p>
                    <p className="text-xs text-muted-foreground">Add at least 2 files</p>
                    <input
                        ref={inputRef}
                        type="file"
                        accept="application/pdf"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                            addFiles(e.target.files)
                            e.target.value = ""
                        }}
                    />
                </div>

                {entries.length > 0 && (
                    <div className="space-y-2">
                        {entries.map((entry, index) => (
                            <div
                                key={entry.id}
                                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-2"
                            >
                                <div className="flex min-w-0 items-center gap-2.5">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background text-xs font-medium">
                                        {index + 1}
                                    </span>
                                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-medium">{entry.file.name}</p>
                                        <p className="text-[11px] text-muted-foreground">{formatBytes(entry.file.size)}</p>
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        className="rounded-full"
                                        onClick={() => moveEntry(index, -1)}
                                        disabled={index === 0}
                                    >
                                        <ArrowUp />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        className="rounded-full"
                                        onClick={() => moveEntry(index, 1)}
                                        disabled={index === entries.length - 1}
                                    >
                                        <ArrowDown />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        className="rounded-full"
                                        onClick={() => removeEntry(entry.id)}
                                    >
                                        <X />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button
                    type="button"
                    className="w-full rounded-full sm:w-auto"
                    onClick={handleMerge}
                    disabled={entries.length < 2 || isMerging}
                >
                    <Combine />
                    {isMerging ? "Merging..." : `Merge ${entries.length || ""} PDFs`}
                </Button>

                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Download className="h-3.5 w-3.5" />
                    The merged file downloads automatically once ready.
                </p>
            </div>
        </div>
    )
}
