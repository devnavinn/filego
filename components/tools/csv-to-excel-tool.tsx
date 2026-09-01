"use client"

import { useState } from "react"
import { Workbook } from "exceljs"
import Papa from "papaparse"
import { FileSpreadsheet, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { GenericFileDropzone } from "@/components/tools/generic-file-dropzone"
import { downloadBlob, replaceExtension } from "@/lib/pdf-tool-utils"

export function CsvToExcelTool() {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string[][]>([])
    const [isConverting, setIsConverting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function handleClear() {
        setFile(null)
        setPreview([])
        setError(null)
    }

    async function handleFileSelect(next: File) {
        setFile(next)
        setError(null)
        setPreview([])

        try {
            const text = await next.text()
            const result = Papa.parse<string[]>(text, { skipEmptyLines: true })
            if (result.errors.length > 0) {
                setError(result.errors[0].message)
                return
            }
            setPreview(result.data.slice(0, 8))
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not read this CSV file.")
        }
    }

    async function handleDownload() {
        if (!file) return
        setIsConverting(true)
        setError(null)

        try {
            const text = await file.text()
            const result = Papa.parse<string[]>(text, { skipEmptyLines: true })
            if (result.errors.length > 0) throw new Error(result.errors[0].message)

            const workbook = new Workbook()
            const worksheet = workbook.addWorksheet("Sheet1")
            worksheet.addRows(result.data)
            if (result.data.length > 0) worksheet.getRow(1).font = { bold: true }

            const buffer = await workbook.xlsx.writeBuffer()
            downloadBlob(
                new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
                replaceExtension(file.name, "xlsx")
            )
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not convert this CSV file.")
        } finally {
            setIsConverting(false)
        }
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">CSV to Excel</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Convert a CSV file into an Excel workbook, right in your browser.
            </p>

            <div className="mt-6 space-y-4">
                <GenericFileDropzone
                    onFileSelect={handleFileSelect}
                    file={file}
                    onClear={handleClear}
                    accept=".csv,text/csv"
                    hint="Click to upload or drag & drop a .csv file"
                    icon={FileSpreadsheet}
                />

                {error && <p className="text-sm text-destructive">{error}</p>}

                {preview.length > 0 && (
                    <div className="overflow-x-auto rounded-2xl border border-border/60 bg-muted/30 p-4">
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
                    </div>
                )}

                <Button
                    type="button"
                    className="w-full rounded-full sm:w-auto"
                    onClick={handleDownload}
                    disabled={!file || isConverting}
                >
                    <Download />
                    {isConverting ? "Converting..." : "Download Excel file"}
                </Button>
            </div>
        </div>
    )
}
