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

/** Parses an ISO 8601 duration like "PT1H3M34S" into seconds. */
export function parseIsoDuration(value: string): number | null {
    const match = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(value)
    if (!match) return null
    const [, d, h, m, s] = match.map((part) => Number(part ?? 0))
    const total = d * 86400 + h * 3600 + m * 60 + s
    return total > 0 ? total : null
}

/**
 * Server-only: reads the video's real length from its watch page (oEmbed doesn't expose it).
 * Returns null if YouTube doesn't answer or the page layout changes, so callers must cope without it.
 */
export async function fetchYouTubeDurationSeconds(videoId: string): Promise<number | null> {
    try {
        const res = await fetch(youTubeWatchUrl(videoId), {
            signal: AbortSignal.timeout(10_000),
            cache: "no-store",
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; FileGo/1.0)",
                "Accept-Language": "en-US,en;q=0.9",
                // Skip the EU cookie-consent interstitial, which has no video metadata.
                Cookie: "CONSENT=YES+1; SOCS=CAI",
            },
        })
        if (!res.ok) return null
        const html = await res.text()

        const seconds = /"lengthSeconds":"(\d+)"/.exec(html)?.[1]
        if (seconds && Number(seconds) > 0) return Number(seconds)

        const iso = /itemprop="duration" content="([^"]+)"/.exec(html)?.[1]
        if (iso) return parseIsoDuration(iso)

        const ms = /"approxDurationMs":"(\d+)"/.exec(html)?.[1]
        if (ms && Number(ms) > 0) return Math.round(Number(ms) / 1000)
        return null
    } catch {
        return null
    }
}
