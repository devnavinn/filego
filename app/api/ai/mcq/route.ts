import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-provider"
import { consumeAiQuota } from "@/lib/ai/ai-quota"
import { generateMcqQuiz } from "@/lib/ai/gemini"

export const dynamic = "force-dynamic"

const DIFFICULTIES = new Set(["easy", "medium", "hard"])

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    if (!userId) {
        return NextResponse.json(
            { ok: false, error: "Sign in to generate quizzes with AI." },
            { status: 401 }
        )
    }

    const body = await req.json().catch(() => null)
    const topic = typeof body?.topic === "string" ? body.topic.trim() : ""
    const questionCount = Math.min(Math.max(Math.trunc(Number(body?.questionCount)) || 5, 1), 15)
    const difficulty = DIFFICULTIES.has(body?.difficulty) ? body.difficulty : "medium"

    if (!topic || topic.length > 300) {
        return NextResponse.json(
            { ok: false, error: "Provide a topic (up to 300 characters)." },
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
        const quiz = await generateMcqQuiz({ topic, questionCount, difficulty })
        return NextResponse.json({ ok: true, quiz, quota })
    } catch (error) {
        console.error("[AI_MCQ_ERROR]", error)
        return NextResponse.json(
            { ok: false, error: "AI generation failed. Please try again." },
            { status: 500 }
        )
    }
}
