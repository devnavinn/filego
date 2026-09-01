"use client"

import { useEffect, useState } from "react"

const PDFJS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
const PDFJS_WORKER_CDN = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"

type PdfJsViewport = { width: number; height: number }

type PdfJsPage = {
    getViewport: (params: { scale: number }) => PdfJsViewport
    render: (params: { canvasContext: CanvasRenderingContext2D; viewport: PdfJsViewport }) => {
        promise: Promise<void>
    }
}

type PdfJsDocument = {
    numPages: number
    getPage: (pageNumber: number) => Promise<PdfJsPage>
}

export type PdfJsLib = {
    getDocument: (params: { data: Uint8Array }) => { promise: Promise<PdfJsDocument> }
    GlobalWorkerOptions: { workerSrc: string }
}

/**
 * Accessed via a cast rather than `window.pdfjsLib` directly — another tool
 * file augments the global `Window.pdfjsLib` type with a narrower shape for
 * its own needs, which would otherwise conflict with the fuller shape used here.
 */
function getGlobalPdfJs(): PdfJsLib | undefined {
    return (window as unknown as { pdfjsLib?: PdfJsLib }).pdfjsLib
}

let loadPromise: Promise<void> | null = null

function loadPdfJsScript(): Promise<void> {
    if (getGlobalPdfJs()) return Promise.resolve()

    if (!loadPromise) {
        loadPromise = new Promise((resolve, reject) => {
            const existing = document.querySelector<HTMLScriptElement>(`script[src="${PDFJS_CDN}"]`)
            if (existing) {
                existing.addEventListener("load", () => resolve())
                existing.addEventListener("error", () => reject(new Error("Could not load the PDF engine.")))
                return
            }

            const script = document.createElement("script")
            script.src = PDFJS_CDN
            script.async = true
            script.onload = () => resolve()
            script.onerror = () => reject(new Error("Could not load the PDF engine."))
            document.body.appendChild(script)
        })
    }

    return loadPromise
}

/** Loads pdf.js from a CDN and returns the ready `window.pdfjsLib` instance. */
export function usePdfJs() {
    const [pdfjsLib, setPdfjsLib] = useState<PdfJsLib | null>(
        typeof window !== "undefined" ? (getGlobalPdfJs() ?? null) : null
    )
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false

        loadPdfJsScript()
            .then(() => {
                if (cancelled) return
                const lib = getGlobalPdfJs()
                if (!lib) throw new Error("PDF engine loaded incorrectly.")
                lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN
                setPdfjsLib(lib)
            })
            .catch((err: Error) => {
                if (!cancelled) setError(err.message)
            })

        return () => {
            cancelled = true
        }
    }, [])

    return { pdfjsLib, error }
}
