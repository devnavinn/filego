"use client"

import { useState } from "react"
import { Workbook } from "exceljs"
import { Download, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { GenericFileDropzone } from "@/components/tools/generic-file-dropzone"
import { usePdfJs, type PdfJsTextItem } from "@/lib/use-pdfjs"
import { downloadBlob, replaceExtension } from "@/lib/pdf-tool-utils"

type Row = { y: number; items: PdfJsTextItem[] }

/**
 * Reconstructs a rough table grid from a PDF page's positioned text items.
 * Items are grouped into rows by Y position, then split into cells wherever
 * the horizontal gap between items is wide enough to suggest a column break
 * rather than a normal word space. This is a best-effort heuristic — it works
 * well on simple, clearly-delineated tables and less well on complex layouts.
 */
function itemsToGrid(items: PdfJsTextItem[]): string[][] {
    const rows: Row[] = []
    const rowTolerance = 4

    for (const item of items) {
        if (!item.str.trim()) continue
        const y = item.transform[5]
        const row = rows.find((r) => Math.abs(r.y - y) <= rowTolerance)
        if (row) {
            row.items.push(item)
        } else {
            rows.push({ y, items: [item] })
        }
    }

    rows.sort((a, b) => b.y - a.y)

    return rows.map((row) => {
        const sorted = [...row.items].sort((a, b) => a.transform[4] - b.transform[4])
        const cells: string[] = []
        let current = ""
        let previousEnd: number | null = null

        for (const item of sorted) {
            const start = item.transform[4]
            const gapThreshold = Math.max(item.height * 2.2, 6)

            if (previousEnd !== null && start - previousEnd > gapThreshold) {
                cells.push(current.trim())
                current = item.str
            } else {
                current = current ? `${current} ${item.str}` : item.str
            }

            previousEnd = start + item.width
        }

        if (current.trim()) cells.push(current.trim())
        return cells
    })
}

export function PdfToExcelTool() {
    const { pdfjsLib } = usePdfJs()
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string[][]>([])
    const [pageCount, setPageCount] = useState(0)
    const [workbookBlob, setWorkbookBlob] = useState<Blob | null>(null)
    const [isConverting, setIsConverting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function handleClear() {
        setFile(null)
        setPreview([])
        setPageCount(0)
        setWorkbookBlob(null)
        setError(null)
    }

    async function handleFileSelect(next: File) {
        if (!pdfjsLib) {
            setError("The PDF engine is still loading. Try again in a moment.")
            return
        }

        setFile(next)
        setError(null)
        setPreview([])
        setWorkbookBlob(null)
        setIsConverting(true)

        try {
            const buffer = new Uint8Array(await next.arrayBuffer())
            const doc = await pdfjsLib.getDocument({ data: buffer }).promise
            setPageCount(doc.numPages)

            const workbook = new Workbook()

            for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
                const page = await doc.getPage(pageNumber)
                const content = await page.getTextContent()
                const grid = itemsToGrid(content.items)

                const worksheet = workbook.addWorksheet(`Page ${pageNumber}`)
                if (grid.length > 0) {
                    worksheet.addRows(grid)
                    worksheet.getRow(1).font = { bold: true }
                }

                if (pageNumber === 1) setPreview(grid.slice(0, 8))
            }

            if (workbook.worksheets.every((ws) => ws.rowCount === 0)) {
                throw new Error("No readable text found in this PDF. Scanned/image-only PDFs aren't supported yet.")
            }

            const buffer2 = await workbook.xlsx.writeBuffer()
            setWorkbookBlob(
                new Blob([buffer2], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
            )
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not read this PDF.")
        } finally {
            setIsConverting(false)
        }
    }

    function handleDownload() {
        if (!workbookBlob || !file) return
        downloadBlob(workbookBlob, replaceExtension(file.name, "xlsx"))
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">PDF to Excel</h2>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Extract a PDF&rsquo;s text into an Excel workbook, one sheet per page, right in your browser.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                    <GenericFileDropzone
                        onFileSelect={handleFileSelect}
                        file={file}
                        onClear={handleClear}
                        accept=".pdf,application/pdf"
                        hint="Click to upload or drag & drop a PDF"
                        icon={FileText}
                    />

                    {isConverting && <p className="text-sm text-muted-foreground">Reading PDF...</p>}
                    {error && <p className="text-sm text-destructive">{error}</p>}

                    {pageCount > 0 && !error && (
                        <p className="text-xs text-muted-foreground">
                            {pageCount} {pageCount === 1 ? "page" : "pages"} converted, one worksheet per page.
                        </p>
                    )}
                </div>

                <div className="space-y-3">
                    <p className="text-sm font-medium">Preview (page 1)</p>
                    <div className="min-h-56 overflow-auto rounded-2xl border border-border/60 bg-muted/30 p-4">
                        {preview.length > 0 ? (
                            <table className="w-full text-left text-xs">
                                <tbody>
                                    {preview.map((row, i) => (
                                        <tr key={i} className={i === 0 ? "font-medium" : ""}>
                                            {row.map((cell, j) => (
                                                <td key={j} className="border-b border-border/50 px-2 py-1.5 whitespace-nowrap">
                                                    {cell}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-sm text-muted-foreground">Upload a PDF to preview its extracted data.</p>
                        )}
                    </div>
                    <Button
                        type="button"
                        className="w-full rounded-full sm:w-auto"
                        onClick={handleDownload}
                        disabled={!workbookBlob}
                    >
                        <Download />
                        Download Excel file
                    </Button>
                </div>
            </div>
        </div>
    )
}
