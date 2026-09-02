import { GoogleGenAI, Type } from "@google/genai"
import type { McqQuiz } from "@/lib/pdf-form-types"

const MODEL = "gemini-3.5-flash-lite"

let client: GoogleGenAI | null = null

function getClient() {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error("AI is not configured on this server.")
    client ??= new GoogleGenAI({ apiKey })
    return client
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
