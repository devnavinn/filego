import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JobStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-provider";

const completeSchema = z.object({
    jobId: z.string().min(1),
    outputBytes: z.number().int().min(0),
    savedBytes: z.number().int().min(0),
    compressionRate: z.number().optional().nullable(),
    status: z.enum(["COMPLETED", "FAILED"]).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const parsed = completeSchema.safeParse(body);

        if (!parsed.success) {
            console.log("[USAGE_COMPLETE_VALIDATION_ERROR]", parsed.error.flatten());
            return NextResponse.json(
                { error: "Invalid payload", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const {
            jobId,
            outputBytes,
            savedBytes,
            compressionRate,
            status = "COMPLETED",
            metadata,
        } = parsed.data;

        const session = await getServerSession(authOptions);


        const isUser =
            (session as { id?: string; user?: { id?: string } } | null)?.id ??
            (session as { user?: { id?: string } } | null)?.user?.id ??
            null;

        if (!isUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const job = await prisma.toolJob.findUnique({
            where: { id: jobId },
        });


        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        const sessionUserId =
            (session as { id?: string; user?: { id?: string } } | null)?.id ??
            (session as { user?: { id?: string } } | null)?.user?.id ??
            null;

        const userId = job.userId ?? sessionUserId ?? null;

        const existingMetadata =
            job.metadata &&
                typeof job.metadata === "object" &&
                !Array.isArray(job.metadata)
                ? (job.metadata as Prisma.JsonObject)
                : {};

        const nextMetadata: Prisma.InputJsonValue | undefined =
            metadata && Object.keys(metadata).length > 0
                ? ({
                    ...existingMetadata,
                    ...metadata,
                } as Prisma.InputJsonValue)
                : undefined;

        await prisma.$transaction(async (tx) => {
            await tx.toolJob.update({
                where: { id: jobId },
                data: {
                    status:
                        status === "COMPLETED"
                            ? JobStatus.COMPLETED
                            : JobStatus.FAILED,
                    outputBytes: BigInt(outputBytes),
                    savedBytes: BigInt(savedBytes),
                    compressionRate: compressionRate ?? null,
                    completedAt: new Date(),
                    userId,
                    ...(nextMetadata !== undefined ? { metadata: nextMetadata } : {}),
                },
            });

            if (!userId) return;

            const incrementImage =
                job.toolType === "IMAGE_COMPRESS" ||
                job.toolType === "BULK_IMAGE_COMPRESS";

            const incrementPdf =
                job.toolType === "PDF_COMPRESS" ||
                job.toolType === "MERGE_PDF" ||
                job.toolType === "SPLIT_PDF" ||
                job.toolType === "JPG_TO_PDF" ||
                job.toolType === "PDF_TO_JPG" ||
                job.toolType === "PDF_TO_WORD" ||
                job.toolType === "WORD_TO_PDF" ||
                job.toolType === "UNLOCK_PDF";

            await tx.userUsageSummary.upsert({
                where: { userId },
                create: {
                    userId,
                    totalJobs: 1,
                    totalFiles: job.filesCount,
                    totalOriginalBytes: job.originalBytes,
                    totalOutputBytes: BigInt(outputBytes),
                    totalSavedBytes: BigInt(savedBytes),
                    totalImageCompressions: incrementImage ? 1 : 0,
                    totalPdfOperations: incrementPdf ? 1 : 0,
                    lastActivityAt: new Date(),
                },
                update: {
                    totalJobs: { increment: 1 },
                    totalFiles: { increment: job.filesCount },
                    totalOriginalBytes: { increment: job.originalBytes },
                    totalOutputBytes: { increment: BigInt(outputBytes) },
                    totalSavedBytes: { increment: BigInt(savedBytes) },
                    totalImageCompressions: incrementImage ? { increment: 1 } : undefined,
                    totalPdfOperations: incrementPdf ? { increment: 1 } : undefined,
                    lastActivityAt: new Date(),
                },
            });
        });
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("[USAGE_COMPLETE_ERROR]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}