import { ApiError, GoogleGenAI, MediaResolution, Type } from "@google/genai"
import type { GenerateContentParameters, GenerateContentResponse, Part } from "@google/genai"
import type { McqQuiz } from "@/lib/pdf-form-types"
import { looseText, type BulletRewrite, type FixPriority, type JobKeyword, type ResumeFix } from "@/lib/ats"
import { normalizeFlashcards, normalizeQuestions, type RawFlashcard, type RawQuestion, type StudyDifficulty, type StudySet } from "@/lib/study-set"
import type { PhotoEditQuality } from "@/lib/photo-edit"
import { SUBTITLE_STYLE_RULES, normalizeCues, type RawCue, type SubtitleCue, type SubtitleStyle } from "@/lib/subtitles"

/**
 * Models tried in order. When one is rate limited (429) or overloaded (503) the
 * request is retried on the next one. Override with a comma-separated GEMINI_MODELS env var.
 */
const MODELS = (process.env.GEMINI_MODELS ?? "gemini-3.8-flash,gemini-3.5-flash-lite")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean)

/** How long a rate-limited model is skipped before being tried again. */
const RATE_LIMIT_COOLDOWN_MS = 60_000
const rateLimitedUntil = new Map<string, number>()

function isRetryableError(error: unknown): boolean {
    if (error instanceof ApiError) return error.status === 429 || error.status === 503
    const message = error instanceof Error ? error.message : String(error)
    return /\b(429|503)\b|RESOURCE_EXHAUSTED|UNAVAILABLE|rate limit|quota/i.test(message)
}

function isTimeoutError(error: unknown): boolean {
    return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")
}

type GenerateOptions = {
    /** Abort an attempt that takes longer than this and move on to the next model. */
    attemptTimeoutMs?: number
    /** Models to try in order, instead of the default text models. */
    models?: string[]
}

/**
 * A 429 with a quota "limit: 0" means the model isn't available on this API key's tier at all
 * (e.g. image models on Google's free tier). Retrying won't help; billing has to be enabled.
 */
function isUnavailableOnTier(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error)
    return /limit:\s*0\b/.test(message) && /free_tier|FreeTier/i.test(message)
}

async function generateContent(
    params: Omit<GenerateContentParameters, "model">,
    options: GenerateOptions = {}
): Promise<GenerateContentResponse> {
    const ai = getClient()
    const now = Date.now()
    const models = options.models?.length ? options.models : MODELS
    const available = models.filter((model) => (rateLimitedUntil.get(model) ?? 0) <= now)
    // If every model is cooling down, try them all anyway rather than failing outright.
    const candidates = available.length > 0 ? available : models

    let lastError: unknown
    for (const model of candidates) {
        try {
            const config = options.attemptTimeoutMs
                ? { ...params.config, abortSignal: AbortSignal.timeout(options.attemptTimeoutMs) }
                : params.config
            const response = await ai.models.generateContent({ ...params, config, model })
            rateLimitedUntil.delete(model)
            return response
        } catch (error) {
            if (!isRetryableError(error) && !isTimeoutError(error)) throw error
            lastError = error
            if (isUnavailableOnTier(error)) {
                console.error(`[gemini] ${model} is not available on this API key's free tier. Enable billing in Google AI Studio.`)
            }
            rateLimitedUntil.set(model, Date.now() + RATE_LIMIT_COOLDOWN_MS)
            console.warn(`[gemini] ${model} ${isTimeoutError(error) ? "timed out" : "is rate limited or unavailable"}, trying next model`)
        }
    }
    console.error("[gemini] all models rate limited", lastError)
    throw new Error("The AI is busy right now. Please try again in a minute.")
}

/** Keeps prompts within a predictable cost/latency budget. */
export const MAX_DOCUMENT_CHARS = 60_000

/** Upper bound on scanned pages sent to the AI in a single PDF OCR request. */
export const MAX_OCR_PAGES = 12

let client: GoogleGenAI | null = null

function getClient() {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error("AI is not configured on this server.")
    client ??= new GoogleGenAI({ apiKey })
    return client
}

function truncateDocument(text: string): string {
    return text.length > MAX_DOCUMENT_CHARS ? text.slice(0, MAX_DOCUMENT_CHARS) : text
}

const quizResponseSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        questions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING },
                    options: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                    },
                },
                required: ["text", "options"],
            },
        },
    },
    required: ["title", "questions"],
}

export type GenerateMcqQuizInput = {
    topic: string
    questionCount: number
    difficulty: "easy" | "medium" | "hard"
}

