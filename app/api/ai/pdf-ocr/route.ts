import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-provider"
import { consumeAiQuota } from "@/lib/ai/ai-quota"
import { recognizePdfPages, MAX_OCR_PAGES, type OcrPageInput } from "@/lib/ai/gemini"

export const dynamic = "force-dynamic"

const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"])
// Base64 inflates size by ~33%; keeps each decoded page image under ~6 MB.
const MAX_BASE64_CHARS_PER_PAGE = 8_000_000

function parsePages(input: unknown): OcrPageInput[] | null {
    if (!Array.isArray(input) || input.length === 0 || input.length > MAX_OCR_PAGES) return null

    const pages: OcrPageInput[] = []
    for (const item of input) {
        const imageBase64 = typeof item?.imageBase64 === "string" ? item.imageBase64 : ""
        const mimeType = typeof item?.mimeType === "string" ? item.mimeType : ""

        if (!imageBase64 || imageBase64.length > MAX_BASE64_CHARS_PER_PAGE || !ALLOWED_MIME_TYPES.has(mimeType)) {
            return null
        }

        pages.push({ imageBase64, mimeType })
    }

    return pages
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    if (!userId) {
        return NextResponse.json({ ok: false, error: "Sign in to run OCR on PDFs with AI." }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const pages = parsePages(body?.pages)

    if (!pages) {
        return NextResponse.json(
            {
                ok: false,
                error: `Upload a scanned PDF with 1-${MAX_OCR_PAGES} pages (each page under 6 MB).`,
            },
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
        const result = await recognizePdfPages(pages)
        return NextResponse.json({ ok: true, pages: result, quota })
    } catch (error) {
        console.error("[AI_PDF_OCR_ERROR]", error)
        return NextResponse.json(
            { ok: false, error: "AI text recognition failed. Please try again." },
            { status: 500 }
        )
    }
}
