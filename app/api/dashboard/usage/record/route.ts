import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { ToolType } from "@prisma/client";
import { z } from "zod";
import { authOptions } from "@/lib/auth-provider";
import { recordCompletedJob } from "@/lib/usage";
import { findToolBySlug } from "@/lib/tools-data";

const recordSchema = z.object({
    toolSlug: z.string().regex(/^[a-z0-9-]{1,64}$/),
    filesCount: z.number().int().min(1),
    originalBytes: z.number().min(0),
    outputBytes: z.number().min(0),
    formats: z.array(z.string().regex(/^[a-z0-9]{1,8}$/)).max(10).default([]),
});

const TOOL_TYPES_BY_SLUG: Record<string, ToolType> = {
    "image-compressor": ToolType.IMAGE_COMPRESS,
    "pdf-compress": ToolType.PDF_COMPRESS,
    "pdf-merge": ToolType.MERGE_PDF,
    "pdf-split": ToolType.SPLIT_PDF,
    "jpg-to-pdf": ToolType.JPG_TO_PDF,
    "pdf-to-jpg": ToolType.PDF_TO_JPG,
    "pdf-to-word": ToolType.PDF_TO_WORD,
    "word-to-pdf": ToolType.WORD_TO_PDF,
    "pdf-unlock": ToolType.UNLOCK_PDF,
};

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Guests use tools too; there is just nothing to record for them.
    if (!userId) return new NextResponse(null, { status: 204 });

    const parsed = recordSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const tool = findToolBySlug(parsed.data.toolSlug);
    if (!tool) {
        return NextResponse.json({ error: "Unknown tool" }, { status: 400 });
    }

    try {
        await recordCompletedJob({
            userId,
            toolType: TOOL_TYPES_BY_SLUG[tool.slug] ?? ToolType.OTHER,
            toolSlug: tool.slug,
            toolName: tool.name,
            filesCount: parsed.data.filesCount,
            originalBytes: Math.round(parsed.data.originalBytes),
            outputBytes: Math.round(parsed.data.outputBytes),
            formats: parsed.data.formats,
        });
    } catch (error) {
        console.error("[USAGE_RECORD_ERROR]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}
