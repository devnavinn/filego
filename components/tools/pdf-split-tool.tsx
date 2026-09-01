"use client"

import { useState } from "react"
import { PDFDocument } from "@cantoo/pdf-lib"
import JSZip from "jszip"
import { Scissors } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PdfDropzone } from "@/components/tools/pdf-dropzone"
import { PdfPageThumbnails } from "@/components/tools/pdf-page-thumbnails"
import { downloadBlob, pdfBytesToBlob } from "@/lib/pdf-tool-utils"

function parseGroups(input: string, pageCount: number): number[][] {
    const groups: number[][] = []

    for (const rawGroup of input.split(",")) {
        const part = rawGroup.trim()
        if (!part) continue

        const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/)
        if (rangeMatch) {
            let start = Number(rangeMatch[1])
            let end = Number(rangeMatch[2])
            if (start > end) [start, end] = [end, start]

            const pages: number[] = []
            for (let page = start; page <= end; page++) {
                if (page >= 1 && page <= pageCount) pages.push(page - 1)
            }
            if (pages.length > 0) groups.push(pages)
            continue
        }

        const single = Number(part)
        if (Number.isInteger(single) && single >= 1 && single <= pageCount) {
            groups.push([single - 1])
        }
    }

    return groups
}

export function PdfSplitTool() {
    const [file, setFile] = useState<File | null>(null)
    const [pageCount, setPageCount] = useState(0)
    const [ranges, setRanges] = useState("")
    const [isSplitting, setIsSplitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function handleClear() {
        setFile(null)
        setPageCount(0)
        setRanges("")
        setError(null)
    }

    function splitEveryPage() {
        setRanges(Array.from({ length: pageCount }, (_, i) => i + 1).join(","))
    }

    async function handleSplit() {
        if (!file) return
        const groups = parseGroups(ranges, pageCount)
        if (groups.length === 0) {
            setError("Enter at least one valid page or range, e.g. 1-3, 5, 8-10")
            return
        }

        setIsSplitting(true)
        setError(null)

        try {
            const bytes = await file.arrayBuffer()
            const source = await PDFDocument.load(bytes)

            if (groups.length === 1) {
                const doc = await PDFDocument.create()
                const pages = await doc.copyPages(source, groups[0])
                pages.forEach((page) => doc.addPage(page))
                const output = await doc.save()
                downloadBlob(pdfBytesToBlob(output), "split.pdf")
            } else {
                const zip = new JSZip()

                for (let i = 0; i < groups.length; i++) {
                    const doc = await PDFDocument.create()
                    const pages = await doc.copyPages(source, groups[i])
                    pages.forEach((page) => doc.addPage(page))
                    const output = await doc.save()
                    zip.file(`split-${i + 1}.pdf`, output)
                }

                const blob = await zip.generateAsync({ type: "blob" })
                downloadBlob(blob, "split-pdfs.zip")
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not split this PDF. Make sure it isn't password protected.")
        } finally {
            setIsSplitting(false)
        }
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Split PDF</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Split a PDF into separate pages or custom page-range files.
            </p>

            <div className="mt-6 space-y-4">
                <PdfDropzone
                    onFileSelect={(f) => {
                        setFile(f)
                        setError(null)
                        setRanges("")
                    }}
                    file={file}
                    onClear={handleClear}
                />

                {file && (
                    <>
                        <PdfPageThumbnails file={file} onPageCount={setPageCount} />

                        <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/30 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Page ranges — each group becomes its own file
                                </p>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-full"
                                    onClick={splitEveryPage}
                                    disabled={pageCount === 0}
                                >
                                    Split every page
                                </Button>
                            </div>
                            <Input
                                value={ranges}
                                onChange={(e) => setRanges(e.target.value)}
                                placeholder="e.g. 1-3, 4-6, 7"
                                className="h-9 rounded-xl"
                            />
                        </div>

                        {error && <p className="text-sm text-destructive">{error}</p>}

                        <Button
                            type="button"
                            className="w-full rounded-full sm:w-auto"
                            onClick={handleSplit}
                            disabled={isSplitting || !ranges.trim()}
                        >
                            <Scissors />
                            {isSplitting ? "Splitting..." : "Split PDF"}
                        </Button>
                    </>
                )}
            </div>
        </div>
    )
}
