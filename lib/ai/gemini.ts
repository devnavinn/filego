import { GoogleGenAI, Type } from "@google/genai"
import type { McqQuiz } from "@/lib/pdf-form-types"

const MODEL = "gemini-3.5-flash-lite"

/** Keeps prompts within a predictable cost/latency budget on the lite model. */
export const MAX_DOCUMENT_CHARS = 60_000

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
    const ai = getClient()

    const response = await ai.models.generateContent({
        model: MODEL,
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
    const ai = getClient()
    const document = truncateDocument(text)

    const response = await ai.models.generateContent({
        model: MODEL,
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
    const ai = getClient()
    const document = truncateDocument(text)

    const response = await ai.models.generateContent({
        model: MODEL,
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
    const ai = getClient()
    const document = truncateDocument(input.documentText)

    const historyText = input.history
        .slice(-8)
        .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`)
        .join("\n")

    const response = await ai.models.generateContent({
        model: MODEL,
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
