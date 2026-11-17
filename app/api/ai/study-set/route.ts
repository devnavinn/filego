import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-provider"
import { consumeAiQuota, refundAiQuota } from "@/lib/ai/ai-quota"
import { generateStudySet } from "@/lib/ai/gemini"
import { getUserPlan } from "@/lib/entitlements"
import { MAX_SCANNED_PDF_BYTES, MIN_SOURCE_CHARS, STUDY_LIMITS, type StudyDifficulty, type StudySet } from "@/lib/study-set"
import { findTranslateLanguage } from "@/lib/translate-languages"

export const dynamic = "force-dynamic"
// One generation, plus one fallback-model attempt.
export const maxDuration = 200

const DIFFICULTIES = new Set<StudyDifficulty>(["easy", "medium", "hard", "mixed"])

function badRequest(error: string) {
    return NextResponse.json({ ok: false, error }, { status: 400 })
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
        return NextResponse.json({ ok: false, error: "Sign in to create quizzes and flashcards with AI." }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const mode = body?.mode === "quiz" || body?.mode === "flashcards" ? body.mode : "both"
    const difficulty: StudyDifficulty = DIFFICULTIES.has(body?.difficulty) ? body.difficulty : "mixed"
    const languageCode = typeof body?.language === "string" ? body.language : "original"
    const language = languageCode === "original" ? null : findTranslateLanguage(languageCode)
    if (languageCode !== "original" && !language) return badRequest("Choose a supported language.")

    const plan = await getUserPlan(userId)
    const isPro = plan.tier === "pro"
    const limits = isPro ? STUDY_LIMITS.pro : STUDY_LIMITS.free

    const clampCount = (value: unknown, max: number) => Math.min(Math.max(Math.trunc(Number(value)) || 0, 0), max)
    const questionCount = mode === "flashcards" ? 0 : Math.max(1, clampCount(body?.questionCount, limits.maxQuestions))
    const cardCount = mode === "quiz" ? 0 : Math.max(1, clampCount(body?.cardCount, limits.maxCards))

    const pageCount = Number.isInteger(body?.pageCount) && body.pageCount > 0 ? (body.pageCount as number) : null
    const fileName = typeof body?.fileName === "string" ? body.fileName.slice(0, 120) : null

    let source: { kind: "text"; text: string } | { kind: "pdf"; base64: string }
    let truncated = false
    if (typeof body?.pdfBase64 === "string") {
        // Scanned PDFs: the browser already cut them down to the selected pages.
        if (body.pdfBase64.length > Math.ceil((MAX_SCANNED_PDF_BYTES * 4) / 3) + 1024) {
            return badRequest("This scanned PDF is too large. Select fewer pages.")
        }
        if (pageCount && pageCount > limits.maxScannedPages) {
            return badRequest(
                isPro
                    ? `Select up to ${limits.maxScannedPages} pages of a scanned PDF at a time.`
                    : `Free accounts can use up to ${limits.maxScannedPages} pages of a scanned PDF. Upgrade to Pro for ${STUDY_LIMITS.pro.maxScannedPages}.`
            )
        }
        source = { kind: "pdf", base64: body.pdfBase64 }
    } else {
        let text = typeof body?.text === "string" ? body.text.trim() : ""
        if (text.length < MIN_SOURCE_CHARS) return badRequest("Add more text: at least a few paragraphs are needed to make a quiz.")
        if (text.length > limits.maxChars) {
            text = text.slice(0, limits.maxChars)
            truncated = true
        }
        source = { kind: "text", text }
    }

    const quota = await consumeAiQuota(userId)
    if (!quota.allowed) {
        return NextResponse.json(
            { ok: false, error: "You've reached today's AI generation limit. Upgrade for more.", quota },
            { status: 429 }
        )
    }

    try {
        const set = await generateStudySet({
            source,
            pageCount,
            questionCount,
            cardCount,
            difficulty,
            language: language?.label ?? null,
            fileName,
        })
        const result: StudySet = { ...set, truncated }
        return NextResponse.json({ ok: true, set: result, quota })
    } catch (error) {
        console.error("[AI_STUDY_SET_ERROR]", { mode, source: source.kind }, error)
        await refundAiQuota(userId)
        const message =
            error instanceof Error && error.message.startsWith("The AI is busy")
                ? error.message
                : "AI couldn't create a quiz from this document. Please try again."
        return NextResponse.json({ ok: false, error: message }, { status: 502 })
    }
}