export async function generateMcqQuiz(input: GenerateMcqQuizInput): Promise<McqQuiz> {

    const response = await generateContent({
        contents:
            `Create a ${input.difficulty} difficulty multiple-choice quiz about "${input.topic}" ` +
            `with exactly ${input.questionCount} questions. Each question must have exactly 4 distinct, ` +
            `plausible answer options in random order. Do not indicate which option is correct.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: quizResponseSchema,
        },
    })

    const text = response.text
    if (!text) throw new Error("The AI returned an empty response.")

    let parsed: { title?: string; questions?: { text?: string; options?: string[] }[] }
    try {
        parsed = JSON.parse(text)
    } catch {
        throw new Error("The AI returned an unreadable response.")
    }

    const questions = (parsed.questions ?? [])
        .filter(
            (q): q is { text: string; options: string[] } =>
                typeof q.text === "string" && q.text.trim().length > 0 && Array.isArray(q.options) && q.options.filter((o) => o.trim().length > 0).length >= 2
        )
        .slice(0, input.questionCount)
        .map((q) => ({
            id: crypto.randomUUID(),
            text: q.text.trim(),
            options: q.options
                .filter((o) => o.trim().length > 0)
                .slice(0, 8)
                .map((text) => ({ id: crypto.randomUUID(), text: text.trim() })),
        }))

    if (questions.length === 0) throw new Error("The AI did not return any usable questions.")

    return {
        title: parsed.title?.trim() || `${input.topic} Quiz`,
        questions,
    }
}

const summaryResponseSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING },
        keyPoints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
        },
    },
    required: ["summary", "keyPoints"],
}

export type DocumentSummary = { summary: string; keyPoints: string[] }

export async function summarizeDocument(text: string): Promise<DocumentSummary> {
    const document = truncateDocument(text)

    const response = await generateContent({
        contents:
            "Summarize the following document in a clear, concise paragraph (3-6 sentences), " +
            "then list the 4-8 most important key points as short bullet strings.\n\n" +
            `Document:\n"""\n${document}\n"""`,
        config: {
            responseMimeType: "application/json",
            responseSchema: summaryResponseSchema,
        },
    })

    const raw = response.text
    if (!raw) throw new Error("The AI returned an empty response.")

    let parsed: { summary?: string; keyPoints?: string[] }
    try {
        parsed = JSON.parse(raw)
    } catch {
        throw new Error("The AI returned an unreadable response.")
    }

    const summary = parsed.summary?.trim()
    if (!summary) throw new Error("The AI did not return a summary.")

    const keyPoints = (parsed.keyPoints ?? [])
        .map((point) => point.trim())
        .filter(Boolean)
        .slice(0, 10)

    return { summary, keyPoints }
}

const resumeResponseSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        email: { type: Type.STRING },
        phone: { type: Type.STRING },
        summary: { type: Type.STRING },
        skills: { type: Type.ARRAY, items: { type: Type.STRING } },
        experience: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    company: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    description: { type: Type.STRING },
                },
            },
        },
        education: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    degree: { type: Type.STRING },
                    institution: { type: Type.STRING },
                    year: { type: Type.STRING },
                },
            },
        },
    },
    required: ["skills", "experience", "education"],
}

export type ParsedResume = {
    name: string | null
    email: string | null
    phone: string | null
    summary: string | null
    skills: string[]
    experience: { title: string; company: string; duration: string | null; description: string | null }[]
    education: { degree: string; institution: string; year: string | null }[]
}

export async function parseResume(text: string): Promise<ParsedResume> {
    const document = truncateDocument(text)

    const response = await generateContent({
        contents:
            "Extract structured information from the following resume/CV text. " +
            "Leave a field empty rather than guessing if it is not present.\n\n" +
            `Resume:\n"""\n${document}\n"""`,
        config: {
            responseMimeType: "application/json",
            responseSchema: resumeResponseSchema,
        },
    })

    const raw = response.text
    if (!raw) throw new Error("The AI returned an empty response.")

    let parsed: {
        name?: string
        email?: string
        phone?: string
        summary?: string
        skills?: string[]
        experience?: { title?: string; company?: string; duration?: string; description?: string }[]
        education?: { degree?: string; institution?: string; year?: string }[]
    }
    try {
        parsed = JSON.parse(raw)
    } catch {
        throw new Error("The AI returned an unreadable response.")
    }

    return {
        name: parsed.name?.trim() || null,
        email: parsed.email?.trim() || null,
        phone: parsed.phone?.trim() || null,
        summary: parsed.summary?.trim() || null,
        skills: (parsed.skills ?? [])
            .map((skill) => skill.trim())
            .filter(Boolean)
            .slice(0, 30),
        experience: (parsed.experience ?? [])
            .map((entry) => ({
                title: entry.title?.trim() ?? "",
                company: entry.company?.trim() ?? "",
                duration: entry.duration?.trim() || null,
                description: entry.description?.trim() || null,
            }))
            .filter((entry) => entry.title && entry.company)
            .slice(0, 15),
        education: (parsed.education ?? [])
            .map((entry) => ({
                degree: entry.degree?.trim() ?? "",
                institution: entry.institution?.trim() ?? "",
                year: entry.year?.trim() || null,
            }))
            .filter((entry) => entry.degree && entry.institution)
            .slice(0, 10),
    }
}

export type ChatMessage = { role: "user" | "assistant"; content: string }

export async function answerFileQuestion(input: {
    documentText: string
    question: string
    history: ChatMessage[]
}): Promise<string> {
    const document = truncateDocument(input.documentText)

    const historyText = input.history
        .slice(-8)
        .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`)
        .join("\n")

    const response = await generateContent({
        contents:
            "You are answering questions about the document below. Only use information from the " +
            "document; if the answer isn't in it, say so clearly. Keep answers concise.\n\n" +
            `Document:\n"""\n${document}\n"""\n\n` +
            (historyText ? `Conversation so far:\n${historyText}\n\n` : "") +
            `User: ${input.question}`,
    })

    const answer = response.text?.trim()
    if (!answer) throw new Error("The AI returned an empty response.")

    return answer
}

export type OcrMode = "printed" | "handwritten"

export type OcrImageInput = {
    imageBase64: string
    mimeType: string
    mode: OcrMode
}

/** Keeps OCR output as plain, readable text instead of LaTeX/markdown math markup. */
const OCR_FORMATTING_RULE =
    "Write the output as plain text only — never use LaTeX or markdown math notation " +
    "(no $...$, \\rightarrow, \\times, ^{...}, _{...}, etc.). Render arrows, symbols, and " +
    "super/subscripts using plain Unicode characters instead (e.g. → for an arrow, " +
    "Na⁺ for a superscript plus, CO₂ for a subscript 2)."

export async function recognizeImageText(input: OcrImageInput): Promise<string> {

    const instruction =
        input.mode === "handwritten"
            ? "Transcribe all handwritten text in this image exactly as written, preserving line breaks " +
              "and layout as closely as possible. If a word is illegible, mark it with [illegible]. " +
              `${OCR_FORMATTING_RULE} Return only the transcribed text, with no commentary or explanation.`
            : "Extract all readable text from this image exactly as it appears, preserving line breaks " +
              `and layout as closely as possible. ${OCR_FORMATTING_RULE} Return only the extracted text, with no commentary or explanation.`

    const response = await generateContent({
        contents: [{ inlineData: { data: input.imageBase64, mimeType: input.mimeType } }, { text: instruction }],
    })

    const text = response.text?.trim()
    if (!text) throw new Error("No text could be recognized in this image.")

    return text
}

const pdfOcrResponseSchema = {
    type: Type.OBJECT,
    properties: {
        pages: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
        },
    },
    required: ["pages"],
}

