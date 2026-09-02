import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-provider"
import { consumeAiQuota } from "@/lib/ai/ai-quota"
import { answerFileQuestion, type ChatMessage } from "@/lib/ai/gemini"

export const dynamic = "force-dynamic"

const MIN_DOC_CHARS = 20
const MAX_DOC_CHARS = 200_000
const MAX_QUESTION_CHARS = 2_000
const MAX_HISTORY_MESSAGES = 20

function parseHistory(input: unknown): ChatMessage[] {
    if (!Array.isArray(input)) return []

    return input
        .filter(
            (item): item is { role: string; content: string } =>
                item &&
                typeof item === "object" &&
                (item.role === "user" || item.role === "assistant") &&
                typeof item.content === "string"
        )
        .slice(-MAX_HISTORY_MESSAGES)
        .map((item) => ({ role: item.role as "user" | "assistant", content: item.content.slice(0, MAX_QUESTION_CHARS) }))
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    if (!userId) {
        return NextResponse.json(
            { ok: false, error: "Sign in to chat with your files using AI." },
            { status: 401 }
        )
    }

    const body = await req.json().catch(() => null)
    const documentText = typeof body?.documentText === "string" ? body.documentText.trim() : ""
    const question = typeof body?.question === "string" ? body.question.trim() : ""
    const history = parseHistory(body?.history)

    if (documentText.length < MIN_DOC_CHARS || documentText.length > MAX_DOC_CHARS) {
        return NextResponse.json(
            { ok: false, error: "Upload a document with readable text first." },
            { status: 400 }
        )
    }

    if (!question || question.length > MAX_QUESTION_CHARS) {
        return NextResponse.json(
            { ok: false, error: `Ask a question up to ${MAX_QUESTION_CHARS.toLocaleString()} characters.` },
            { status: 400 }
        )
    }

    const quota = await consumeAiQuota(userId)

    if (!quota.allowed) {
        return NextResponse.json(
            {
                ok: false,
                error: "You've reached today's AI generation limit. Upgrade for more.",
                quota,
            },
            { status: 429 }
        )
    }

    try {
        const answer = await answerFileQuestion({ documentText, question, history })
        return NextResponse.json({ ok: true, answer, quota })
    } catch (error) {
        console.error("[AI_FILE_CHAT_ERROR]", error)
        return NextResponse.json(
            { ok: false, error: "AI failed to answer. Please try again." },
            { status: 500 }
        )
    }
}
