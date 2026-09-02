import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-provider"
import { consumeAiQuota } from "@/lib/ai/ai-quota"
import { summarizeDocument } from "@/lib/ai/gemini"

export const dynamic = "force-dynamic"

const MIN_CHARS = 40
const MAX_CHARS = 200_000

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    if (!userId) {
        return NextResponse.json(
            { ok: false, error: "Sign in to summarize documents with AI." },
            { status: 401 }
        )
    }

    const body = await req.json().catch(() => null)
    const text = typeof body?.text === "string" ? body.text.trim() : ""

    if (text.length < MIN_CHARS || text.length > MAX_CHARS) {
        return NextResponse.json(
            { ok: false, error: `Provide document text between ${MIN_CHARS} and ${MAX_CHARS.toLocaleString()} characters.` },
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
        const result = await summarizeDocument(text)
        return NextResponse.json({ ok: true, result, quota })
    } catch (error) {
        console.error("[AI_SUMMARIZE_ERROR]", error)
        return NextResponse.json(
            { ok: false, error: "AI summarization failed. Please try again." },
            { status: 500 }
        )
    }
}
