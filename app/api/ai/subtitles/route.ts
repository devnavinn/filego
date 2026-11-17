import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-provider"
import { consumeAiQuota, refundAiQuota } from "@/lib/ai/ai-quota"
import { generateSubtitles } from "@/lib/ai/gemini"
import { createSubtitleJobToken, verifySubtitleJobToken } from "@/lib/ai/subtitle-job"
import { getUserPlan } from "@/lib/entitlements"
import {
    SUBTITLE_CHUNK_MAX_SECONDS,
    SUBTITLE_CHUNK_SEARCH_SECONDS,
    SUBTITLE_CHUNK_TARGET_SECONDS,
    SUBTITLE_MINUTE_LIMITS,
} from "@/lib/subtitles"
import { findTranslateLanguage } from "@/lib/translate-languages"

export const dynamic = "force-dynamic"
// One audio part (~5 min) per request, plus one fallback-model attempt.
export const maxDuration = 160

/**
 * The browser extracts a small mono MP3 with ffmpeg.wasm and sends it in ~5 minute parts,
 * which keeps each request under the hosting body-size limit and timestamps accurate.
 * ~32 kbps × 365 s ≈ 1.5 MB, ≈ 2 MB as base64; allow headroom for other bitrates.
 */
const MAX_PART_BASE64_CHARS = 3_500_000

function badRequest(error: string) {
    return NextResponse.json({ ok: false, error }, { status: 400 })
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
        return NextResponse.json({ ok: false, error: "Sign in to generate subtitles with AI." }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const part = Number(body?.part)
    const partCount = Number(body?.partCount)
    const durationSeconds = Number(body?.durationSeconds)
    const totalSeconds = Number(body?.totalSeconds)
    const audioBase64 = typeof body?.audioBase64 === "string" ? body.audioBase64 : ""
    const style = body?.style === "short" ? "short" : "standard"
    const languageCode = typeof body?.language === "string" ? body.language : "original"
    const language = languageCode === "original" ? null : findTranslateLanguage(languageCode)

    if (!Number.isInteger(part) || !Number.isInteger(partCount) || part < 0 || part >= partCount) {
        return badRequest("Invalid audio part.")
    }
    if (!audioBase64 || audioBase64.length > MAX_PART_BASE64_CHARS) return badRequest("This audio part is too large.")
    if (!(durationSeconds > 0) || durationSeconds > SUBTITLE_CHUNK_MAX_SECONDS) return badRequest("Invalid audio part length.")
    if (languageCode !== "original" && !language) return badRequest("Choose a supported language.")

    let token: string | null = null

    if (part === 0) {
        const plan = await getUserPlan(userId)
        const maxMinutes = plan.tier === "pro" ? SUBTITLE_MINUTE_LIMITS.pro : SUBTITLE_MINUTE_LIMITS.free
        if (!(totalSeconds > 0) || totalSeconds > maxMinutes * 60 + 5) {
            return badRequest(
                plan.tier === "pro"
                    ? `Videos up to ${maxMinutes} minutes are supported.`
                    : `Free accounts can subtitle videos up to ${maxMinutes} minutes. Upgrade to Pro for up to ${SUBTITLE_MINUTE_LIMITS.pro} minutes.`
            )
        }
        // Every part except the last is at least target − search seconds long.
        const shortestPart = SUBTITLE_CHUNK_TARGET_SECONDS - SUBTITLE_CHUNK_SEARCH_SECONDS
        if (partCount > Math.ceil(totalSeconds / shortestPart) + 1) return badRequest("Invalid audio part count.")

        const quota = await consumeAiQuota(userId)
        if (!quota.allowed) {
            return NextResponse.json(
                { ok: false, error: "You've reached today's AI generation limit. Upgrade for more.", quota },
                { status: 429 }
            )
        }
        if (partCount > 1) token = createSubtitleJobToken(userId, partCount)
    } else {
        const jobToken = typeof body?.token === "string" ? body.token : ""
        if (!verifySubtitleJobToken(jobToken, userId, part)) {
            return NextResponse.json(
                { ok: false, error: "This subtitle job has expired. Please start again." },
                { status: 403 }
            )
        }
    }

    try {
        const cues = await generateSubtitles({
            audioBase64,
            mimeType: "audio/mpeg",
            durationSeconds,
            style,
            language: language?.label ?? null,
        })
        return NextResponse.json({ ok: true, cues, token })
    } catch (error) {
        console.error("[AI_SUBTITLES_ERROR]", { part, partCount }, error)
        // If the first part fails the user gets nothing, so give the credit back.
        if (part === 0) await refundAiQuota(userId)
        const message =
            error instanceof Error && error.message.startsWith("The AI is busy")
                ? error.message
                : "AI couldn't create subtitles for this part. Please try again."
        return NextResponse.json({ ok: false, error: message }, { status: 502 })
    }
}
