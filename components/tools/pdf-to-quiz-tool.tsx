"use client"

import { useState } from "react"
import Link from "next/link"
import { BookOpen, ChevronDown, Crown, Download, FileText, GraduationCap, Layers, ListChecks, Loader2, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { GenericFileDropzone } from "@/components/tools/generic-file-dropzone"
import { ToolSegmentedControl } from "@/components/tools/tool-segmented-control"
import { FlashcardDeck } from "@/components/tools/study/flashcard-deck"
import { QuizPlayer } from "@/components/tools/study/quiz-player"
import { usePlan } from "@/hooks/use-plan"
import { extractTextFromFile } from "@/lib/ai-file-text-extract"
import { fileToBase64 } from "@/lib/file-to-base64"
import { downloadBlob } from "@/lib/pdf-tool-utils"
import {
    MAX_SCANNED_PDF_BYTES,
    MIN_SOURCE_CHARS,
    SCANNED_CHARS_PER_PAGE,
    STUDY_LIMITS,
    flashcardsToCsv,
    flashcardsToMarkdown,
    flashcardsToTsv,
    quizToMarkdown,
    toPrintableHtml,
    type StudyDifficulty,
    type StudyMode,
    type StudySet,
} from "@/lib/study-set"
import { TRANSLATE_LANGUAGES, findTranslateLanguage } from "@/lib/translate-languages"
import { usePdfJs } from "@/lib/use-pdfjs"
import { cn } from "@/lib/utils"

type Status =
    | { kind: "idle" }
    | { kind: "reading" }
    | { kind: "generating" }
    | { kind: "error"; message: string }
    | { kind: "auth-required" }
    | { kind: "quota-exceeded"; message: string }

/** What was read from the upload. PDFs keep per-page text so a page range can be chosen. */
type LoadedDoc =
    | { kind: "pdf"; name: string; pages: string[]; scanned: boolean; bytes: ArrayBuffer }
    | { kind: "text"; name: string; text: string }

const TOOL_PATH = "/tools/ai-tools/pdf-to-quiz-flashcards"
const QUESTION_COUNTS = [5, 10, 15, 20, 30, 40]
const CARD_COUNTS = [10, 15, 25, 40, 60]
const ACCEPT = ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"

function slugify(value: string) {
    return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/(^-|-$)/g, "").slice(0, 60) || "study-set"
}

function printHtml(html: string) {
    const frame = document.createElement("iframe")
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0"
    frame.srcdoc = html
    frame.onload = () => {
        frame.contentWindow?.focus()
        frame.contentWindow?.print()
        setTimeout(() => frame.remove(), 60_000)
    }
    document.body.appendChild(frame)
}

