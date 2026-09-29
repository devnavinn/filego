// Records tool downloads for the signed-in user's dashboard. Downloads made in
// quick succession on the same tool (batch exports) are grouped into one job.

const BATCH_WINDOW_MS = 1500;

type PendingBatch = {
    toolSlug: string;
    filesCount: number;
    originalBytes: number;
    outputBytes: number;
    formats: Set<string>;
    timer: ReturnType<typeof setTimeout>;
};

const trackedBlobs = new WeakSet<Blob>();
let pending: PendingBatch | null = null;
let listening = false;

export type DownloadUsage = {
    /** Size of the input file(s), so compressors can report space saved. */
    originalBytes?: number;
};

/** The tool slug for the current page, or null when not on a tool page. */
function currentToolSlug() {
    const segments = window.location.pathname.split("/").filter(Boolean);

    if (segments[0] === "tools" && segments.length === 3) return segments[2];
    if (segments.length === 1 && segments[0] !== "dashboard") return segments[0];
    return null;
}

function flush() {
    if (!pending) return;

    const batch = pending;
    pending = null;
    clearTimeout(batch.timer);

    fetch("/api/dashboard/usage/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        keepalive: true,
        body: JSON.stringify({
            toolSlug: batch.toolSlug,
            filesCount: batch.filesCount,
            originalBytes: batch.originalBytes,
            outputBytes: batch.outputBytes,
            formats: [...batch.formats],
        }),
    }).catch(() => {
        // Tracking must never break a download.
    });
}

export function trackDownload(blob: Blob, filename: string, usage?: DownloadUsage) {
    if (typeof window === "undefined" || trackedBlobs.has(blob)) return;
    trackedBlobs.add(blob);

    const toolSlug = currentToolSlug();
    if (!toolSlug) return;

    if (!listening) {
        listening = true;
        window.addEventListener("pagehide", flush);
    }

    if (pending && pending.toolSlug !== toolSlug) flush();

    pending ??= {
        toolSlug,
        filesCount: 0,
        originalBytes: 0,
        outputBytes: 0,
        formats: new Set(),
        timer: setTimeout(flush, BATCH_WINDOW_MS),
    };

    pending.filesCount += 1;
    pending.outputBytes += blob.size;
    pending.originalBytes += usage?.originalBytes ?? 0;

    const ext = filename.match(/\.([a-z0-9]{1,8})$/i)?.[1];
    if (ext) pending.formats.add(ext.toLowerCase());

    clearTimeout(pending.timer);
    pending.timer = setTimeout(flush, BATCH_WINDOW_MS);
}
