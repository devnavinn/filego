"use client"

import { useState } from "react"
import { Workbook } from "exceljs"
import Papa from "papaparse"
import { FileSpreadsheet, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { GenericFileDropzone } from "@/components/tools/generic-file-dropzone"
import { CopyButton } from "@/components/tools/copy-button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { downloadBlob, replaceExtension } from "@/lib/pdf-tool-utils"

function cellToString(value: unknown): string {
    if (value === null || value === undefined) return ""
    if (typeof value === "object" && "text" in (value as Record<string, unknown>)) {
        return String((value as { text: unknown }).text ?? "")
    }
    if (typeof value === "object" && "result" in (value as Record<string, unknown>)) {
        return String((value as { result: unknown }).result ?? "")
    }
    if (value instanceof Date) return value.toISOString()
    return String(value)
}

export function ExcelToCsvTool() {
    const [file, setFile] = useState<File | null>(null)
    const [sheetNames, setSheetNames] = useState<string[]>([])
    const [selectedSheet, setSelectedSheet] = useState("")
    const [workbook, setWorkbook] = useState<Workbook | null>(null)
    const [csv, setCsv] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function handleClear() {
        setFile(null)
        setSheetNames([])
        setSelectedSheet("")
        setWorkbook(null)
        setCsv("")
        setError(null)
    }

    function convertSheet(wb: Workbook, sheetName: string) {
        const worksheet = wb.getWorksheet(sheetName)
        if (!worksheet) return ""

        const rows: string[][] = []
        worksheet.eachRow({ includeEmpty: true }, (row) => {
            const values = (row.values as unknown[]).slice(1)
            rows.push(values.map(cellToString))
        })

        return Papa.unparse(rows)
    }

    async function handleFileSelect(next: File) {
        setFile(next)
        setError(null)
        setIsLoading(true)
        setCsv("")

        try {
            const buffer = await next.arrayBuffer()
            const wb = new Workbook()
            await wb.xlsx.load(buffer)

            const names = wb.worksheets.map((ws) => ws.name)
            setWorkbook(wb)
            setSheetNames(names)
            const firstSheet = names[0] ?? ""
            setSelectedSheet(firstSheet)
            if (firstSheet) setCsv(convertSheet(wb, firstSheet))
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not read this Excel file.")
        } finally {
            setIsLoading(false)
        }
    }

    function handleSheetChange(sheetName: string) {
        setSelectedSheet(sheetName)
        if (workbook) setCsv(convertSheet(workbook, sheetName))
    }

    function handleDownload() {
        if (!csv || !file) return
        downloadBlob(new Blob([csv], { type: "text/csv" }), replaceExtension(file.name, "csv"))
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Excel to CSV</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Convert an Excel sheet into a CSV file, right in your browser.
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
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">CSV preview</p>
                        <CopyButton value={csv} label="Copy" variant="ghost" className="sm:w-auto" />
                    </div>
                    <div className="min-h-56 overflow-auto rounded-2xl border border-border/60 bg-muted/30 p-4">
                        <pre className="font-mono text-xs whitespace-pre text-muted-foreground">
                            {csv || "CSV output will appear here."}
                        </pre>
                    </div>
                    <Button type="button" className="w-full rounded-full sm:w-auto" onClick={handleDownload} disabled={!csv}>
                        <Download />
                        Download CSV
                    </Button>
                </div>
            </div>
        </div>
    )
}