export type OcrPageInput = { imageBase64: string; mimeType: string }

export async function recognizePdfPages(pages: OcrPageInput[]): Promise<string[]> {

    const pageParts: Part[] = pages.flatMap((page, index) => [
        { text: `Page ${index + 1}:` },
        { inlineData: { data: page.imageBase64, mimeType: page.mimeType } },
    ])

    const response = await generateContent({
        contents: [
            {
                text:
                    "Extract all readable text from each of the following scanned document page images, in order. " +
                    "Preserve line breaks and structure within each page as closely as possible. " +
                    `${OCR_FORMATTING_RULE} Return exactly ${pages.length} strings in the "pages" array, ` +
                    "one per page image, in the same order.",
            },
            ...pageParts,
        ],
        config: {
            responseMimeType: "application/json",
            responseSchema: pdfOcrResponseSchema,
        },
    })

    const raw = response.text
    if (!raw) throw new Error("The AI returned an empty response.")

    let parsed: { pages?: string[] }
    try {
        parsed = JSON.parse(raw)
    } catch {
        throw new Error("The AI returned an unreadable response.")
    }

    const result = (parsed.pages ?? []).map((page) => page.trim())
    if (result.length === 0) throw new Error("No text could be recognized in this document.")

    return result
}

/** Each translation request is kept small so output never hits the model's token cap. */
const TRANSLATE_CHUNK_CHARS = 6_000
const TRANSLATE_CONCURRENCY = 4

/** Splits text on paragraph (then line) boundaries into chunks of at most `max` characters. */
function splitIntoChunks(text: string, max: number): string[] {
    const chunks: string[] = []
    let current = ""

    const push = (piece: string, separator: string) => {
        if (current && current.length + separator.length + piece.length > max) {
            chunks.push(current)
            current = ""
        }
        current = current ? current + separator + piece : piece
    }

    for (const paragraph of text.split(/\n{2,}/)) {
        if (paragraph.length <= max) {
            push(paragraph, "\n\n")
            continue
        }
        // Very long paragraph: fall back to lines, then hard slices.
        paragraph.split("\n").forEach((line, lineIndex) => {
            const separator = lineIndex === 0 ? "\n\n" : "\n"
            if (line.length <= max) {
                push(line, separator)
            } else {
                for (let i = 0; i < line.length; i += max) push(line.slice(i, i + max), i === 0 ? separator : "")
            }
        })
    }
    if (current) chunks.push(current)
    return chunks
}

async function translateChunk(chunk: string, targetLanguage: string, sourceLanguage: string | null): Promise<string> {
    const from = sourceLanguage ? `from ${sourceLanguage} ` : ""
    const response = await generateContent({
        contents:
            `Translate the following document text ${from}into ${targetLanguage}. ` +
            "Keep the meaning, tone, and formatting: preserve every line break, blank line, list marker, " +
            "number, and heading order. Translate every sentence and label, including words that appear next to " +
            "links. Leave only the URLs, email addresses, code snippets, and brand names themselves unchanged. " +
            "If some text is already in the target language, keep it as is. " +
            "Return only the translated text, with no commentary, notes, or quotation marks around it.\n\n" +
            `Text:\n"""\n${chunk}\n"""`,
    })

    const translated = response.text?.trim()
    if (!translated) throw new Error("The AI returned an empty translation.")
    return translated.replace(/^"""\s*|\s*"""$/g, "")
}

export type TranslateDocumentInput = {
    text: string
    /** Human-readable target language name, e.g. "Hindi". */
    targetLanguage: string
    /** Human-readable source language name, or null to auto-detect. */
    sourceLanguage: string | null
}

export async function translateDocument(input: TranslateDocumentInput): Promise<string> {
    const chunks = splitIntoChunks(input.text.trim(), TRANSLATE_CHUNK_CHARS)
    const results: string[] = new Array(chunks.length)

    let next = 0
    async function worker() {
        while (next < chunks.length) {
            const index = next++
            results[index] = await translateChunk(chunks[index], input.targetLanguage, input.sourceLanguage)
        }
    }

    await Promise.all(Array.from({ length: Math.min(TRANSLATE_CONCURRENCY, chunks.length) }, worker))
    return results.join("\n\n")
}

const videoSummaryResponseSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING },
        keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
        chapters: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    // MM:SS strings: Gemini reads video timestamps far more accurately in this form than as raw seconds.
                    start: { type: Type.STRING },
                    title: { type: Type.STRING },
                    summary: { type: Type.STRING },
                },
                required: ["start", "title"],
            },
        },
    },
    required: ["summary", "keyPoints", "chapters"],
}

/** Two attempts (primary + fallback model) must fit inside the route's maxDuration. */
const VIDEO_ATTEMPT_TIMEOUT_MS = 120_000
/** Videos up to this length are sampled at 1 frame/s for sharper timestamps; longer ones at 0.5 to save tokens. */
const VIDEO_FULL_FPS_MAX_SECONDS = 20 * 60

export type VideoChapter = { startSeconds: number; title: string; summary: string | null }
export type VideoSummary = { summary: string; keyPoints: string[]; chapters: VideoChapter[] }

export type SummarizeYouTubeInput = {
    videoUrl: string
    /** Only the first `maxSeconds` of the video are sent to the model (cost and latency cap). */
    maxSeconds: number
    /** The video's real length, when known. Used to keep chapter timestamps inside the video. */
    durationSeconds: number | null
    detail: "short" | "detailed"
    /** Human-readable output language, e.g. "Hindi". */
    language: string
}

