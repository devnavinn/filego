import { degrees, PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "@cantoo/pdf-lib"

import type { EditorElement, EditorPage } from "@/lib/pdf-editor-types"

function hexToRgb(hex: string) {
    const parsed = hex.replace("#", "")
    const r = parseInt(parsed.substring(0, 2), 16) / 255
    const g = parseInt(parsed.substring(2, 4), 16) / 255
    const b = parseInt(parsed.substring(4, 6), 16) / 255
    return rgb(r, g, b)
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
    const base64 = dataUrl.split(",")[1] ?? ""
    return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
}

/**
 * Element x/y are always the BOTTOM-LEFT corner in native PDF space (y increasing
 * upward), captured via pdf.js's `viewport.convertToPdfPoint()` — which already
 * returns true native PDF coordinates, matching pdf-lib's own drawing convention
 * exactly. No page-height flip is needed here; do not reintroduce one.
 */
async function drawElement(
    pdfPage: PDFPage,
    element: EditorElement,
    fonts: { regular: PDFFont; bold: PDFFont },
    output: PDFDocument
) {
    switch (element.type) {
        case "text": {
            if (!element.content.trim()) return
            pdfPage.drawText(element.content, {
                x: element.x,
                y: element.y + element.height - element.fontSize,
                size: element.fontSize,
                font: element.bold ? fonts.bold : fonts.regular,
                color: hexToRgb(element.color),
                lineHeight: element.fontSize * 1.2,
                maxWidth: element.width,
            })
            return
        }
        case "image": {
            const bytes = dataUrlToBytes(element.dataUrl)
            const image =
                element.mimeType === "image/png" ? await output.embedPng(bytes) : await output.embedJpg(bytes)
            pdfPage.drawImage(image, {
                x: element.x,
                y: element.y,
                width: element.width,
                height: element.height,
            })
            return
        }
        case "rect":
        case "whiteout": {
            const isWhiteout = element.type === "whiteout"
            pdfPage.drawRectangle({
                x: element.x,
                y: element.y,
                width: element.width,
                height: element.height,
                color: isWhiteout || element.filled ? (isWhiteout ? rgb(1, 1, 1) : hexToRgb(element.color)) : undefined,
                borderColor: !isWhiteout && !element.filled ? hexToRgb(element.color) : undefined,
                borderWidth: !isWhiteout && !element.filled ? element.strokeWidth : 0,
            })
            return
        }
        case "ellipse": {
            pdfPage.drawEllipse({
                x: element.x + element.width / 2,
                y: element.y + element.height / 2,
                xScale: element.width / 2,
                yScale: element.height / 2,
                color: element.filled ? hexToRgb(element.color) : undefined,
                borderColor: !element.filled ? hexToRgb(element.color) : undefined,
                borderWidth: !element.filled ? element.strokeWidth : 0,
            })
            return
        }
        case "line": {
            pdfPage.drawLine({
                start: { x: element.x1, y: element.y1 },
                end: { x: element.x2, y: element.y2 },
                thickness: element.strokeWidth,
                color: hexToRgb(element.color),
            })
            return
        }
        case "draw": {
            for (let i = 0; i < element.points.length - 1; i++) {
                const a = element.points[i]
                const b = element.points[i + 1]
                pdfPage.drawLine({
                    start: { x: a.x, y: a.y },
                    end: { x: b.x, y: b.y },
                    thickness: element.strokeWidth,
                    color: hexToRgb(element.color),
                })
            }
            return
        }
    }
}

export async function exportEditedPdf(
    sourceBytes: ArrayBuffer,
    pages: EditorPage[],
    elements: EditorElement[]
): Promise<Uint8Array> {
    const source = await PDFDocument.load(sourceBytes)
    const output = await PDFDocument.create()
    const fonts = {
        regular: await output.embedFont(StandardFonts.Helvetica),
        bold: await output.embedFont(StandardFonts.HelveticaBold),
    }

    // Copy all pages in a single call: copyPages() builds one PDFObjectCopier per
    // call, which de-duplicates shared resources (a logo, a common font, etc.)
    // only *within* that call. Copying pages one at a time in a loop — as this
    // used to do — gave every page its own copier, so anything shared across
    // pages got re-embedded once per page instead of once total, bloating the
    // output file well beyond what the content actually needs.
    const copiedPages = await output.copyPages(
        source,
        pages.map((p) => p.originalIndex)
    )

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i]
        const copiedPage = copiedPages[i]
        output.addPage(copiedPage)

        if (page.rotationDelta !== 0) {
            const currentAngle = copiedPage.getRotation().angle
            copiedPage.setRotation(degrees((currentAngle + page.rotationDelta) % 360))
        }

        const pageElements = elements.filter((el) => el.pageId === page.id)
        for (const element of pageElements) {
            await drawElement(copiedPage, element, fonts, output)
        }
    }

    return output.save()
}
