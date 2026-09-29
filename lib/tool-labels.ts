// Client-safe display names for tracked jobs.

export const TOOL_TYPE_LABELS: Record<string, string> = {
    IMAGE_COMPRESS: "Image Compressor",
    BULK_IMAGE_COMPRESS: "Bulk Image Compressor",
    PDF_COMPRESS: "PDF Compress",
    MERGE_PDF: "Merge PDF",
    SPLIT_PDF: "Split PDF",
    JPG_TO_PDF: "JPG to PDF",
    PDF_TO_JPG: "PDF to JPG",
    PDF_TO_WORD: "PDF to Word",
    WORD_TO_PDF: "Word to PDF",
    UNLOCK_PDF: "PDF Unlock",
    OTHER: "Other tool",
};

/** Tool name stored by download tracking, falling back to the enum label. */
export function jobToolLabel(job: { toolType: string; metadata?: unknown }) {
    const meta = job.metadata;
    if (meta && typeof meta === "object" && !Array.isArray(meta)) {
        const name = (meta as Record<string, unknown>).toolName;
        if (typeof name === "string" && name) return name;
    }
    return TOOL_TYPE_LABELS[job.toolType] ?? job.toolType.replaceAll("_", " ");
}
