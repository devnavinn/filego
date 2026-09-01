"use client"

import { useState } from "react"
import { PDFDocument, rgb, StandardFonts } from "@cantoo/pdf-lib"
import { Hash } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PdfDropzone } from "@/components/tools/pdf-dropzone"
import { ToolSegmentedControl } from "@/components/tools/tool-segmented-control"
import { downloadBlob, pdfBytesToBlob, replaceExtension } from "@/lib/pdf-tool-utils"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type Position = "bottom-center" | "bottom-right" | "bottom-left" | "top-center" | "top-right" | "top-left"
type Format = "number" | "page-of" | "page-of-total"

const POSITIONS: { value: Position; label: string }[] = [
    { value: "bottom-center", label: "Bottom center" },
    { value: "bottom-right", label: "Bottom right" },
    { value: "bottom-left", label: "Bottom left" },
    { value: "top-center", label: "Top center" },
    { value: "top-right", label: "Top right" },
    { value: "top-left", label: "Top left" },
]

function formatLabel(format: Format, page: number, total: number) {
    if (format === "page-of") return `Page ${page}`
    if (format === "page-of-total") return `Page ${page} of ${total}`
    return String(page)
}

export function PdfPageNumberingTool() {
    const [file, setFile] = useState<File | null>(null)
    const [startAt, setStartAt] = useState(1)
    const [position, setPosition] = useState<Position>("bottom-center")
    const [format, setFormat] = useState<Format>("page-of-total")
    const [fontSize, setFontSize] = useState<"10" | "12" | "16">("12")
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function handleClear() {
        setFile(null)
        setError(null)
    }

    async function handleSave() {
        if (!file) return
        setIsSaving(true)
        setError(null)

        try {
            const bytes = await file.arrayBuffer()
            const doc = await PDFDocument.load(bytes)
            const font = await doc.embedFont(StandardFonts.Helvetica)
            const size = Number(fontSize)
            const pages = doc.getPages()
            const totalWithOffset = pages.length + startAt - 1

            pages.forEach((page, index) => {
                const pageNumber = index + startAt
                const label = formatLabel(format, pageNumber, totalWithOffset)
                const textWidth = font.widthOfTextAtSize(label, size)
                const { width, height } = page.getSize()
                const margin = 24

                let x = width / 2 - textWidth / 2
                let y = margin

                if (position.startsWith("top")) y = height - margin
                if (position.endsWith("left")) x = margin
                if (position.endsWith("right")) x = width - margin - textWidth

                page.drawText(label, { x, y, size, font, color: rgb(0.15, 0.15, 0.15) })
            })

            const output = await doc.save()
            downloadBlob(pdfBytesToBlob(output), replaceExtension(file.name, "pdf"))
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not number this PDF. Make sure it isn't password protected.")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">PDF Page Numbering</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Add page numbers to every page of your PDF, positioned where you like.
            </p>

            <div className="mt-6 space-y-4">
                <PdfDropzone onFileSelect={setFile} file={file} onClear={handleClear} />

                {file && (
                    <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/30 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                            <div className="flex-1 space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">Position</p>
                                <Select value={position} onValueChange={(v) => setPosition(v as Position)}>
                                    <SelectTrigger className="w-full rounded-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {POSITIONS.map((p) => (
                                            <SelectItem key={p.value} value={p.value}>
                                                {p.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex-1 space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">Format</p>
                                <Select value={format} onValueChange={(v) => setFormat(v as Format)}>
                                    <SelectTrigger className="w-full rounded-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="number">1</SelectItem>
                                        <SelectItem value="page-of">Page 1</SelectItem>
                                        <SelectItem value="page-of-total">Page 1 of N</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">Start at</p>
                                <Input
                                    type="number"
                                    min={1}
                                    value={startAt}
                                    onChange={(e) => setStartAt(Math.max(1, Number(e.target.value)))}
                                    className="h-9 w-24 rounded-xl"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">Font size</p>
                                <ToolSegmentedControl
                                    value={fontSize}
                                    onChange={setFontSize}
                                    options={[
                                        { value: "10", label: "10pt" },
                                        { value: "12", label: "12pt" },
                                        { value: "16", label: "16pt" },
                                    ]}
                                />
                            </div>
                        </div>

                        {error && <p className="text-sm text-destructive">{error}</p>}

                        <Button type="button" className="w-full rounded-full sm:w-auto" onClick={handleSave} disabled={isSaving}>
                            <Hash />
                            {isSaving ? "Adding numbers..." : "Add page numbers"}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
