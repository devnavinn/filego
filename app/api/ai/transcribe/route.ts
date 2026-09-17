import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-provider"
import { consumeAiQuota } from "@/lib/ai/ai-quota"
import { transcribeAudio } from "@/lib/ai/gemini"

export const dynamic = "force-dynamic"

const ALLOWED_MIME_TYPES = new Set([
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/mp4",
    "audio/x-m4a",
    "audio/aac",
    "audio/ogg",
    "audio/webm",
    "audio/flac",
])
// Base64 inflates size by ~33%; this keeps the decoded audio under ~12 MB.
const MAX_BASE64_CHARS = 16_000_000

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    if (!userId) {
        return NextResponse.json({ ok: false, error: "Sign in to transcribe audio with AI." }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const audioBase64 = typeof body?.audioBase64 === "string" ? body.audioBase64 : ""
    const mimeType = typeof body?.mimeType === "string" ? body.mimeType : ""

    if (!audioBase64 || audioBase64.length > MAX_BASE64_CHARS) {
        return NextResponse.json({ ok: false, error: "Upload an audio file under 12 MB." }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        return NextResponse.json(
            { ok: false, error: "Upload an MP3, WAV, M4A, AAC, OGG, or FLAC audio file." },
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
        const text = await transcribeAudio({ audioBase64, mimeType })
        return NextResponse.json({ ok: true, text, quota })
    } catch (error) {
        console.error("[AI_TRANSCRIBE_ERROR]", error)
        return NextResponse.json(
            { ok: false, error: "AI transcription failed. Please try again." },
            { status: 500 }
        )
    }
}
