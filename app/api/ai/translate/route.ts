import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-provider"
import { consumeAiQuota } from "@/lib/ai/ai-quota"
import { translateDocument } from "@/lib/ai/gemini"
import { getUserPlan } from "@/lib/entitlements"
import { AUTO_DETECT, TRANSLATE_CHAR_LIMITS, findTranslateLanguage } from "@/lib/translate-languages"

export const dynamic = "force-dynamic"
// Long documents are translated in several parallel chunks.
export const maxDuration = 120

const MIN_CHARS = 2

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    if (!userId) {
        return NextResponse.json({ ok: false, error: "Sign in to translate documents with AI." }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const text = typeof body?.text === "string" ? body.text.trim() : ""
    const target = findTranslateLanguage(typeof body?.targetLanguage === "string" ? body.targetLanguage : "")
    const sourceCode = typeof body?.sourceLanguage === "string" ? body.sourceLanguage : AUTO_DETECT
    const source = sourceCode === AUTO_DETECT ? null : findTranslateLanguage(sourceCode)

    if (!target || (sourceCode !== AUTO_DETECT && !source)) {
        return NextResponse.json({ ok: false, error: "Choose a supported language." }, { status: 400 })
    }

    if (source && source.code === target.code) {
        return NextResponse.json({ ok: false, error: "Source and target languages are the same." }, { status: 400 })
    }

    const plan = await getUserPlan(userId)
    const maxChars = plan.tier === "pro" ? TRANSLATE_CHAR_LIMITS.pro : TRANSLATE_CHAR_LIMITS.free

    if (text.length < MIN_CHARS) {
        return NextResponse.json({ ok: false, error: "There's no text to translate in this file." }, { status: 400 })
    }

    if (text.length > maxChars) {
        return NextResponse.json(
            {
                ok: false,
                error:
                    plan.tier === "pro"
                        ? `This document is too long. Translate up to ${maxChars.toLocaleString()} characters at a time.`
                        : `Free accounts can translate up to ${maxChars.toLocaleString()} characters per document. Upgrade to Pro for up to ${TRANSLATE_CHAR_LIMITS.pro.toLocaleString()}.`,
                code: "too-long",
            },
            { status: 413 }
        )
    }

    const quota = await consumeAiQuota(userId)

    if (!quota.allowed) {
        return NextResponse.json(
            { ok: false, error: "You've reached today's AI generation limit. Upgrade for more.", quota },
            { status: 429 }
        )
    }

    try {
        const translation = await translateDocument({
            text,
            targetLanguage: target.label,
            sourceLanguage: source?.label ?? null,
        })
        return NextResponse.json({ ok: true, result: { translation }, quota })
    } catch (error) {
        console.error("[AI_TRANSLATE_ERROR]", error)
        const message =
            error instanceof Error && error.message.startsWith("The AI is busy")
                ? error.message
                : "AI translation failed. Please try again."
        return NextResponse.json({ ok: false, error: message }, { status: 500 })
    }
}
