import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-provider"
import { consumeAiQuota } from "@/lib/ai/ai-quota"
import { recognizeImageText, type OcrMode } from "@/lib/ai/gemini"

export const dynamic = "force-dynamic"

const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"])
// Base64 inflates size by ~33%; this keeps the decoded image under ~12 MB.
const MAX_BASE64_CHARS = 16_000_000

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    if (!userId) {
        return NextResponse.json({ ok: false, error: "Sign in to extract text with AI." }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const imageBase64 = typeof body?.imageBase64 === "string" ? body.imageBase64 : ""
    const mimeType = typeof body?.mimeType === "string" ? body.mimeType : ""
    const mode: OcrMode = body?.mode === "handwritten" ? "handwritten" : "printed"

    if (!imageBase64 || imageBase64.length > MAX_BASE64_CHARS) {
        return NextResponse.json(
            { ok: false, error: "Upload an image under 12 MB." },
            { status: 400 }
        )
    }

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        return NextResponse.json(
            { ok: false, error: "Upload a PNG, JPG, WEBP, or HEIC image." },
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
        const text = await recognizeImageText({ imageBase64, mimeType, mode })
        return NextResponse.json({ ok: true, text, quota })
    } catch (error) {
        console.error("[AI_OCR_ERROR]", error)
        return NextResponse.json(
            { ok: false, error: "AI text recognition failed. Please try again." },
            { status: 500 }
        )
    }
}
