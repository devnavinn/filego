"use client"

import { useEffect, useRef, useState } from "react"
import QRCode from "qrcode"
import { Download, QrCode } from "lucide-react"

import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type ErrorCorrection = "L" | "M" | "Q" | "H"

const ERROR_LEVELS: { value: ErrorCorrection; label: string }[] = [
    { value: "L", label: "Low (7%)" },
    { value: "M", label: "Medium (15%)" },
    { value: "Q", label: "Quartile (25%)" },
    { value: "H", label: "High (30%)" },
]

export function QrCodeGeneratorTool() {
    const [text, setText] = useState("https://www.filego.in")
    const [errorCorrection, setErrorCorrection] = useState<ErrorCorrection>("M")
    const [size, setSize] = useState(280)
    const [error, setError] = useState<string | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        if (!text.trim()) {
            const ctx = canvas.getContext("2d")
            ctx?.clearRect(0, 0, canvas.width, canvas.height)
            return
        }

        QRCode.toCanvas(canvas, text, {
            width: size,
            errorCorrectionLevel: errorCorrection,
            margin: 1,
        })
            .then(() => setError(null))
            .catch((err: Error) => setError(err.message ?? "Could not generate a QR code for this input."))
    }, [text, errorCorrection, size])

    const displayError = text.trim() ? error : null

    function handleDownload() {
        const canvas = canvasRef.current
        if (!canvas || !text.trim()) return

        const link = document.createElement("a")
        link.download = "qr-code.png"
        link.href = canvas.toDataURL("image/png")
        link.click()
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">QR Code Generator</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Turn any text or URL into a downloadable QR code, generated locally.
            </p>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                    <div className="space-y-3">
                        <p className="text-sm font-medium">Content</p>
                        <Textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Enter a URL or any text"
                            className="min-h-32 rounded-2xl"
                        />
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        <div className="flex-1 space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground">Error correction</p>
                            <Select
                                value={errorCorrection}
                                onValueChange={(v) => setErrorCorrection(v as ErrorCorrection)}
                            >
                                <SelectTrigger className="w-full rounded-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ERROR_LEVELS.map((level) => (
                                        <SelectItem key={level.value} value={level.value}>
                                            {level.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex-1 space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground">Size</p>
                            <Select value={String(size)} onValueChange={(v) => setSize(Number(v))}>
                                <SelectTrigger className="w-full rounded-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="200">200 x 200</SelectItem>
                                    <SelectItem value="280">280 x 280</SelectItem>
                                    <SelectItem value="400">400 x 400</SelectItem>
                                    <SelectItem value="600">600 x 600</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {displayError && <p className="text-sm text-destructive">{displayError}</p>}
                </div>

                <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border/60 bg-muted/30 p-6">
                    {text.trim() && !displayError ? (
                        <canvas ref={canvasRef} className="max-w-full rounded-xl bg-white p-2" />
                    ) : (
                        <div className="flex h-48 w-48 items-center justify-center rounded-xl border border-dashed border-border/60 text-muted-foreground">
                            <QrCode className="h-8 w-8" />
                        </div>
                    )}
                    <Button
                        type="button"
                        className="w-full rounded-full sm:w-auto"
                        onClick={handleDownload}
                        disabled={!text.trim() || !!displayError}
                    >
                        <Download />
                        Download PNG
                    </Button>
                </div>
            </div>
        </div>
    )
}
