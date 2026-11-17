// Client-safe logic for the PDF to Quiz & Flashcards tool: limits, validation, and exports.

export type StudyMode = "quiz" | "flashcards" | "both"
export type StudyDifficulty = "easy" | "medium" | "hard" | "mixed"

export type QuizQuestion = {
    id: string
    question: string
    /** Always 4 options. */
    options: string[]
    correctIndex: number
    explanation: string | null
    /** A short passage from the document backing the answer, only when it was found in the text. */
    quote: string | null
    page: number | null
}

export type Flashcard = {
    id: string
    front: string
    back: string
    page: number | null
}

export type StudySet = {
    title: string
    questions: QuizQuestion[]
    flashcards: Flashcard[]
    /** True when the document was longer than the plan's limit and only the start was used. */
    truncated: boolean
}

export const STUDY_LIMITS = {
    free: { maxChars: 40_000, maxQuestions: 15, maxCards: 25, maxScannedPages: 15 },
    pro: { maxChars: 150_000, maxQuestions: 40, maxCards: 60, maxScannedPages: 50 },
} as const

/** Scanned PDFs are sent as a PDF; keep the request under the host's ~4.5 MB body limit. */
export const MAX_SCANNED_PDF_BYTES = 3 * 1024 * 1024
/** Below this many characters per page on average, a PDF is treated as scanned (image-only). */
export const SCANNED_CHARS_PER_PAGE = 80
export const MIN_SOURCE_CHARS = 300

/** Lowercase letters and digits only, for checking AI-quoted text against the source. */
export function looseText(value: string): string {
    return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim()
}

function shuffled<T>(items: T[]): T[] {
    const copy = [...items]
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
}

/**
 * Shuffles a question's options and remaps the answer. Language models put the correct answer
 * in the first slot far more often than chance, which makes quizzes guessable.
 */
export function shuffleOptions(question: QuizQuestion): QuizQuestion {
    const order = shuffled(question.options.map((_, i) => i))
    return {
        ...question,
        options: order.map((i) => question.options[i]),
        correctIndex: order.indexOf(question.correctIndex),
    }
}

export type RawQuestion = {
    question?: unknown
    options?: unknown
    correctIndex?: unknown
    explanation?: unknown
    quote?: unknown
    page?: unknown
}

export type RawFlashcard = { front?: unknown; back?: unknown; page?: unknown }

const str = (value: unknown) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "")

function pageNumber(value: unknown, pageCount: number | null): number | null {
    const n = Math.round(Number(value))
    if (!Number.isFinite(n) || n < 1) return null
    return pageCount && n > pageCount ? null : n
}

/**
 * Keeps only well-formed questions: 4 distinct non-empty options, a valid answer, no duplicates.
 * Quotes are kept only if they really appear in the source text.
 */
export function normalizeQuestions(
    raw: RawQuestion[],
    options: { sourceText: string | null; pageCount: number | null; max: number; newId: () => string }
): QuizQuestion[] {
    const source = options.sourceText ? looseText(options.sourceText) : null
    const seen = new Set<string>()
    const result: QuizQuestion[] = []

    for (const item of raw) {
        const question = str(item?.question)
        const opts = Array.isArray(item?.options) ? item.options.map(str) : []
        const correctIndex = Math.round(Number(item?.correctIndex))
        if (!question || opts.length !== 4 || opts.some((o) => !o)) continue
        if (new Set(opts.map((o) => o.toLowerCase())).size !== 4) continue
        if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) continue

        const key = looseText(question)
        if (seen.has(key)) continue
        seen.add(key)

        const quote = str(item?.quote)
        const probe = looseText(quote).slice(0, 60)
        const verified = Boolean(source && probe.length >= 20 && source.includes(probe))

        result.push(
            shuffleOptions({
                id: options.newId(),
                question,
                options: opts,
                correctIndex,
                explanation: str(item?.explanation) || null,
                quote: verified ? quote : null,
                page: pageNumber(item?.page, options.pageCount),
            })
        )
        if (result.length >= options.max) break
    }
    return result
}

