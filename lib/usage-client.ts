export type ToolType =
    | "IMAGE_COMPRESS"
    | "BULK_IMAGE_COMPRESS"
    | "PDF_COMPRESS"
    | "MERGE_PDF"
    | "SPLIT_PDF"
    | "JPG_TO_PDF"
    | "PDF_TO_JPG"
    | "PDF_TO_WORD"
    | "WORD_TO_PDF"
    | "UNLOCK_PDF"
    | "OTHER";

export type StartUsagePayload = {
    toolType: ToolType;
    filesCount: number;
    originalBytes: number;
    source?: string;
    metadata?: Record<string, unknown>;
};

export type CompleteUsagePayload = {
    jobId: string;
    outputBytes: number;
    savedBytes: number;
    compressionRate?: number | null;
    status?: "COMPLETED" | "FAILED";
    metadata?: Record<string, unknown>;
};

export async function startUsageJob(payload: StartUsagePayload) {
    try {
        const res = await fetch("/api/dashboard/usage/start", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "same-origin",
            body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) return null;

        return data as { jobId: string };
    } catch (error) {
        console.error("startUsageJob error", error);
        return null;
    }
}

export async function completeUsageJob(payload: CompleteUsagePayload) {
    try {
        const res = await fetch("/api/dashboard/usage/complete", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "same-origin",
            body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => null);
        return data;
    } catch (error) {
        console.error("completeUsageJob error", error);
        return null;
    }
}