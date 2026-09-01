"use client"

import { useState } from "react"
import { degrees, PDFDocument, rgb, StandardFonts } from "@cantoo/pdf-lib"
import { Droplets } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { PdfDropzone } from "@/components/tools/pdf-dropzone"
import { downloadBlob, pdfBytesToBlob, replaceExtension } from "@/lib/pdf-tool-utils"

function hexToRgb(hex: string) {
    const parsed = hex.replace("#", "")
    const r = parseInt(parsed.substring(0, 2), 16) / 255
    const g = parseInt(parsed.substring(2, 4), 16) / 255
    const b = parseInt(parsed.substring(4, 6), 16) / 255
    return rgb(r, g, b)
}

export function PdfWatermarkTool() {
    const [file, setFile] = useState<File | null>(null)
    const [text, setText] = useState("CONFIDENTIAL")
    const [fontSize, setFontSize] = useState(48)
    const [opacity, setOpacity] = useState(30)
    const [rotation, setRotation] = useState(45)
    const [color, setColor] = useState("#111111")
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function handleClear() {
        setFile(null)
        setError(null)
    }

    async function handleSave() {
        if (!file || !text.trim()) return
        setIsSaving(true)
        setError(null)

        try {
            const bytes = await file.arrayBuffer()
            const doc = await PDFDocument.load(bytes)
            const font = await doc.embedFont(StandardFonts.HelveticaBold)
            const watermarkColor = hexToRgb(color)
            const textWidth = font.widthOfTextAtSize(text, fontSize)

            for (const page of doc.getPages()) {
                const { width, height } = page.getSize()
                page.drawText(text, {
                    x: width / 2 - textWidth / 2,
                    y: height / 2,
                    size: fontSize,
                    font,
                    color: watermarkColor,
                    opacity: opacity / 100,
                    rotate: degrees(rotation),
                })
            }

            const output = await doc.save()
            downloadBlob(pdfBytesToBlob(output), replaceExtension(file.name, "pdf"))
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not watermark this PDF. Make sure it isn't password protected.")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">PDF Watermark</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Stamp a text watermark across every page of your PDF.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                    <PdfDropzone onFileSelect={setFile} file={file} onClear={handleClear} />

                    {file && (
                        <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/30 p-4">
                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">Watermark text</p>
                                <Input
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Your watermark text"
                                    className="h-9 rounded-xl"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">Font size — {fontSize}pt</p>
                                <Slider value={[fontSize]} onValueChange={([v]) => setFontSize(v)} min={12} max={120} step={4} />
                            </div>

                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">Opacity — {opacity}%</p>
                                <Slider value={[opacity]} onValueChange={([v]) => setOpacity(v)} min={5} max={100} step={5} />
                            </div>

                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">Rotation — {rotation}°</p>
                                <Slider value={[rotation]} onValueChange={([v]) => setRotation(v)} min={0} max={90} step={5} />
                            </div>

                            <div className="flex items-center justify-between">
                                <p className="text-xs font-medium text-muted-foreground">Color</p>
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="h-7 w-10 cursor-pointer rounded border border-border/60 bg-transparent"
                                />
                            </div>

                            {error && <p className="text-sm text-destructive">{error}</p>}

                            <Button
                                type="button"
                                className="w-full rounded-full"
                                onClick={handleSave}
                                disabled={isSaving || !text.trim()}
                            >
                                <Droplets />
                                {isSaving ? "Applying..." : "Apply watermark"}
                            </Button>
                        </div>
                    )}
                </div>

                <div className="rounded-2xl border border-border/60 bg-muted/30 p-6 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">How it works</p>
                    <p className="mt-2">
                        The watermark text is stamped onto every page at the size, opacity, rotation, and color you
                        choose, then the file downloads automatically. Your PDF never leaves your browser.
                    </p>
                </div>
            </div>
        </div>
    )
}
