import {
    BillingStatus,
    JobStatus,
    PlanType,
    Prisma,
    ToolType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

type StartUsageInput = {
    userId?: string;
    guestSessionId?: string;
    toolType: ToolType;
    filesCount?: number;
    mimeTypes?: string[];
    source?: string;
    metadata?: Prisma.InputJsonValue;
};

type CompleteUsageInput = {
    jobId: string;
    files: Array<{
        fileName: string;
        inputFormat?: string;
        outputFormat?: string;
        originalBytes: number;
        outputBytes: number;
        width?: number;
        height?: number;
        pages?: number;
        durationMs?: number;
        status?: JobStatus;
    }>;
};

export async function startUsageJob(input: StartUsageInput) {
    const job = await prisma.toolJob.create({
        data: {
            userId: input.userId,
            guestSessionId: input.guestSessionId,
            isGuest: !input.userId,
            toolType: input.toolType,
            status: JobStatus.PROCESSING,
            filesCount: input.filesCount ?? 1,
            mimeTypes: input.mimeTypes ?? [],
            source: input.source ?? "web",
            metadata: input.metadata,
            startedAt: new Date(),
        },
        select: {
            id: true,
            toolType: true,
            status: true,
            createdAt: true,
        },
    });

    return job;
}

export async function completeUsageJob(input: CompleteUsageInput) {
    const job = await prisma.toolJob.findUnique({
        where: { id: input.jobId },
        select: {
            id: true,
            userId: true,
            toolType: true,
        },
    });

    if (!job) {
        throw new Error("Job not found");
    }

    const totals = input.files.reduce(
        (acc, file) => {
            const saved = Math.max(0, file.originalBytes - file.outputBytes);
            acc.originalBytes += file.originalBytes;
            acc.outputBytes += file.outputBytes;
            acc.savedBytes += saved;
            return acc;
        },
        { originalBytes: 0, outputBytes: 0, savedBytes: 0 }
    );

    const compressionRate =
        totals.originalBytes > 0
            ? ((totals.originalBytes - totals.outputBytes) / totals.originalBytes) * 100
            : 0;

    await prisma.$transaction(async (tx) => {
        await tx.toolJobFile.createMany({
            data: input.files.map((file) => ({
                jobId: input.jobId,
                fileName: file.fileName,
                inputFormat: file.inputFormat,
                outputFormat: file.outputFormat,
                originalBytes: BigInt(file.originalBytes),
                outputBytes: BigInt(file.outputBytes),
                savedBytes: BigInt(Math.max(0, file.originalBytes - file.outputBytes)),
                width: file.width,
                height: file.height,
                pages: file.pages,
                durationMs: file.durationMs,
                status: file.status ?? JobStatus.COMPLETED,
            })),
        });

        await tx.toolJob.update({
            where: { id: input.jobId },
            data: {
                status: JobStatus.COMPLETED,
                filesCount: input.files.length,
                originalBytes: BigInt(totals.originalBytes),
                outputBytes: BigInt(totals.outputBytes),
                savedBytes: BigInt(totals.savedBytes),
                compressionRate,
                completedAt: new Date(),
            },
        });

        if (job.userId) {
            await tx.userUsageSummary.upsert({
                where: { userId: job.userId },
                create: {
                    userId: job.userId,
                    totalJobs: 1,
                    totalFiles: input.files.length,
                    totalOriginalBytes: BigInt(totals.originalBytes),
                    totalOutputBytes: BigInt(totals.outputBytes),
                    totalSavedBytes: BigInt(totals.savedBytes),
                    totalImageCompressions: isImageTool(job.toolType) ? input.files.length : 0,
                    totalPdfOperations: isPdfTool(job.toolType) ? input.files.length : 0,
                    lastActivityAt: new Date(),
                },
                update: {
                    totalJobs: { increment: 1 },
                    totalFiles: { increment: input.files.length },
                    totalOriginalBytes: { increment: BigInt(totals.originalBytes) },
                    totalOutputBytes: { increment: BigInt(totals.outputBytes) },
                    totalSavedBytes: { increment: BigInt(totals.savedBytes) },
                    totalImageCompressions: {
                        increment: isImageTool(job.toolType) ? input.files.length : 0,
                    },
                    totalPdfOperations: {
                        increment: isPdfTool(job.toolType) ? input.files.length : 0,
                    },
                    lastActivityAt: new Date(),
                },
            });
        }
    });

    return {
        jobId: input.jobId,
        compressionRate,
        ...totals,
    };
}

function isImageTool(toolType: ToolType) {
    return (
        toolType === ToolType.IMAGE_COMPRESS ||
        toolType === ToolType.BULK_IMAGE_COMPRESS
    );
}

const pdfTools: readonly ToolType[] = [
    ToolType.PDF_COMPRESS,
    ToolType.MERGE_PDF,
    ToolType.SPLIT_PDF,
    ToolType.JPG_TO_PDF,
    ToolType.PDF_TO_JPG,
    ToolType.PDF_TO_WORD,
    ToolType.WORD_TO_PDF,
    ToolType.UNLOCK_PDF,
];

function isPdfTool(toolType: ToolType) {
    return pdfTools.includes(toolType);
}

export async function ensureFreeEntitlements(userId: string) {
    const sub = await prisma.subscription.findFirst({
        where: {
            userId,
            billingStatus: BillingStatus.ACTIVE,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    if (sub) return sub;

    return prisma.subscription.create({
        data: {
            userId,
            planType: PlanType.FREE,
            billingStatus: BillingStatus.ACTIVE,
            provider: "system",
            amount: 0,
            currency: "INR",
            startsAt: new Date(),
            purchasedAt: new Date(),
        },
    });
}