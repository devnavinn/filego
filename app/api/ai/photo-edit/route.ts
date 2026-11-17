import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import sharp from "sharp"
import { authOptions } from "@/lib/auth-provider"
import { consumeAiQuota, refundAiQuota } from "@/lib/ai/ai-quota"
import { ImageEditRefusedError, editPhoto } from "@/lib/ai/gemini"
import { getUserPlan } from "@/lib/entitlements"
import { PHOTO_EDIT_MAX_BASE64, PHOTO_EDIT_MAX_PROMPT, closestAspectRatio, type PhotoEditQuality } from "@/lib/photo-edit"

export const dynamic = "force-dynamic"
// One image generation (can take ~30-60 s), plus one fallback-model attempt.
export const maxDuration = 170

/** Keeps the JSON response under the host's ~4.5 MB limit. */
const MAX_OUTPUT_BYTES = 3_000_000

function badRequest(error: string) {
    return NextResponse.json({ ok: false, error }, { status: 400 })
}

/** Decodes and checks an uploaded image; re-encodes it as JPEG so the model always gets a clean, known format. */
async function readImage(base64: unknown): Promise<{ data: string; width: number; height: number } | null> {
    if (typeof base64 !== "string" || !base64 || base64.length > PHOTO_EDIT_MAX_BASE64) return null
    try {
        const input = Buffer.from(base64, "base64")
        const image = sharp(input, { limitInputPixels: 50_000_000 }).rotate()
        const { width, height } = await image.metadata()
        if (!width || !height) return null
        const output = await image.jpeg({ quality: 92 }).toBuffer({ resolveWithObject: true })
        return { data: output.data.toString("base64"), width: output.info.width, height: output.info.height }
    } catch {
        return null
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
        return NextResponse.json({ ok: false, error: "Sign in to edit photos with AI." }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : ""
    if (prompt.length < 3) return badRequest("Describe the edit you want.")
    if (prompt.length > PHOTO_EDIT_MAX_PROMPT) return badRequest(`Keep the instruction under ${PHOTO_EDIT_MAX_PROMPT} characters.`)

    const image = await readImage(body?.image)
    if (!image) return badRequest("Upload a JPG, PNG, or WebP photo (up to about 2 MB after resizing).")
    const marked = body?.marked ? await readImage(body.marked) : null
    if (body?.marked && !marked) return badRequest("Couldn't read the brushed area. Please try again.")

    const plan = await getUserPlan(userId)
    const quality: PhotoEditQuality = body?.quality === "hd" && plan.tier === "pro" ? "hd" : "standard"

    const quota = await consumeAiQuota(userId)
    if (!quota.allowed) {
        return NextResponse.json(
            { ok: false, error: "You've reached today's AI generation limit. Upgrade for more.", quota },
            { status: 429 }
        )
    }

    try {
        const result = await editPhoto({
            image: { data: image.data, mimeType: "image/jpeg" },
            markedImage: marked ? { data: marked.data, mimeType: "image/jpeg" } : null,
            prompt,
            aspectRatio: closestAspectRatio(image.width, image.height),
            quality,
        })

        // Models usually return PNG; JPEG keeps photos small enough to send back.
        let output = await sharp(Buffer.from(result.data, "base64")).jpeg({ quality: 92 }).toBuffer({ resolveWithObject: true })
        if (output.data.byteLength > MAX_OUTPUT_BYTES) {
            output = await sharp(output.data).jpeg({ quality: 80 }).toBuffer({ resolveWithObject: true })
        }

        return NextResponse.json({
            ok: true,
            image: output.data.toString("base64"),
            mimeType: "image/jpeg",
            width: output.info.width,
            height: output.info.height,
            quality,
            quota,
        })
    } catch (error) {
        await refundAiQuota(userId)
        if (error instanceof ImageEditRefusedError) {
            const blocked = /SAFETY|PROHIBITED|BLOCK|SPII|RECITATION/i.test(error.message)
            return NextResponse.json(
                {
                    ok: false,
                    error: blocked
                        ? "This edit was blocked by the AI's safety rules. Try a different photo or describe the edit differently."
                        : "The AI couldn't make this edit. Try describing it more specifically, e.g. \"remove the red car on the left\".",
                },
                { status: 422 }
            )
        }
        console.error("[AI_PHOTO_EDIT_ERROR]", error)
        const message =
            error instanceof Error && error.message.startsWith("The AI is busy")
                ? error.message
                : "AI couldn't edit this photo. Please try again."
        return NextResponse.json({ ok: false, error: message }, { status: 502 })
    }
}
