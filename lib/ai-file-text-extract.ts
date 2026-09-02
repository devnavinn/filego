import mammoth from "mammoth"
import type { PdfJsLib } from "@/lib/use-pdfjs"

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

async function extractPdfText(file: File, pdfjsLib: PdfJsLib): Promise<string> {
    const buffer = new Uint8Array(await file.arrayBuffer())
    const doc = await pdfjsLib.getDocument({ data: buffer }).promise

    const pages: string[] = []
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
        const page = await doc.getPage(pageNumber)
        const content = await page.getTextContent()
        pages.push(content.items.map((item) => item.str).join(" "))
    }

    return pages.join("\n\n")
}

/**
 * Extracts plain text from a PDF, DOCX, or plain-text file for sending to the AI.
 * `pdfjsLib` must already be loaded (via `usePdfJs`) when the file is a PDF.
 */
export async function extractTextFromFile(file: File, pdfjsLib: PdfJsLib | null): Promise<string> {
    const name = file.name.toLowerCase()

    if (file.type === "application/pdf" || name.endsWith(".pdf")) {
        if (!pdfjsLib) throw new Error("The PDF engine is still loading. Try again in a moment.")
        const text = await extractPdfText(file, pdfjsLib)
        if (!text.trim()) throw new Error("No readable text found in this PDF. Scanned/image-only PDFs aren't supported yet.")
        return text
    }

    if (file.type === DOCX_MIME || name.endsWith(".docx")) {
        const buffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer: buffer })
        if (!result.value.trim()) throw new Error("No readable text found in this document.")
        return result.value
    }

    if (name.endsWith(".doc")) {
        throw new Error("Legacy .doc files aren't supported — please convert to .docx or .pdf first.")
    }

    if (file.type.startsWith("text/") || name.endsWith(".txt")) {
        const text = await file.text()
        if (!text.trim()) throw new Error("This file appears to be empty.")
        return text
    }

    throw new Error("Unsupported file type. Upload a PDF, DOCX, or TXT file.")
}
