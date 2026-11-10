// Client-safe YouTube URL helpers.

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/

/**
 * Extracts the 11-character video ID from any common YouTube URL form
 * (watch, youtu.be, shorts, live, embed, m./music.) or a bare ID. Returns null otherwise.
 */
export function parseYouTubeVideoId(input: string): string | null {
    const value = input.trim()
    if (VIDEO_ID.test(value)) return value

    let url: URL
    try {
        url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
    } catch {
        return null
    }

    const host = url.hostname.replace(/^(www|m|music)\./, "")
    let id: string | null = null

    if (host === "youtu.be") {
        id = url.pathname.split("/")[1] ?? null
    } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
        if (url.pathname === "/watch") {
            id = url.searchParams.get("v")
        } else {
            const [, kind, candidate] = url.pathname.split("/")
            if (["shorts", "live", "embed", "v"].includes(kind)) id = candidate ?? null
        }
    }

    return id && VIDEO_ID.test(id) ? id : null
}

export function youTubeWatchUrl(videoId: string, startSeconds?: number): string {
    const base = `https://www.youtube.com/watch?v=${videoId}`
    return startSeconds && startSeconds > 0 ? `${base}&t=${Math.floor(startSeconds)}s` : base
}

/** Formats seconds as m:ss or h:mm:ss. */
export function formatTimestamp(totalSeconds: number): string {
    const s = Math.max(0, Math.floor(totalSeconds))
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = String(s % 60).padStart(2, "0")
    return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`
}

/** How much of a video the AI watches per request: free accounts vs Pro (minutes). */
export const YOUTUBE_MINUTE_LIMITS = { free: 60, pro: 120 } as const