function formatClock(totalSeconds: number): string {
    const s = Math.max(0, Math.floor(totalSeconds))
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = String(s % 60).padStart(2, "0")
    return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${String(m).padStart(2, "0")}:${sec}`
}

/** Accepts "MM:SS", "H:MM:SS", "1m30s", or a bare number of seconds. */
function parseClock(value: unknown): number | null {
    if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? value : null
    if (typeof value !== "string") return null
    const text = value.trim()
    if (/^\d+(\.\d+)?$/.test(text)) return Number(text)
    const clock = /^(?:(\d+):)?(\d{1,3}):(\d{1,2})(?:\.\d+)?$/.exec(text)
    if (clock) return Number(clock[1] ?? 0) * 3600 + Number(clock[2]) * 60 + Number(clock[3])
    const units = /^(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?$/i.exec(text)
    if (units && (units[1] || units[2] || units[3])) {
        return Number(units[1] ?? 0) * 3600 + Number(units[2] ?? 0) * 60 + Number(units[3] ?? 0)
    }
    return null
}

/**
 * Makes model-reported chapter starts trustworthy: sorted, unique, starting at 0 and inside the
 * part of the video that was actually watched. If the model's timeline overshoots the video
 * (e.g. 7:00 chapters for a 4:00 video) but its order looks right, it is scaled back to fit
 * instead of throwing most chapters away.
 */
function normalizeChapters(
    raw: { start: number; title: string; summary: string | null }[],
    limitSeconds: number,
    durationKnown: boolean
): VideoChapter[] {
    let chapters = [...raw].sort((a, b) => a.start - b.start)
    if (chapters.length === 0) return []

    const lastStart = chapters[chapters.length - 1].start
    const outOfRange = chapters.filter((c) => c.start >= limitSeconds).length
    if (durationKnown && outOfRange > 0) {
        if (outOfRange >= 2 || outOfRange / chapters.length > 0.25) {
            // Whole timeline is stretched: rescale so the last chapter starts a little before the end.
            const target = limitSeconds * 0.9
            const scale = target / Math.max(lastStart, 1)
            chapters = chapters.map((c) => ({ ...c, start: c.start * scale }))
        } else {
            chapters = chapters.filter((c) => c.start < limitSeconds)
        }
    } else {
        chapters = chapters.filter((c) => c.start < limitSeconds)
    }

    const result: VideoChapter[] = []
    for (const c of chapters) {
        const startSeconds = Math.round(c.start)
        // Drop duplicates and chapters squeezed within a few seconds of the previous one.
        if (result.length > 0 && startSeconds - result[result.length - 1].startSeconds < 5) continue
        result.push({ startSeconds, title: c.title, summary: c.summary })
    }
    if (result.length > 0) result[0].startSeconds = 0
    return result.slice(0, 30)
}

export async function summarizeYouTubeVideo(input: SummarizeYouTubeInput): Promise<VideoSummary> {
    const duration = input.durationSeconds && input.durationSeconds > 0 ? input.durationSeconds : null
    // The span the model actually watches.
    const watchedSeconds = duration ? Math.min(duration, input.maxSeconds) : input.maxSeconds
    const truncated = !duration || duration > input.maxSeconds

    const length =
        input.detail === "detailed"
            ? "a thorough summary of 2-4 paragraphs, 6-12 key points, and a chapter for each major section"
            : "a concise summary of 3-5 sentences, 4-6 key points, and 3-8 chapters"

    const timing = duration
        ? truncated
            ? `You are given only the first ${formatClock(watchedSeconds)} of a ${formatClock(duration)} video. `
            : `The video is exactly ${formatClock(duration)} long. `
        : ""
    const lastAllowed = formatClock(Math.max(0, watchedSeconds - 1))

    const response = await generateContent({
        contents: [
            {
                fileData: { fileUri: input.videoUrl },
                videoMetadata: {
                    ...(truncated ? { endOffset: `${input.maxSeconds}s` } : {}),
                    fps: watchedSeconds <= VIDEO_FULL_FPS_MAX_SECONDS ? 1 : 0.5,
                },
            },
            {
                text:
                    timing +
                    `Summarize this video using what is said and shown. Write ${length}. ` +
                    "Each chapter needs `start` (the MM:SS timestamp, or H:MM:SS, where the section begins, read from the video's own timeline), " +
                    "a short title, and a one-sentence summary. Chapters must be in chronological order, the first starts at 00:00, " +
                    `and no timestamp may be later than ${lastAllowed}. ` +
                    `Write everything in ${input.language}. Do not invent details or timestamps that are not in the video.`,
            },
        ],
        config: {
            mediaResolution: MediaResolution.MEDIA_RESOLUTION_LOW,
            responseMimeType: "application/json",
            responseSchema: videoSummaryResponseSchema,
        },
    }, { attemptTimeoutMs: VIDEO_ATTEMPT_TIMEOUT_MS })

    const raw = response.text
    if (!raw) throw new Error("The AI returned an empty response.")

    let parsed: {
        summary?: string
        keyPoints?: string[]
        chapters?: { start?: unknown; startSeconds?: unknown; title?: string; summary?: string }[]
    }
    try {
        parsed = JSON.parse(raw)
    } catch {
        throw new Error("The AI returned an unreadable response.")
    }

    const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : ""
    if (!summary) throw new Error("The AI did not return a summary.")

    const rawChapters = (Array.isArray(parsed.chapters) ? parsed.chapters : []).flatMap((c) => {
        const start = parseClock(c?.start ?? c?.startSeconds)
        const title = typeof c?.title === "string" ? c.title.trim() : ""
        if (start === null || !title) return []
        return [{ start, title, summary: typeof c.summary === "string" && c.summary.trim() ? c.summary.trim() : null }]
    })

    return {
        summary,
        keyPoints: (Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [])
            .filter((p): p is string => typeof p === "string")
            .map((p) => p.trim())
            .filter(Boolean)
            .slice(0, 15),
        chapters: normalizeChapters(rawChapters, watchedSeconds, duration !== null),
    }
}

export type TranscribeAudioInput = { audioBase64: string; mimeType: string }

export async function transcribeAudio(input: TranscribeAudioInput): Promise<string> {

    const response = await generateContent({
        contents: [
            { inlineData: { data: input.audioBase64, mimeType: input.mimeType } },
            {
                text:
                    "Transcribe all speech in this audio accurately. Use natural punctuation and start a new " +
                    "paragraph when the speaker or topic changes. Write the transcript as plain text only — no " +
                    "timestamps and no speaker labels unless a speaker change is clearly identifiable. " +
                    "If there is no discernible speech, say so briefly instead of transcribing silence or noise. " +
                    "Return only the transcript, with no commentary or explanation.",
            },
        ],
    })

    const text = response.text?.trim()
    if (!text) throw new Error("No speech could be transcribed from this audio.")

    return text
}

const subtitleResponseSchema = {
    type: Type.OBJECT,
    properties: {
        cues: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    // MM:SS.s strings: Gemini places audio timestamps more accurately in this form than as raw seconds.
                    start: { type: Type.STRING },
                    end: { type: Type.STRING },
                    text: { type: Type.STRING },
                },
                required: ["start", "end", "text"],
            },
        },
    },
    required: ["cues"],
}

/** Two attempts (primary + fallback model) must fit inside the subtitles route's maxDuration. */
const SUBTITLE_ATTEMPT_TIMEOUT_MS = 75_000

export type GenerateSubtitlesInput = {
    audioBase64: string
    mimeType: string
    /** Length of this audio part in seconds. */
    durationSeconds: number
    style: SubtitleStyle
    /** Human-readable target language, or null to keep the spoken language. */
    language: string | null
}

/** Transcribes one audio part into timed subtitle cues, with times relative to the part's start. */
export async function generateSubtitles(input: GenerateSubtitlesInput): Promise<SubtitleCue[]> {
    const rules = SUBTITLE_STYLE_RULES[input.style]
    const length = formatClock(input.durationSeconds)
    const languageRule = input.language
        ? `Translate the speech into ${input.language}; keep the timing of the original speech.`
        : "Write the subtitles in the language that is spoken (do not translate). If several languages are mixed, write each part as spoken."
    const styleRule =
        input.style === "short"
            ? "Make short, punchy captions for vertical videos: 2 to 5 words each, at most 3 seconds on screen."
            : `Make standard subtitles: one sentence or clause per cue, at most ${rules.maxLineChars * rules.maxLines} characters and ${rules.maxCueSeconds} seconds each.`

    const response = await generateContent({
        contents: [
            { inlineData: { data: input.audioBase64, mimeType: input.mimeType } },
            {
                text:
                    `This audio is ${length} long. Create subtitles for all speech in it. ${styleRule} ` +
                    "Give each cue `start` and `end` as MM:SS.s timestamps measured from the start of this audio " +
                    "(e.g. 01:07.5), marking exactly when the words begin and end. Cues must be in order, must not overlap, " +
                    `and no timestamp may be later than ${length}. Cover every spoken word; skip silence, music, and noise ` +
                    "(no [music] tags). Use natural punctuation. " +
                    `${languageRule} If there is no speech at all, return an empty list.`,
            },
        ],
        config: {
            responseMimeType: "application/json",
            responseSchema: subtitleResponseSchema,
        },
    }, { attemptTimeoutMs: SUBTITLE_ATTEMPT_TIMEOUT_MS })

    const raw = response.text
    if (!raw) throw new Error("The AI returned an empty response.")

    let parsed: { cues?: RawCue[] }
    try {
        parsed = JSON.parse(raw)
    } catch {
        throw new Error("The AI returned an unreadable response.")
    }

    return normalizeCues(Array.isArray(parsed.cues) ? parsed.cues : [], input.durationSeconds, input.style)
}

const atsResponseSchema = {
    type: Type.OBJECT,
    properties: {
        jobTitle: { type: Type.STRING },
        keywords: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    term: { type: Type.STRING },
                    aliases: { type: Type.ARRAY, items: { type: Type.STRING } },
                    importance: { type: Type.STRING, enum: ["required", "preferred"] },
                    category: {
                        type: Type.STRING,
                        enum: ["skill", "tool", "certification", "qualification", "soft_skill", "domain"],
                    },
                },
                required: ["term", "aliases", "importance", "category"],
            },
        },
        experienceScore: { type: Type.NUMBER },
        experienceNote: { type: Type.STRING },
        impactScore: { type: Type.NUMBER },
        impactNote: { type: Type.STRING },
        fixes: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    priority: { type: Type.STRING, enum: ["high", "medium", "low"] },
                    section: { type: Type.STRING },
                    issue: { type: Type.STRING },
                    fix: { type: Type.STRING },
                },
                required: ["priority", "section", "issue", "fix"],
            },
        },
        bulletRewrites: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: { original: { type: Type.STRING }, improved: { type: Type.STRING } },
                required: ["original", "improved"],
            },
        },
        tailoredSummary: { type: Type.STRING },
    },
    required: ["keywords", "experienceScore", "experienceNote", "impactScore", "impactNote", "fixes", "bulletRewrites", "tailoredSummary"],
}

/** Two attempts (primary + fallback model) must fit inside the ats-check route's maxDuration. */
const ATS_ATTEMPT_TIMEOUT_MS = 50_000

export type ResumeJobAnalysis = {
    jobTitle: string | null
    keywords: JobKeyword[]
    experienceScore: number
    experienceNote: string | null
    impactScore: number
    impactNote: string | null
    fixes: ResumeFix[]
    bulletRewrites: BulletRewrite[]
    tailoredSummary: string | null
}

const KEYWORD_IMPORTANCE = new Set(["required", "preferred"])
const KEYWORD_CATEGORIES = new Set(["skill", "tool", "certification", "qualification", "soft_skill", "domain"])
const FIX_PRIORITIES = new Set(["high", "medium", "low"])

function clampScore(value: unknown): number {
    const n = Number(value)
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 50
}

/**
 * Reads a resume (and optionally a job description) the way a recruiter and an ATS would.
 * Returns raw judgements only; keyword matching and the final score are computed in lib/ats.ts.
 */
export async function analyzeResumeForJob(input: { resumeText: string; jobText: string | null }): Promise<ResumeJobAnalysis> {
    const hasJob = Boolean(input.jobText)
    const instructions = hasJob
        ? [
              "You are an expert recruiter and ATS (applicant tracking system) specialist. Compare the resume with the job description.",
              "keywords: the 12-30 most important hard skills, tools, certifications, qualifications, and domain terms an ATS would scan for in THIS JOB DESCRIPTION (never take them from the resume). Copy each `term` exactly as written in the job description. `aliases` are common alternative spellings or abbreviations (e.g. JavaScript → JS; Amazon Web Services → AWS). Mark `required` if the job says must/required or it is central to the role, otherwise `preferred`. Include at most 3 soft skills.",
              "jobTitle: the job title from the job description.",
              "experienceScore (0-100): how well the candidate's years, seniority, role history, and domain match what the job asks for. experienceNote: one or two sentences explaining it, naming the main gap if there is one.",
          ]
        : [
              "You are an expert recruiter and ATS (applicant tracking system) specialist. Review this resume on its own (no job description was given).",
              "keywords: return an empty list. jobTitle: the role the resume targets, if clear.",
              "experienceScore (0-100): how clearly and convincingly the resume presents the candidate's experience and progression for the role they target. experienceNote: one or two sentences explaining it.",
          ]

    const response = await generateContent({
        contents:
            instructions.join("\n") +
            "\nimpactScore (0-100): how well the bullet points show concrete achievements (action verbs, outcomes, numbers) rather than duties. impactNote: one sentence." +
            "\nfixes: 5-10 specific, actionable fixes ordered by impact on getting shortlisted. Each names the resume section, the issue, and exactly what to change" +
            (hasJob ? ", including where to naturally add missing job keywords the candidate plausibly has" : "") +
            ". Use priority high for things that will get the resume rejected." +
            "\nbulletRewrites: 3-5 of the weakest bullet points from the resume. `original` must be copied word for word from the resume. `improved` rewrites it with a strong action verb and a result" +
            (hasJob ? ", using the job's wording where truthful" : "") +
            ". Never invent numbers, employers, tools, or achievements: where a metric is needed but unknown, use a placeholder like [X%] or [N users]." +
            "\ntailoredSummary: a 2-3 sentence professional summary for the top of this resume" +
            (hasJob ? " aimed at this job" : "") +
            ", using only facts from the resume." +
            "\nBe honest and consistent; do not inflate scores. Write in English." +
            `\n\nResume:\n"""\n${truncateDocument(input.resumeText)}\n"""` +
            (hasJob ? `\n\nJob description:\n"""\n${truncateDocument(input.jobText as string)}\n"""` : ""),
        config: {
            temperature: 0,
            responseMimeType: "application/json",
            responseSchema: atsResponseSchema,
        },
    }, { attemptTimeoutMs: ATS_ATTEMPT_TIMEOUT_MS })

    const raw = response.text
    if (!raw) throw new Error("The AI returned an empty response.")

    let parsed: Record<string, unknown>
    try {
        parsed = JSON.parse(raw)
    } catch {
        throw new Error("The AI returned an unreadable response.")
    }

    const str = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null)
    const list = (value: unknown) => (Array.isArray(value) ? (value as Record<string, unknown>[]) : [])

    const keywords: JobKeyword[] = hasJob
        ? list(parsed.keywords).flatMap((k) => {
              const term = str(k?.term)
              if (!term || term.length > 60) return []
              return [{
                  term,
                  aliases: (Array.isArray(k.aliases) ? k.aliases : []).map(str).filter((a): a is string => Boolean(a)).slice(0, 5),
                  importance: KEYWORD_IMPORTANCE.has(k.importance as string) ? (k.importance as JobKeyword["importance"]) : "preferred",
                  category: KEYWORD_CATEGORIES.has(k.category as string) ? (k.category as JobKeyword["category"]) : "skill",
              }]
          }).slice(0, 30)
        : []

    const fixes: ResumeFix[] = list(parsed.fixes).flatMap((f) => {
        const issue = str(f?.issue)
        const fix = str(f?.fix)
        if (!issue || !fix) return []
        return [{
            priority: FIX_PRIORITIES.has(f.priority as string) ? (f.priority as FixPriority) : "medium",
            section: str(f.section) ?? "General",
            issue,
            fix,
        }]
    })
    const order: Record<FixPriority, number> = { high: 0, medium: 1, low: 2 }
    fixes.sort((a, b) => order[a.priority] - order[b.priority])

    // Only keep rewrites of lines that really are in the resume (the AI sometimes paraphrases or invents them).
    const resumeLoose = looseText(input.resumeText)
    const bulletRewrites: BulletRewrite[] = list(parsed.bulletRewrites).flatMap((b) => {
        const original = str(b?.original)
        const improved = str(b?.improved)
        if (!original || !improved || looseText(original) === looseText(improved)) return []
        const probe = looseText(original).slice(0, 40)
        return probe.length >= 15 && resumeLoose.includes(probe) ? [{ original, improved }] : []
    })

    return {
        jobTitle: str(parsed.jobTitle),
        keywords,
        experienceScore: clampScore(parsed.experienceScore),
        experienceNote: str(parsed.experienceNote),
        impactScore: clampScore(parsed.impactScore),
        impactNote: str(parsed.impactNote),
        fixes: fixes.slice(0, 10),
        bulletRewrites: bulletRewrites.slice(0, 5),
        tailoredSummary: str(parsed.tailoredSummary),
    }
}

const studySetResponseSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        questions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctIndex: { type: Type.INTEGER },
                    explanation: { type: Type.STRING },
                    quote: { type: Type.STRING },
                    page: { type: Type.INTEGER },
                },
                required: ["question", "options", "correctIndex", "explanation"],
            },
        },
        flashcards: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    front: { type: Type.STRING },
                    back: { type: Type.STRING },
                    page: { type: Type.INTEGER },
                },
                required: ["front", "back"],
            },
        },
    },
    required: ["title", "questions", "flashcards"],
}

/** Two attempts (primary + fallback model) must fit inside the study-set route's maxDuration. */
const STUDY_ATTEMPT_TIMEOUT_MS = 90_000

export type GenerateStudySetInput = {
    /** Either extracted text (with "[Page N]" markers for PDFs) or a scanned PDF. */
    source: { kind: "text"; text: string } | { kind: "pdf"; base64: string }
    /** Pages in the source, when known, to validate page references. */
    pageCount: number | null
    questionCount: number
    cardCount: number
    difficulty: StudyDifficulty
    /** Human-readable output language, or null for the document's own language. */
    language: string | null
    fileName: string | null
}

export async function generateStudySet(input: GenerateStudySetInput): Promise<Omit<StudySet, "truncated">> {
    const difficulty =
        input.difficulty === "mixed"
            ? "a mix of easy recall, medium understanding, and hard application questions"
            : `${input.difficulty} questions`
    const hasPages = input.source.kind === "pdf" || /\[Page \d+\]/.test(input.source.kind === "text" ? input.source.text : "")

    const instructions = [
        "You are an expert teacher creating study material from the document provided. Use only facts stated in the document; never add outside knowledge.",
        "Cover the whole document evenly, from beginning to end, focusing on the most important concepts, definitions, facts, causes and effects, and processes. Skip trivia such as page numbers, headers, author names, and references.",
        input.questionCount > 0
            ? `questions: exactly ${input.questionCount} multiple-choice questions, ${difficulty}. Each has exactly 4 options: one clearly correct answer and 3 plausible but clearly wrong distractors of similar length and style. No "all of the above" or "none of the above". correctIndex is the 0-based index of the correct option. explanation: one or two sentences on why it is correct. quote: a short passage (10-25 words) copied word for word from the document that supports the answer, in the document's original language.${hasPages ? " page: the page number where it appears ([Page N] markers)." : ""}`
            : "questions: return an empty list.",
        input.cardCount > 0
            ? `flashcards: exactly ${input.cardCount} flashcards. front: a key term, concept, or short question. back: a concise, self-contained answer or definition (at most 2 sentences).${hasPages ? " page: the page number it comes from." : ""} Don't repeat the quiz questions word for word.`
            : "flashcards: return an empty list.",
        `title: a short title for this study set${input.fileName ? ` (the file is called "${input.fileName}")` : ""}.`,
        input.language
            ? `Write the title, questions, options, explanations, and flashcards in ${input.language}.`
            : "Write everything in the same language as the document.",
    ].join("\n")

    const contents =
        input.source.kind === "pdf"
            ? [{ inlineData: { data: input.source.base64, mimeType: "application/pdf" } }, { text: instructions }]
            : `${instructions}\n\nDocument:\n"""\n${input.source.text}\n"""`

    const response = await generateContent({
        contents,
        config: {
            temperature: 0.4,
            responseMimeType: "application/json",
            responseSchema: studySetResponseSchema,
        },
    }, { attemptTimeoutMs: STUDY_ATTEMPT_TIMEOUT_MS })

    const raw = response.text
    if (!raw) throw new Error("The AI returned an empty response.")

    let parsed: { title?: unknown; questions?: RawQuestion[]; flashcards?: RawFlashcard[] }
    try {
        parsed = JSON.parse(raw)
    } catch {
        throw new Error("The AI returned an unreadable response.")
    }

    const newId = () => crypto.randomUUID()
    const questions = normalizeQuestions(Array.isArray(parsed.questions) ? parsed.questions : [], {
        sourceText: input.source.kind === "text" ? input.source.text : null,
        pageCount: input.pageCount,
        max: input.questionCount,
        newId,
    })
    const flashcards = normalizeFlashcards(Array.isArray(parsed.flashcards) ? parsed.flashcards : [], {
        pageCount: input.pageCount,
        max: input.cardCount,
        newId,
    })

    if (questions.length === 0 && flashcards.length === 0) {
        throw new Error("The AI did not return any usable questions or flashcards.")
    }

    const title = typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim().slice(0, 120) : "Study set"
    return { title, questions, flashcards }
}

