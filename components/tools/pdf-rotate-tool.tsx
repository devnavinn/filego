"use client"

import { useState } from "react"
import { degrees, PDFDocument } from "@cantoo/pdf-lib"
import { RotateCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PdfDropzone } from "@/components/tools/pdf-dropzone"
import { PdfPageThumbnails } from "@/components/tools/pdf-page-thumbnails"
import { downloadBlob, pdfBytesToBlob, replaceExtension } from "@/lib/pdf-tool-utils"

export function PdfRotateTool() {
    const [file, setFile] = useState<File | null>(null)
    const [pageCount, setPageCount] = useState(0)
    const [rotations, setRotations] = useState<Record<number, number>>({})
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function handleClear() {
        setFile(null)
        setPageCount(0)
        setRotations({})
        setError(null)
    }

    function rotatePage(pageIndex: number) {
        setRotations((prev) => ({ ...prev, [pageIndex]: ((prev[pageIndex] ?? 0) + 90) % 360 }))
    }

    function rotateAll() {
        setRotations((prev) => {
            const next: Record<number, number> = { ...prev }
            for (let i = 0; i < pageCount; i++) {
                next[i] = ((prev[i] ?? 0) + 90) % 360
            }
            return next
        })
    }

    async function handleSave() {
        if (!file) return
        setIsSaving(true)
        setError(null)

        try {
            const bytes = await file.arrayBuffer()
            const doc = await PDFDocument.load(bytes)
            const pages = doc.getPages()

            pages.forEach((page, index) => {
                const delta = rotations[index] ?? 0
                if (delta === 0) return
                const current = page.getRotation().angle
                page.setRotation(degrees((current + delta) % 360))
            })

            const output = await doc.save()
            downloadBlob(pdfBytesToBlob(output), replaceExtension(file.name, "pdf"))
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not rotate this PDF. Make sure it isn't password protected.")
        } finally {
            setIsSaving(false)
        }
    }

    const hasRotations = Object.values(rotations).some((v) => v !== 0)

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Rotate PDF</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Rotate individual pages or the whole document, then download.
            </p>

            <div className="mt-6 space-y-4">
                <PdfDropzone
                    onFileSelect={(f) => {
                        setFile(f)
                        setRotations({})
                        setError(null)
                    }}
                    file={file}
                    onClear={handleClear}
                />

                {file && (
                    <>
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                                Click a page to rotate it, or rotate every page at once.
                            </p>
                            <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={rotateAll}>
                                <RotateCw />
                                Rotate all 90°
                            </Button>
                        </div>

                        <PdfPageThumbnails
                            file={file}
                            onPageCount={setPageCount}
                            rotations={rotations}
                            onRotate={rotatePage}
                        />

                        {error && <p className="text-sm text-destructive">{error}</p>}

                        <Button
                            type="button"
                            className="w-full rounded-full sm:w-auto"
                            onClick={handleSave}
                            disabled={isSaving || !hasRotations}
                        >
                            <RotateCw />
                            {isSaving ? "Saving..." : "Save rotated PDF"}
                        </Button>
                    </>
                )}
            </div>
        </div>
    )
}