export function normalizeFlashcards(
    raw: RawFlashcard[],
    options: { pageCount: number | null; max: number; newId: () => string }
): Flashcard[] {
    const seen = new Set<string>()
    const result: Flashcard[] = []
    for (const item of raw) {
        const front = str(item?.front)
        const back = str(item?.back)
        if (!front || !back || looseText(front) === looseText(back)) continue
        const key = looseText(front)
        if (seen.has(key)) continue
        seen.add(key)
        result.push({ id: options.newId(), front, back, page: pageNumber(item?.page, options.pageCount) })
        if (result.length >= options.max) break
    }
    return result
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

const LETTERS = ["A", "B", "C", "D"]

export function quizToMarkdown(set: StudySet): string {
    const lines = [`# ${set.title}: Quiz`, ""]
    set.questions.forEach((q, i) => {
        lines.push(`**${i + 1}. ${q.question}**`, "")
        q.options.forEach((o, j) => lines.push(`- ${LETTERS[j]}. ${o}`))
        lines.push("")
    })
    lines.push("## Answer key", "")
    set.questions.forEach((q, i) => {
        lines.push(`${i + 1}. **${LETTERS[q.correctIndex]}**. ${q.options[q.correctIndex]}${q.explanation ? `: ${q.explanation}` : ""}`)
    })
    return lines.join("\n") + "\n"
}

export function flashcardsToMarkdown(set: StudySet): string {
    return [`# ${set.title}: Flashcards`, "", ...set.flashcards.map((c) => `**${c.front}**\n${c.back}\n`)].join("\n")
}

/** Tab-separated front/back, one card per line: imports directly into Anki and Quizlet. */
export function flashcardsToTsv(cards: Flashcard[]): string {
    const clean = (value: string) => value.replace(/[\t\r\n]+/g, " ")
    return cards.map((c) => `${clean(c.front)}\t${clean(c.back)}`).join("\n") + "\n"
}

export function flashcardsToCsv(cards: Flashcard[]): string {
    const cell = (value: string) => `"${value.replace(/"/g, '""')}"`
    return ["Front,Back", ...cards.map((c) => `${cell(c.front)},${cell(c.back)}`)].join("\r\n") + "\r\n"
}

function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string)
}

/**
 * A standalone printable page (worksheet + answer key on a new page, or a flashcard grid to cut out).
 * Printed by the browser so every script (Hindi, Tamil, Arabic...) renders correctly.
 */
export function toPrintableHtml(set: StudySet, what: "quiz" | "flashcards", rtl: boolean): string {
    const title = escapeHtml(set.title)
    const body =
        what === "quiz"
            ? `<h1>${title}</h1><p class="meta">Name: ____________________ &nbsp; Score: ______ / ${set.questions.length}</p>
<ol class="questions">${set.questions
                  .map(
                      (q) =>
                          `<li><p class="q">${escapeHtml(q.question)}</p><ol class="opts" type="A">${q.options
                              .map((o) => `<li>${escapeHtml(o)}</li>`)
                              .join("")}</ol></li>`
                  )
                  .join("")}</ol>
<section class="key"><h2>Answer key</h2><ol>${set.questions
                  .map(
                      (q) =>
                          `<li><b>${LETTERS[q.correctIndex]}</b>. ${escapeHtml(q.options[q.correctIndex])}${
                              q.explanation ? `<br><span class="exp">${escapeHtml(q.explanation)}</span>` : ""
                          }</li>`
                  )
                  .join("")}</ol></section>`
            : `<h1>${title}: Flashcards</h1><div class="cards">${set.flashcards
                  .map((c) => `<div class="card"><p class="front">${escapeHtml(c.front)}</p><p class="back">${escapeHtml(c.back)}</p></div>`)
                  .join("")}</div>`

    return `<!doctype html><html lang="en" dir="${rtl ? "rtl" : "ltr"}"><head><meta charset="utf-8"><title>${title}</title>
<style>
body{font-family:system-ui,-apple-system,"Segoe UI","Noto Sans",sans-serif;color:#111;margin:32px;line-height:1.5}
h1{font-size:22px;margin:0 0 4px}h2{font-size:18px}.meta{color:#555;margin:0 0 20px}
.questions>li{margin:0 0 16px;break-inside:avoid}.q{font-weight:600;margin:0 0 6px}.opts{margin:0;padding-inline-start:22px}
.key{break-before:page}.key li{margin:0 0 8px}.exp{color:#444;font-size:14px}
.cards{display:grid;grid-template-columns:1fr 1fr;gap:12px}.card{border:1px dashed #999;border-radius:8px;padding:12px;break-inside:avoid}
.front{font-weight:600;margin:0 0 8px}.back{margin:0;color:#333}
@page{margin:16mm}
</style></head><body>${body}</body></html>`
}