/**
 * Image models, tried in order. Override with comma-separated GEMINI_IMAGE_MODELS.
 * HD (Pro accounts) uses the higher-quality model at 2K, falling back to the standard chain.
 */
const IMAGE_MODELS = (process.env.GEMINI_IMAGE_MODELS ?? "gemini-3.1-flash-image,gemini-2.5-flash-image")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean)
const IMAGE_HD_MODEL = process.env.GEMINI_IMAGE_HD_MODEL ?? "gemini-3-pro-image"

/** Two attempts must fit inside the photo-edit route's maxDuration. */
const IMAGE_ATTEMPT_TIMEOUT_MS = 75_000

/** The model answered but produced no image (safety block, refusal, or it only replied in text). */
export class ImageEditRefusedError extends Error {}

export type EditPhotoInput = {
    image: { data: string; mimeType: string }
    /** The same photo with the area to edit painted over, for brush edits. */
    markedImage: { data: string; mimeType: string } | null
    prompt: string
    aspectRatio: string
    quality: PhotoEditQuality
}

export async function editPhoto(input: EditPhotoInput): Promise<{ data: string; mimeType: string }> {
    const instructions = input.markedImage
        ? "You are a professional photo editor. The first image is the photo to edit. The second image is the same photo " +
          "with the area to change painted over in bright magenta. Apply this edit ONLY to that marked area, blending it " +
          `seamlessly with its surroundings: ${input.prompt}\n` +
          "Return the full edited version of the FIRST image, with no magenta marks. Keep everything outside the marked area " +
          "exactly as it is, with the same framing, perspective, lighting, and resolution."
        : "You are a professional photo editor. Edit this photo as follows: " +
          `${input.prompt}\n` +
          "Change only what the edit requires. Keep the framing, perspective, and all other details the same, and keep " +
          "people's faces and identities exactly as they are unless asked otherwise. Make the result photorealistic."

    const contents = [
        { inlineData: input.image },
        ...(input.markedImage ? [{ inlineData: input.markedImage }] : []),
        { text: instructions },
    ]

    const hd = input.quality === "hd"
    const response = await generateContent(
        {
            contents,
            config: {
                responseModalities: ["IMAGE", "TEXT"],
                imageConfig: { aspectRatio: input.aspectRatio, ...(hd ? { imageSize: "2K" } : {}) },
            },
        },
        { attemptTimeoutMs: IMAGE_ATTEMPT_TIMEOUT_MS, models: hd ? [IMAGE_HD_MODEL, ...IMAGE_MODELS] : IMAGE_MODELS }
    )

    const candidate = response.candidates?.[0]
    const parts = candidate?.content?.parts ?? []
    // Thinking models can return draft images marked `thought`; the final image is the last non-thought one.
    const image = parts.filter((part) => part.inlineData?.data && !part.thought).at(-1)?.inlineData
    if (image?.data) return { data: image.data, mimeType: image.mimeType ?? "image/png" }

    const reason = response.promptFeedback?.blockReason ?? candidate?.finishReason ?? "NO_IMAGE"
    const text = parts.map((part) => (part.thought ? "" : part.text ?? "")).join(" ").trim()
    console.warn("[gemini] image edit returned no image", { reason, text: text.slice(0, 300) })
    throw new ImageEditRefusedError(String(reason))
}
