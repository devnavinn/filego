import { ApiError, GoogleGenAI, Type } from "@google/genai"
import type { GenerateContentParameters, GenerateContentResponse, Part } from "@google/genai"
import type { McqQuiz } from "@/lib/pdf-form-types"

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

async function generateContent(params: Omit<GenerateContentParameters, "model">): Promise<GenerateContentResponse> {
    const ai = getClient()
    const now = Date.now()
    const available = MODELS.filter((model) => (rateLimitedUntil.get(model) ?? 0) <= now)
    // If every model is cooling down, try them all anyway rather than failing outright.
    const candidates = available.length > 0 ? available : MODELS

    let lastError: unknown
    for (const model of candidates) {
        try {
            const response = await ai.models.generateContent({ ...params, model })
            rateLimitedUntil.delete(model)
            return response
        } catch (error) {
            if (!isRetryableError(error)) throw error
            lastError = error
            rateLimitedUntil.set(model, Date.now() + RATE_LIMIT_COOLDOWN_MS)
            console.warn(`[gemini] ${model} is rate limited or unavailable, trying next model`)
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
