import jsPDF from "jspdf"
import { canvasToBlob } from "@/lib/image-tool-utils"

const PDF_MARGIN = 48
const PDF_FONT_SIZE = 11
const PDF_LINE_HEIGHT = PDF_FONT_SIZE * 1.4

/** Renders plain text into a paginated A4 PDF and returns it as a Blob. */
export function textToPdfBlob(text: string): Blob {
    const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const usableWidth = pageWidth - PDF_MARGIN * 2
    const usableHeight = pageHeight - PDF_MARGIN * 2
    const linesPerPage = Math.max(1, Math.floor(usableHeight / PDF_LINE_HEIGHT))

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(PDF_FONT_SIZE)

    const lines = pdf.splitTextToSize(text.trim() || " ", usableWidth) as string[]

    lines.forEach((line, index) => {
        if (index > 0 && index % linesPerPage === 0) pdf.addPage()
        const positionOnPage = index % linesPerPage
        pdf.text(line, PDF_MARGIN, PDF_MARGIN + PDF_FONT_SIZE + positionOnPage * PDF_LINE_HEIGHT)
    })

    return pdf.output("blob")
}

const IMAGE_WIDTH = 1000
const IMAGE_PADDING_X = 48
const IMAGE_PADDING_Y = 48
const IMAGE_FONT_SIZE = 18
const IMAGE_LINE_HEIGHT = IMAGE_FONT_SIZE * 1.5
const IMAGE_FONT = `${IMAGE_FONT_SIZE}px ui-monospace, SFMono-Regular, Menlo, monospace`

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const wrapped: string[] = []

    for (const rawLine of text.split("\n")) {
        if (rawLine === "") {
            wrapped.push("")
            continue
        }

        let current = ""
        for (const word of rawLine.split(" ")) {
            const candidate = current ? `${current} ${word}` : word
            if (current && ctx.measureText(candidate).width > maxWidth) {
                wrapped.push(current)
                current = word
            } else {
                current = candidate
            }
        }
        wrapped.push(current)
    }

    return wrapped
}

/** Renders plain text onto a single white canvas image and returns it as a PNG Blob. */
export function textToImageBlob(text: string): Promise<Blob> {
    const measureCanvas = document.createElement("canvas")
    const measureCtx = measureCanvas.getContext("2d")
    if (!measureCtx) throw new Error("Canvas rendering is not available in this browser.")
    measureCtx.font = IMAGE_FONT

    const maxLineWidth = IMAGE_WIDTH - IMAGE_PADDING_X * 2
    const lines = wrapLines(measureCtx, text.trim() || " ", maxLineWidth)

    const canvas = document.createElement("canvas")
    canvas.width = IMAGE_WIDTH
    canvas.height = Math.max(IMAGE_PADDING_Y * 2 + lines.length * IMAGE_LINE_HEIGHT, 200)

    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas rendering is not available in this browser.")

    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = "#111111"
    ctx.font = IMAGE_FONT
    ctx.textBaseline = "top"

    lines.forEach((line, index) => {
        ctx.fillText(line, IMAGE_PADDING_X, IMAGE_PADDING_Y + index * IMAGE_LINE_HEIGHT)
    })

    return canvasToBlob(canvas, "image/png")
}
