"use client"

import { useState } from "react"
import { PDFDocument } from "@cantoo/pdf-lib"
import { FileOutput } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PdfDropzone } from "@/components/tools/pdf-dropzone"
import { PdfPageThumbnails } from "@/components/tools/pdf-page-thumbnails"
import { downloadBlob, pdfBytesToBlob, replaceExtension } from "@/lib/pdf-tool-utils"

export function PdfExtractPagesTool() {
    const [file, setFile] = useState<File | null>(null)
    const [pageCount, setPageCount] = useState(0)
    const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set())
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function handleClear() {
        setFile(null)
        setPageCount(0)
        setSelectedPages(new Set())
        setError(null)
    }

    function togglePage(pageIndex: number) {
        setSelectedPages((prev) => {
            const next = new Set(prev)
            if (next.has(pageIndex)) next.delete(pageIndex)
            else next.add(pageIndex)
            return next
        })
    }

    async function handleSave() {
        if (!file || selectedPages.size === 0) return
        setIsSaving(true)
        setError(null)

        try {
            const bytes = await file.arrayBuffer()
            const source = await PDFDocument.load(bytes)
            const keepIndices = Array.from(selectedPages).sort((a, b) => a - b)

            const doc = await PDFDocument.create()
            const pages = await doc.copyPages(source, keepIndices)
            pages.forEach((page) => doc.addPage(page))

            const output = await doc.save()
            downloadBlob(pdfBytesToBlob(output), replaceExtension(file.name, "pdf"))
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not read this PDF. Make sure it isn't password protected.")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Extract PDF Pages</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Select the pages you want to keep and export them as a new PDF.
            </p>

            <div className="mt-6 space-y-4">
                <PdfDropzone
                    onFileSelect={(f) => {
                        setFile(f)
                        setSelectedPages(new Set())
                        setError(null)
                    }}
                    file={file}
                    onClear={handleClear}
                />

                {file && (
                    <>
                        <p className="text-xs text-muted-foreground">
                            Click the pages to keep — {selectedPages.size} of {pageCount} selected.
                        </p>

                        <PdfPageThumbnails
                            file={file}
                            onPageCount={setPageCount}
                            selectedPages={selectedPages}
                            onToggle={togglePage}
                        />

                        {error && <p className="text-sm text-destructive">{error}</p>}

                        <Button
                            type="button"
                            className="w-full rounded-full sm:w-auto"
                            onClick={handleSave}
                            disabled={isSaving || selectedPages.size === 0}
                        >
                            <FileOutput />
                            {isSaving ? "Extracting..." : `Extract ${selectedPages.size || ""} pages`}
                        </Button>
                    </>
                )}
            </div>
        </div>
    )
}