export function PdfToQuizTool() {
    const { pdfjsLib } = usePdfJs()
    const { tier } = usePlan()
    const limits = tier === "pro" ? STUDY_LIMITS.pro : STUDY_LIMITS.free
    const isPro = tier === "pro"

    const [inputTab, setInputTab] = useState<"file" | "paste">("file")
    const [file, setFile] = useState<File | null>(null)
    const [doc, setDoc] = useState<LoadedDoc | null>(null)
    const [pasted, setPasted] = useState("")
    const [pageFrom, setPageFrom] = useState(1)
    const [pageTo, setPageTo] = useState(1)

    const [mode, setMode] = useState<StudyMode>("both")
    const [questionCount, setQuestionCount] = useState(10)
    const [cardCount, setCardCount] = useState(15)
    const [difficulty, setDifficulty] = useState<StudyDifficulty>("mixed")
    const [language, setLanguage] = useState("original")

    const [status, setStatus] = useState<Status>({ kind: "idle" })
    const [set, setSet] = useState<StudySet | null>(null)
    const [setLanguageCode, setSetLanguageCode] = useState("original")
    const [view, setView] = useState<"quiz" | "flashcards">("quiz")

    const isBusy = status.kind === "reading" || status.kind === "generating"
    const rtl = Boolean(findTranslateLanguage(setLanguageCode)?.rtl)

    // Selected-range stats for PDFs, so the user sees what will be used before spending a credit.
    const pageCount = doc?.kind === "pdf" ? doc.pages.length : 0
    const from = Math.min(Math.max(1, pageFrom), Math.max(1, pageCount))
    const to = Math.min(Math.max(from, pageTo), Math.max(1, pageCount))
    const selectedPages = doc?.kind === "pdf" ? to - from + 1 : 0
    const selectedChars =
        doc?.kind === "pdf"
            ? doc.pages.slice(from - 1, to).reduce((sum, page) => sum + page.length, 0)
            : doc?.kind === "text"
              ? doc.text.length
              : pasted.trim().length
    const overLimit = !(doc?.kind === "pdf" && doc.scanned) && selectedChars > limits.maxChars
    const scannedOverLimit = doc?.kind === "pdf" && doc.scanned && selectedPages > limits.maxScannedPages

    async function readPdf(source: File): Promise<LoadedDoc> {
        if (!pdfjsLib) throw new Error("The PDF engine is still loading. Try again in a moment.")
        const bytes = await source.arrayBuffer()
        // pdf.js may detach the buffer it is given, so give it a copy.
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(bytes.slice(0)) }).promise
        const pages: string[] = []
        for (let n = 1; n <= pdf.numPages; n++) {
            const content = await (await pdf.getPage(n)).getTextContent()
            pages.push(
                content.items
                    .map((item) => (item.str ?? "") + (item.hasEOL ? "\n" : " "))
                    .join("")
                    .replace(/[ \t]+/g, " ")
                    .replace(/ *\n */g, "\n")
                    .trim()
            )
        }
        const totalChars = pages.reduce((sum, page) => sum + page.length, 0)
        return { kind: "pdf", name: source.name, pages, scanned: totalChars / Math.max(1, pages.length) < SCANNED_CHARS_PER_PAGE, bytes }
    }

    async function handleFileSelect(next: File) {
        setFile(next)
        setDoc(null)
        setSet(null)
        setStatus({ kind: "reading" })
        try {
            const isPdf = next.type === "application/pdf" || next.name.toLowerCase().endsWith(".pdf")
            const loaded: LoadedDoc = isPdf
                ? await readPdf(next)
                : { kind: "text", name: next.name, text: (await extractTextFromFile(next, pdfjsLib)).trim() }
            if (loaded.kind === "pdf") {
                setPageFrom(1)
                setPageTo(loaded.scanned ? Math.min(loaded.pages.length, limits.maxScannedPages) : loaded.pages.length)
            } else if (loaded.text.length < MIN_SOURCE_CHARS) {
                setStatus({ kind: "error", message: "This file has very little text. Upload a longer document." })
                return
            }
            setDoc(loaded)
            setStatus({ kind: "idle" })
        } catch (error) {
            setStatus({ kind: "error", message: error instanceof Error ? error.message : "Could not read this file." })
        }
    }

    function handleClear() {
        setFile(null)
        setDoc(null)
        setSet(null)
        setStatus({ kind: "idle" })
    }

    /** Builds the request body for the chosen input: text with page markers, or a cut-down scanned PDF. */
    async function buildSource(): Promise<Record<string, unknown>> {
        if (inputTab === "paste") return { text: pasted.trim(), fileName: null, pageCount: null }
        if (!doc) throw new Error("Upload a document first.")
        if (doc.kind === "text") return { text: doc.text, fileName: doc.name, pageCount: null }

        if (!doc.scanned) {
            const text = doc.pages
                .slice(from - 1, to)
                .map((page, i) => (page ? `[Page ${from + i}]\n${page}` : ""))
                .filter(Boolean)
                .join("\n\n")
            return { text, fileName: doc.name, pageCount: doc.pages.length }
        }

        // Scanned PDF: send only the selected pages as a new PDF, so the AI can read the images.
        const { PDFDocument } = await import("pdf-lib")
        const original = await PDFDocument.load(doc.bytes, { ignoreEncryption: true })
        const cut = await PDFDocument.create()
        const copied = await cut.copyPages(original, Array.from({ length: selectedPages }, (_, i) => from - 1 + i))
        copied.forEach((page) => cut.addPage(page))
        const bytes = await cut.save()
        if (bytes.byteLength > MAX_SCANNED_PDF_BYTES) {
            throw new Error(
                `These ${selectedPages} scanned pages are ${(bytes.byteLength / 1024 / 1024).toFixed(1)} MB. Select fewer pages (up to 3 MB at a time).`
            )
        }
        const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" })
        return { pdfBase64: await fileToBase64(blob), fileName: doc.name, pageCount: selectedPages, pageOffset: from - 1 }
    }

    async function handleGenerate() {
        if (isBusy) return
        setStatus({ kind: "generating" })
        setSet(null)
        try {
            const source = await buildSource()
            const pageOffset = typeof source.pageOffset === "number" ? source.pageOffset : 0
            const res = await fetch("/api/ai/study-set", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({
                    ...source,
                    mode,
                    questionCount: Math.min(questionCount, limits.maxQuestions),
                    cardCount: Math.min(cardCount, limits.maxCards),
                    difficulty,
                    language,
                }),
            })
            const data = await res.json().catch(() => null)
            if (res.status === 401) return setStatus({ kind: "auth-required" })
            if (res.status === 429) return setStatus({ kind: "quota-exceeded", message: data?.error || "Daily AI limit reached." })
            if (!res.ok || !data?.ok || !data?.set) {
                return setStatus({ kind: "error", message: data?.error || "AI couldn't create a quiz. Please try again." })
            }
            let result = data.set as StudySet
            // Scanned PDFs were cut to the selected pages; map page numbers back to the original document.
            if (pageOffset) {
                result = {
                    ...result,
                    questions: result.questions.map((q) => ({ ...q, page: q.page ? q.page + pageOffset : null })),
                    flashcards: result.flashcards.map((c) => ({ ...c, page: c.page ? c.page + pageOffset : null })),
                }
            }
            setSet(result)
            setSetLanguageCode(language)
            setView(result.questions.length > 0 ? "quiz" : "flashcards")
            setStatus({ kind: "idle" })
        } catch (error) {
            setStatus({ kind: "error", message: error instanceof Error ? error.message : "AI couldn't create a quiz. Please try again." })
        }
    }

    function download(content: string, ext: string, type: string) {
        if (!set) return
        downloadBlob(new Blob([content], { type: `${type};charset=utf-8` }), `${slugify(set.title)}.${ext}`)
    }

    const canGenerate =
        !isBusy &&
        !scannedOverLimit &&
        (inputTab === "paste" ? pasted.trim().length >= MIN_SOURCE_CHARS : Boolean(doc))

    const countOption = (value: number, max: number) => (
        <SelectItem key={value} value={String(value)} disabled={value > max}>
            {value}
            {value > max ? " (Pro)" : ""}
        </SelectItem>
    )

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">PDF to Quiz & Flashcards</h2>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Turn notes, textbook chapters, and slides into a practice quiz with answers and explanations, plus
                flashcards you can study here or export to Anki and Quizlet.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {/* Source */}
                <div className="space-y-3">
                    <ToolSegmentedControl
                        value={inputTab}
                        onChange={(value) => {
                            setInputTab(value)
                            setSet(null)
                            if (status.kind === "error") setStatus({ kind: "idle" })
                        }}
                        options={[
                            { value: "file", label: "Upload file" },
                            { value: "paste", label: "Paste text" },
                        ]}
                    />

                    {inputTab === "file" ? (
                        <>
                            <GenericFileDropzone
                                file={file}
                                onFileSelect={handleFileSelect}
                                onClear={isBusy ? undefined : handleClear}
                                accept={ACCEPT}
                                hint="PDF, DOCX, or TXT: notes, chapters, slides exported as PDF"
                                icon={FileText}
                            />
                            {status.kind === "reading" && (
                                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Reading document...
                                </p>
                            )}
                            {doc?.kind === "pdf" && (
                                <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/30 p-3">
                                    <div className="flex flex-wrap items-center gap-2 text-sm">
                                        <span className="text-muted-foreground">Pages</span>
                                        <input
                                            type="number"
                                            min={1}
                                            max={pageCount}
                                            value={pageFrom}
                                            onChange={(e) => setPageFrom(Number(e.target.value) || 1)}
                                            className="w-16 rounded-lg border border-border/60 bg-background px-2 py-1 text-sm tabular-nums"
                                            aria-label="From page"
                                        />
                                        <span className="text-muted-foreground">to</span>
                                        <input
                                            type="number"
                                            min={1}
                                            max={pageCount}
                                            value={pageTo}
                                            onChange={(e) => setPageTo(Number(e.target.value) || 1)}
                                            className="w-16 rounded-lg border border-border/60 bg-background px-2 py-1 text-sm tabular-nums"
                                            aria-label="To page"
                                        />
                                        <span className="text-muted-foreground">of {pageCount}</span>
                                    </div>
                                    {doc.scanned ? (
                                        <p className={cn("text-xs", scannedOverLimit ? "text-destructive" : "text-muted-foreground")}>
                                            This looks like a scanned PDF, so the AI will read the page images.{" "}
                                            {scannedOverLimit
                                                ? `Select up to ${limits.maxScannedPages} pages at a time${isPro ? "" : " (Pro: " + STUDY_LIMITS.pro.maxScannedPages + ")"}.`
                                                : `Up to ${limits.maxScannedPages} pages at a time.`}
                                        </p>
                                    ) : (
                                        <p className={cn("text-xs", overLimit ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
                                            {selectedPages} page{selectedPages === 1 ? "" : "s"}, {selectedChars.toLocaleString()} characters.
                                            {overLimit &&
                                                ` Only the first ${limits.maxChars.toLocaleString()} will be used${isPro ? "" : `; Pro covers ${STUDY_LIMITS.pro.maxChars.toLocaleString()}`}. Choose a smaller page range for full coverage.`}
                                        </p>
                                    )}
                                </div>
                            )}
                            {doc?.kind === "text" && (
                                <p className={cn("text-xs", overLimit ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
                                    {selectedChars.toLocaleString()} characters read.
                                    {overLimit && ` Only the first ${limits.maxChars.toLocaleString()} will be used.`}
                                </p>
                            )}
                        </>
                    ) : (
                        <div className="space-y-1.5">
                            <Textarea
                                value={pasted}
                                onChange={(e) => setPasted(e.target.value)}
                                placeholder="Paste your notes, a chapter, or an article..."
                                className="min-h-56 resize-y rounded-2xl text-sm"
                                disabled={isBusy}
                            />
                            <p className={cn("text-xs", overLimit ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
                                {selectedChars.toLocaleString()} / {limits.maxChars.toLocaleString()} characters
                                {selectedChars > 0 && selectedChars < MIN_SOURCE_CHARS && ". Add a bit more text"}
                            </p>
                        </div>
                    )}
                </div>

                {/* Options */}
                <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/30 p-4">
                    <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground">Create</p>
                        <ToolSegmentedControl
                            value={mode}
                            onChange={setMode}
                            options={[
                                { value: "both", label: "Quiz + flashcards" },
                                { value: "quiz", label: "Quiz" },
                                { value: "flashcards", label: "Flashcards" },
                            ]}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {mode !== "flashcards" && (
                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">Questions</p>
                                <Select value={String(questionCount)} onValueChange={(v) => setQuestionCount(Number(v))}>
                                    <SelectTrigger className="w-full rounded-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>{QUESTION_COUNTS.map((n) => countOption(n, limits.maxQuestions))}</SelectContent>
                                </Select>
                            </div>
                        )}
                        {mode !== "quiz" && (
                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">Flashcards</p>
                                <Select value={String(cardCount)} onValueChange={(v) => setCardCount(Number(v))}>
                                    <SelectTrigger className="w-full rounded-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>{CARD_COUNTS.map((n) => countOption(n, limits.maxCards))}</SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    {mode !== "flashcards" && (
                        <div className="space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground">Difficulty</p>
                            <ToolSegmentedControl
                                value={difficulty}
                                onChange={setDifficulty}
                                options={[
                                    { value: "mixed", label: "Mixed" },
                                    { value: "easy", label: "Easy" },
                                    { value: "medium", label: "Medium" },
                                    { value: "hard", label: "Hard" },
                                ]}
                            />
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground">Language</p>
                        <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger className="w-full rounded-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="original">Same as the document</SelectItem>
                                {TRANSLATE_LANGUAGES.map((lang) => (
                                    <SelectItem key={lang.code} value={lang.code}>
                                        {lang.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button type="button" className="w-full rounded-full" onClick={handleGenerate} disabled={!canGenerate}>
                        {status.kind === "generating" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        {set ? "Generate a new set" : "Generate"}
                    </Button>
                    {status.kind === "generating" && (
                        <p className="text-center text-xs text-muted-foreground">Reading your document and writing questions... about 20–60 seconds.</p>
                    )}
                    {!isPro && (
                        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
                            <Crown className="h-3 w-3" />
                            <Link href="/dashboard/premium" className="underline">
                                Pro
                            </Link>
                            : up to {STUDY_LIMITS.pro.maxQuestions} questions, {STUDY_LIMITS.pro.maxCards} cards, and ~
                            {Math.round(STUDY_LIMITS.pro.maxChars / 2500)} pages per set
                        </p>
                    )}
                </div>
            </div>

            {status.kind === "auth-required" && (
                <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
                    <Link href={`/login?callbackUrl=${TOOL_PATH}`} className="underline">
                        Sign in
                    </Link>{" "}
                    to create quizzes and flashcards with AI.
                </p>
            )}
            {status.kind === "quota-exceeded" && (
                <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
                    {status.message}{" "}
                    <Link href="/dashboard/premium" className="underline">
                        Upgrade for more
                    </Link>
                    .
                </p>
            )}
            {status.kind === "error" && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                    <p className="text-sm text-destructive">{status.message}</p>
                    {canGenerate && (
                        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={handleGenerate}>
                            Try again
                        </Button>
                    )}
                </div>
            )}

            {set && !isBusy && (
                <div className="mt-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="flex items-center gap-2 font-semibold">
                                <GraduationCap className="h-4 w-4 shrink-0 text-primary" />
                                <span className="truncate">{set.title}</span>
                            </p>
                            {set.truncated && (
                                <p className="text-xs text-amber-600 dark:text-amber-400">
                                    Your document was long, so only its first part was used. Choose a page range to cover the rest.
                                </p>
                            )}
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button type="button" variant="outline" size="sm" className="rounded-full">
                                    <Download className="h-3.5 w-3.5" />
                                    Export
                                    <ChevronDown className="h-3.5 w-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {set.questions.length > 0 && (
                                    <>
                                        <DropdownMenuItem onClick={() => printHtml(toPrintableHtml(set, "quiz", rtl))}>
                                            Print quiz / save as PDF (with answer key)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => download(quizToMarkdown(set), "md", "text/markdown")}>
                                            Quiz as Markdown (.md)
                                        </DropdownMenuItem>
                                    </>
                                )}
                                {set.flashcards.length > 0 && (
                                    <>
                                        <DropdownMenuItem onClick={() => download(flashcardsToTsv(set.flashcards), "txt", "text/plain")}>
                                            Flashcards for Anki / Quizlet (.txt)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => download(flashcardsToCsv(set.flashcards), "csv", "text/csv")}>
                                            Flashcards as CSV
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => download(flashcardsToMarkdown(set), "md", "text/markdown")}>
                                            Flashcards as Markdown (.md)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => printHtml(toPrintableHtml(set, "flashcards", rtl))}>
                                            Print flashcards
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {set.questions.length > 0 && set.flashcards.length > 0 && (
                        <ToolSegmentedControl
                            value={view}
                            onChange={setView}
                            options={[
                                { value: "quiz", label: `Quiz (${set.questions.length})` },
                                { value: "flashcards", label: `Flashcards (${set.flashcards.length})` },
                            ]}
                        />
                    )}

                    {/* key: a new set resets the player's progress. */}
                    {view === "quiz" && set.questions.length > 0 ? (
                        <QuizPlayer key={set.questions[0].id} questions={set.questions} rtl={rtl} />
                    ) : set.flashcards.length > 0 ? (
                        <FlashcardDeck key={set.flashcards[0].id} cards={set.flashcards} rtl={rtl} />
                    ) : null}

                    <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        {view === "quiz" ? <ListChecks className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <Layers className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                        Questions are written only from your document, but AI can make mistakes. Check anything important
                        against the page shown.
                    </p>
                </div>
            )}

            {!set && !isBusy && status.kind === "idle" && !doc && inputTab === "file" && (
                <div className="mt-6 flex items-center gap-3 rounded-2xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                    <BookOpen className="h-5 w-5 shrink-0" />
                    Works great for class notes, NCERT and textbook chapters, lecture slides, and exam prep material.
                </div>
            )}
        </div>
    )
}
