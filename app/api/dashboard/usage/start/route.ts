import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-provider";
import { prisma } from "@/lib/prisma";
import { JobStatus, ToolType } from "@prisma/client";
import { z } from "zod";
import { Prisma } from "@prisma/client";
const startSchema = z.object({
    toolType: z.nativeEnum(ToolType),
    filesCount: z.number().int().min(1),
    originalBytes: z.number().int().min(0),
    source: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const parsed = startSchema.safeParse(body);

        if (!parsed.success) {
            console.log("[USAGE_START_VALIDATION_ERROR]", parsed.error.flatten());
            return NextResponse.json(
                { error: "Invalid payload", details: parsed.error.flatten() },
                { status: 400 }
            );
        }
        const session = await getServerSession(authOptions);
        const userId =
            (session as { id?: string; user?: { id?: string } } | null)?.id ??
            (session as { user?: { id?: string } } | null)?.user?.id ??
            null;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { toolType, filesCount, originalBytes, source, metadata } = parsed.data;
        const sessionUserId =
            (session as { id?: string; user?: { id?: string } } | null)?.id ??
            (session as { user?: { id?: string } } | null)?.user?.id ??
            null;
        const job = await prisma.toolJob.create({
            data: {
                toolType,
                filesCount,
                originalBytes: BigInt(originalBytes),
                status: JobStatus.PROCESSING,
                startedAt: new Date(),
                source: source ?? "web",
                metadata: ((metadata ?? {}) as Prisma.InputJsonValue),
                userId: sessionUserId,
                isGuest: !sessionUserId,
                guestSessionId: sessionUserId ? null : crypto.randomUUID(),
            },
            select: {
                id: true,
            },
        });

        console.log("[USAGE_START_CREATED]", job);

        return NextResponse.json({ jobId: job.id });
    } catch (error) {
        console.error("[USAGE_START_ERROR]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}