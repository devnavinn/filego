"use client"

import { useState } from "react"
import { PDFDocument } from "@cantoo/pdf-lib"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PdfDropzone } from "@/components/tools/pdf-dropzone"
import { PdfPageThumbnails } from "@/components/tools/pdf-page-thumbnails"
import { downloadBlob, pdfBytesToBlob, replaceExtension } from "@/lib/pdf-tool-utils"

export function PdfDeletePagesTool() {
    const [file, setFile] = useState<File | null>(null)
    const [pageCount, setPageCount] = useState(0)
    const [pagesToDelete, setPagesToDelete] = useState<Set<number>>(new Set())
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function handleClear() {
        setFile(null)
        setPageCount(0)
        setPagesToDelete(new Set())
        setError(null)
    }

    function togglePage(pageIndex: number) {
        setPagesToDelete((prev) => {
            const next = new Set(prev)
            if (next.has(pageIndex)) next.delete(pageIndex)
            else next.add(pageIndex)
            return next
        })
    }

    async function handleSave() {
        if (!file) return

        if (pagesToDelete.size >= pageCount) {
            setError("You can't delete every page in the document.")
            return
        }

        setIsSaving(true)
        setError(null)

        try {
            const bytes = await file.arrayBuffer()
            const source = await PDFDocument.load(bytes)
            const keepIndices = source.getPageIndices().filter((i) => !pagesToDelete.has(i))

            const doc = await PDFDocument.create()
            const pages = await doc.copyPages(source, keepIndices)
            pages.forEach((page) => doc.addPage(page))

            const output = await doc.save()
            downloadBlob(pdfBytesToBlob(output), replaceExtension(file.name, "pdf"))
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not update this PDF. Make sure it isn't password protected.")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Delete PDF Pages</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Select the pages you want removed, then download the updated PDF.
            </p>

            <div className="mt-6 space-y-4">
                <PdfDropzone
                    onFileSelect={(f) => {
                        setFile(f)
                        setPagesToDelete(new Set())
                        setError(null)
                    }}
                    file={file}
                    onClear={handleClear}
                />

                {file && (
                    <>
                        <p className="text-xs text-muted-foreground">
                            Click the pages to delete — {pagesToDelete.size} of {pageCount} selected.
                        </p>

                        <PdfPageThumbnails
                            file={file}
                            onPageCount={setPageCount}
                            selectedPages={pagesToDelete}
                            onToggle={togglePage}
                        />

                        {error && <p className="text-sm text-destructive">{error}</p>}

                        <Button
                            type="button"
                            variant="destructive"
                            className="w-full rounded-full sm:w-auto"
                            onClick={handleSave}
                            disabled={isSaving || pagesToDelete.size === 0}
                        >
                            <Trash2 />
                            {isSaving ? "Saving..." : `Delete ${pagesToDelete.size || ""} pages`}
                        </Button>
                    </>
                )}
            </div>
        </div>
    )
}
