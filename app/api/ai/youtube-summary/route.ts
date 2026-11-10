import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-provider"
import { consumeAiQuota, refundAiQuota } from "@/lib/ai/ai-quota"
import { summarizeYouTubeVideo } from "@/lib/ai/gemini"
import { getUserPlan } from "@/lib/entitlements"
import { findTranslateLanguage } from "@/lib/translate-languages"
import { YOUTUBE_MINUTE_LIMITS, parseYouTubeVideoId, youTubeWatchUrl } from "@/lib/youtube"

export const dynamic = "force-dynamic"
// Watching a long video can take a couple of minutes, plus one fallback attempt.
export const maxDuration = 300

type VideoInfo = { title: string; author: string | null; thumbnailUrl: string | null }

/** Confirms the video exists and is public/embeddable before spending AI quota on it. */
async function fetchVideoInfo(videoId: string): Promise<VideoInfo | null> {
    const endpoint = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(youTubeWatchUrl(videoId))}`
    try {
        const res = await fetch(endpoint, { signal: AbortSignal.timeout(10_000), cache: "no-store" })
        if (!res.ok) return null
        const data = await res.json()
        if (typeof data?.title !== "string") return null
        return {
            title: data.title,
            author: typeof data.author_name === "string" ? data.author_name : null,
            thumbnailUrl: typeof data.thumbnail_url === "string" ? data.thumbnail_url : null,
        }
    } catch {
        return null
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    if (!userId) {
        return NextResponse.json({ ok: false, error: "Sign in to summarize videos with AI." }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const videoId = parseYouTubeVideoId(typeof body?.url === "string" ? body.url : "")
    const language = findTranslateLanguage(typeof body?.language === "string" ? body.language : "en")
    const detail = body?.detail === "detailed" ? "detailed" : "short"

    if (!videoId) {
        return NextResponse.json({ ok: false, error: "Paste a valid YouTube video link." }, { status: 400 })
    }
    if (!language) {
        return NextResponse.json({ ok: false, error: "Choose a supported language." }, { status: 400 })
    }

    const video = await fetchVideoInfo(videoId)
    if (!video) {
        return NextResponse.json(
            { ok: false, error: "We couldn't open this video. Make sure it's public (not private or age-restricted)." },
            { status: 404 }
        )
    }

    const plan = await getUserPlan(userId)
    const maxMinutes = plan.tier === "pro" ? YOUTUBE_MINUTE_LIMITS.pro : YOUTUBE_MINUTE_LIMITS.free

    const quota = await consumeAiQuota(userId)
    if (!quota.allowed) {
        return NextResponse.json(
            { ok: false, error: "You've reached today's AI generation limit. Upgrade for more.", quota },
            { status: 429 }
        )
    }

    try {
        const summary = await summarizeYouTubeVideo({
            videoUrl: youTubeWatchUrl(videoId),
            maxSeconds: maxMinutes * 60,
            detail,
            language: language.label,
        })
        return NextResponse.json({
            ok: true,
            result: { videoId, ...video, maxMinutes, ...summary },
            quota,
        })
    } catch (error) {
        console.error("[AI_YOUTUBE_SUMMARY_ERROR]", error)
        // The user got nothing back, so don't charge them for it.
        await refundAiQuota(userId)
        const message =
            error instanceof Error && error.message.startsWith("The AI is busy")
                ? error.message
                : "AI couldn't summarize this video. Please try again."
        return NextResponse.json({ ok: false, error: message }, { status: 502 })
    }
}
