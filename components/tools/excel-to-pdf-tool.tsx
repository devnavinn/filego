"use client"

import { useState } from "react"
import { Workbook } from "exceljs"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Download, FileSpreadsheet } from "lucide-react"

import { Button } from "@/components/ui/button"
import { GenericFileDropzone } from "@/components/tools/generic-file-dropzone"
import { ToolSegmentedControl } from "@/components/tools/tool-segmented-control"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { downloadBlob, replaceExtension } from "@/lib/pdf-tool-utils"

type Orientation = "portrait" | "landscape"

function cellToString(value: unknown): string {
    if (value === null || value === undefined) return ""
    if (typeof value === "object" && "text" in (value as Record<string, unknown>)) {
        return String((value as { text: unknown }).text ?? "")
    }
    if (typeof value === "object" && "result" in (value as Record<string, unknown>)) {
        return String((value as { result: unknown }).result ?? "")
    }
    if (value instanceof Date) return value.toISOString().slice(0, 10)
    return String(value)
}

function sheetToRows(wb: Workbook, sheetName: string): string[][] {
    const worksheet = wb.getWorksheet(sheetName)
    if (!worksheet) return []

    const rows: string[][] = []
    worksheet.eachRow({ includeEmpty: true }, (row) => {
        const values = (row.values as unknown[]).slice(1)
        rows.push(values.map(cellToString))
    })

    return rows
}

export function ExcelToPdfTool() {
    const [file, setFile] = useState<File | null>(null)
    const [workbook, setWorkbook] = useState<Workbook | null>(null)
    const [sheetNames, setSheetNames] = useState<string[]>([])
    const [selectedSheet, setSelectedSheet] = useState("")
    const [preview, setPreview] = useState<string[][]>([])
    const [orientation, setOrientation] = useState<Orientation>("portrait")
    const [isLoading, setIsLoading] = useState(false)
    const [isConverting, setIsConverting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function handleClear() {
        setFile(null)
        setWorkbook(null)
        setSheetNames([])
        setSelectedSheet("")
        setPreview([])
        setError(null)
    }

    async function handleFileSelect(next: File) {
        setFile(next)
        setError(null)
        setIsLoading(true)
        setPreview([])

        try {
            const buffer = await next.arrayBuffer()
            const wb = new Workbook()
            await wb.xlsx.load(buffer)

            const names = wb.worksheets.map((ws) => ws.name)
            setWorkbook(wb)
            setSheetNames(names)
            const firstSheet = names[0] ?? ""
            setSelectedSheet(firstSheet)
            if (firstSheet) setPreview(sheetToRows(wb, firstSheet).slice(0, 8))
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not read this Excel file.")
        } finally {
            setIsLoading(false)
        }
    }

    function handleSheetChange(sheetName: string) {
        setSelectedSheet(sheetName)
        if (workbook) setPreview(sheetToRows(workbook, sheetName).slice(0, 8))
    }

    async function handleDownload() {
        if (!file || !workbook || !selectedSheet) return
        setIsConverting(true)
        setError(null)

        try {
            const rows = sheetToRows(workbook, selectedSheet)
            if (rows.length === 0) throw new Error("This sheet has no data to export.")

            const [head, ...body] = rows
            const doc = new jsPDF({ orientation, unit: "pt", format: "a4" })

            autoTable(doc, {
                head: [head],
                body,
                styles: { fontSize: 8, cellPadding: 4 },
                headStyles: { fillColor: [30, 30, 30] },
                margin: { top: 32, left: 24, right: 24, bottom: 24 },
            })

            const blob = doc.output("blob")
            downloadBlob(blob, replaceExtension(file.name, "pdf"))
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not convert this sheet to PDF.")
        } finally {
            setIsConverting(false)
        }
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">Excel to PDF</h2>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Convert an Excel sheet into a clean, paginated PDF table, right in your browser.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                    <GenericFileDropzone
                        onFileSelect={handleFileSelect}
                        file={file}
                        onClear={handleClear}
                        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        hint="Click to upload or drag & drop a .xlsx file"
                        icon={FileSpreadsheet}
                    />

                    {isLoading && <p className="text-sm text-muted-foreground">Reading workbook...</p>}
                    {error && <p className="text-sm text-destructive">{error}</p>}

                    {sheetNames.length > 1 && (
                        <div className="space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground">Sheet</p>
                            <Select value={selectedSheet} onValueChange={handleSheetChange}>
                                <SelectTrigger className="w-full rounded-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {sheetNames.map((name) => (
                                        <SelectItem key={name} value={name}>
                                            {name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {file && (
                        <div className="space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground">Page orientation</p>
                            <ToolSegmentedControl
                                value={orientation}
                                onChange={setOrientation}
                                options={[
                                    { value: "portrait", label: "Portrait" },
                                    { value: "landscape", label: "Landscape" },
                                ]}
                            />
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <p className="text-sm font-medium">Preview</p>
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
                            <p className="text-sm text-muted-foreground">Upload an Excel file to preview its data.</p>
                        )}
                    </div>
                    <Button
                        type="button"
                        className="w-full rounded-full sm:w-auto"
                        onClick={handleDownload}
                        disabled={!file || isConverting}
                    >
                        <Download />
                        {isConverting ? "Converting..." : "Download PDF"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
