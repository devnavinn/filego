import type { PdfJsTextItem } from "@/lib/use-pdfjs"

/** A detected run of existing text, in the same native bottom-left-origin box convention as EditorElement. */
export type TextRun = { str: string; x: number; y: number; width: number; height: number; fontSize: number }

/**
 * Converts raw pdf.js text items into edit-friendly runs, merging adjacent
 * same-line fragments (PDF generators frequently split one visual string —
 * e.g. a date like "01/03/2024" — into several separate show-text operations).
 * Only merges runs that share a baseline, sit close together horizontally,
 * and have a similar font size, so unrelated text (a label vs. a far-off
 * value) stays separate.
 */
export function buildTextRuns(items: PdfJsTextItem[]): TextRun[] {
    const raw: TextRun[] = items
        .filter((item) => item.str.trim().length > 0)
        .map((item) => {
            const fontSize = Math.hypot(item.transform[0], item.transform[1]) || item.height || 12
            const height = item.height || fontSize
            return {
                str: item.str,
                x: item.transform[4],
                y: item.transform[5],
                width: item.width,
                height,
                fontSize,
            }
        })
        // Top-to-bottom (native y descending), then left-to-right within a line.
        .sort((a, b) => b.y - a.y || a.x - b.x)

    const lines: TextRun[] = []

    for (const run of raw) {
        const last = lines[lines.length - 1]
        const maxFont = last ? Math.max(last.fontSize, run.fontSize) : 0

        const sameLine = last ? Math.abs(last.y - run.y) < maxFont * 0.35 : false
        const gap = last ? run.x - (last.x + last.width) : Infinity
        const closeEnough = gap < maxFont * 0.75
        const similarSize = last ? Math.abs(last.fontSize - run.fontSize) < maxFont * 0.25 : false

        if (last && sameLine && closeEnough && similarSize) {
            // A gap around a typical space-glyph width (~0.2-0.3 * fontSize for common fonts)
            // means the source PDF used positioning instead of a literal " " character to
            // separate words — insert one so merged text doesn't come out concatenated.
            // Tight/kerning-only gaps (e.g. between "01" and "/" in a date) sit near zero.
            const needsSpace = gap > maxFont * 0.1 && !/\s$/.test(last.str) && !/^\s/.test(run.str)

            const right = Math.max(last.x + last.width, run.x + run.width)
            last.str += (needsSpace ? " " : "") + run.str
            last.width = right - last.x
            last.height = Math.max(last.height, run.height)
            last.y = Math.min(last.y, run.y)
        } else {
            lines.push({ ...run })
        }
    }

    return lines
}
