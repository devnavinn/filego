import { completeUsageJob, startUsageJob, ToolType } from "@/lib/usage-client";

type RunTrackedToolOptions<T> = {
    toolType: ToolType;
    filesCount: number;
    originalBytes: number;
    source?: string;
    startMetadata?: Record<string, unknown>;
    completeMetadata?: Record<string, unknown>;
    run: () => Promise<T>;
    getResult: (result: T) => {
        outputBytes: number;
        savedBytes: number;
        compressionRate?: number | null;
        status?: "COMPLETED" | "FAILED";
    };
};

export async function runTrackedTool<T>(options: RunTrackedToolOptions<T>) {
    const usageJob = await startUsageJob({
        toolType: options.toolType,
        filesCount: options.filesCount,
        originalBytes: options.originalBytes,
        source: options.source ?? "web",
        metadata: options.startMetadata,
    });

    try {
        const result = await options.run();

        const summary = options.getResult(result);

        if (usageJob?.jobId) {
            await completeUsageJob({
                jobId: usageJob.jobId,
                outputBytes: summary.outputBytes,
                savedBytes: summary.savedBytes,
                compressionRate: summary.compressionRate ?? null,
                status: summary.status ?? "COMPLETED",
                metadata: options.completeMetadata,
            });
        }

        return result;
    } catch (error) {
        if (usageJob?.jobId) {
            await completeUsageJob({
                jobId: usageJob.jobId,
                outputBytes: 0,
                savedBytes: 0,
                compressionRate: null,
                status: "FAILED",
            });
        }

        throw error;
    }
}