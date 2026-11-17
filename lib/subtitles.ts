// Client-safe subtitle helpers shared by the Subtitle Generator tool and its API route.

export type SubtitleCue = { start: number; end: number; text: string }

/** "standard" suits YouTube (up to 2 lines of 42 chars); "short" suits Reels/Shorts (punchy 1-line captions). */
export type SubtitleStyle = "standard" | "short"

export const SUBTITLE_STYLE_RULES: Record<SubtitleStyle, { maxLineChars: number; maxLines: number; maxCueSeconds: number }> = {
    standard: { maxLineChars: 42, maxLines: 2, maxCueSeconds: 7 },
    short: { maxLineChars: 28, maxLines: 1, maxCueSeconds: 3 },
}

/** How much audio (minutes) one subtitle job may cover. */
export const SUBTITLE_MINUTE_LIMITS = { free: 30, pro: 120 } as const

/** Audio is split into parts of about this length so timestamps stay accurate and each upload stays small. */
export const SUBTITLE_CHUNK_TARGET_SECONDS = 300
/** A cut may move this far earlier to land on a pause instead of mid-word. */
export const SUBTITLE_CHUNK_SEARCH_SECONDS = 60
/** Hard cap on a single part, used by the API to reject oversized uploads. */
export const SUBTITLE_CHUNK_MAX_SECONDS = SUBTITLE_CHUNK_TARGET_SECONDS + SUBTITLE_CHUNK_SEARCH_SECONDS + 5

const MIN_CUE_SECONDS = 0.6
/** Comfortable reading speed used to guess a missing end time. */
const CHARS_PER_SECOND = 15

/** Accepts "MM:SS", "MM:SS.mmm", "H:MM:SS,mmm", "1m30s", or a bare number of seconds. */
export function parseClock(value: unknown): number | null {
    if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? value : null
    if (typeof value !== "string") return null
    const text = value.trim().replace(",", ".")
    if (/^\d+(\.\d+)?$/.test(text)) return Number(text)
    const clock = /^(?:(\d+):)?(\d{1,3}):(\d{1,2}(?:\.\d+)?)$/.exec(text)
    if (clock) return Number(clock[1] ?? 0) * 3600 + Number(clock[2]) * 60 + Number(clock[3])
    const units = /^(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+(?:\.\d+)?)s)?$/i.exec(text)
    if (units && (units[1] || units[2] || units[3])) {
        return Number(units[1] ?? 0) * 3600 + Number(units[2] ?? 0) * 60 + Number(units[3] ?? 0)
    }
    return null
}

function pad(value: number, size = 2) {
    return String(value).padStart(size, "0")
}

/** 3725.5 → "01:02:05,500" (SRT) or "01:02:05.500" (VTT). */
export function formatCueTime(seconds: number, separator: "," | "." = ","): string {
    const totalMs = Math.max(0, Math.round(seconds * 1000))
    const h = Math.floor(totalMs / 3_600_000)
    const m = Math.floor((totalMs % 3_600_000) / 60_000)
    const s = Math.floor((totalMs % 60_000) / 1000)
    return `${pad(h)}:${pad(m)}:${pad(s)}${separator}${pad(totalMs % 1000, 3)}`
}

export function toSrt(cues: SubtitleCue[]): string {
    return (
        cues
            .map((cue, i) => `${i + 1}\n${formatCueTime(cue.start)} --> ${formatCueTime(cue.end)}\n${cue.text}`)
            .join("\n\n") + "\n"
    )
}

export function toVtt(cues: SubtitleCue[]): string {
    const body = cues
        .map((cue) => `${formatCueTime(cue.start, ".")} --> ${formatCueTime(cue.end, ".")}\n${cue.text}`)
        .join("\n\n")
    return `WEBVTT\n\n${body}\n`
}

export function toPlainText(cues: SubtitleCue[]): string {
    return cues.map((cue) => cue.text.replace(/\n/g, " ")).join("\n")
}

/**
 * Splits words, in order, into `count` groups of roughly equal character length
 * (so a long sentence never leaves a one-word orphan at the end).
 */
function splitBalanced(words: string[], count: number): string[][] {
    const total = words.join(" ").length
    const groups: string[][] = Array.from({ length: count }, () => [])
    let position = 0
    for (const word of words) {
        const middle = position + word.length / 2
        groups[Math.min(count - 1, Math.floor((middle / total) * count))].push(word)
        position += word.length + 1
    }
    return groups.filter((g) => g.length > 0)
}

/** Balanced wrap into at most `maxLines` lines of `maxChars`, or null if the words don't fit. */
function wrapBalanced(words: string[], maxLines: number, maxChars: number): string[] | null {
    for (let lines = 1; lines <= Math.min(maxLines, words.length); lines++) {
        const wrapped = splitBalanced(words, lines).map((g) => g.join(" "))
        if (wrapped.every((line) => line.length <= maxChars)) return wrapped
    }
    // A single word longer than a line (e.g. a URL, or a script without spaces) can't be wrapped further.
    return words.length === 1 ? [words[0]] : null
}

/**
 * Splits one cue whose text doesn't fit the style into several evenly sized cues, sharing its
 * time span in proportion to text length, and wraps each into at most `maxLines` lines.
 */
function fitCue(cue: SubtitleCue, style: SubtitleStyle): SubtitleCue[] {
    const rules = SUBTITLE_STYLE_RULES[style]
    const words = cue.text.replace(/\s+/g, " ").trim().split(" ")
    const duration = cue.end - cue.start
    const capacity = rules.maxLineChars * rules.maxLines

    // Enough cues to fit the text, and to avoid one cue staying on screen too long.
    // (Short text is never split just for time; normalizeCues already caps how long it lingers.)
    const byTime = cue.text.length > rules.maxLineChars ? Math.ceil(duration / rules.maxCueSeconds) : 1
    let count = Math.max(Math.ceil(cue.text.length / capacity), byTime)
    count = Math.min(Math.max(1, count), words.length)

    let groups: string[][] = []
    for (; count <= words.length; count++) {
        const candidate = splitBalanced(words, count).map((g) => wrapBalanced(g, rules.maxLines, rules.maxLineChars))
        if (candidate.every((lines) => lines !== null)) {
            groups = candidate as string[][]
            break
        }
    }
    if (groups.length <= 1) return [{ ...cue, text: (groups[0] ?? [cue.text]).join("\n") }]

    const totalChars = groups.reduce((sum, g) => sum + g.join(" ").length, 0)
    const result: SubtitleCue[] = []
    let t = cue.start
    for (const group of groups) {
        const share = (group.join(" ").length / totalChars) * duration
        result.push({ start: t, end: t + share, text: group.join("\n") })
        t += share
    }
    result[result.length - 1].end = cue.end
    return result
}

export type RawCue = { start?: unknown; end?: unknown; text?: unknown }

/**
 * Turns model-reported cues for one audio part into clean, ordered, non-overlapping cues
 * that sit inside `[0, durationSeconds]`. If the model's timeline runs past the end of the
 * audio (a known failure mode), it is scaled back to fit rather than dropped.
 */
export function normalizeCues(raw: RawCue[], durationSeconds: number, style: SubtitleStyle): SubtitleCue[] {
    let cues = raw.flatMap((cue) => {
        const start = parseClock(cue?.start)
        const text = typeof cue?.text === "string" ? cue.text.replace(/\s+/g, " ").trim() : ""
        if (start === null || !text) return []
        const end = parseClock(cue?.end)
        return [{ start, end: end !== null && end > start ? end : null, text }]
    })
    if (cues.length === 0) return []

    cues.sort((a, b) => a.start - b.start)

    const lastPoint = Math.max(...cues.map((c) => c.end ?? c.start))
    if (lastPoint > durationSeconds * 1.1 + 2) {
        const scale = durationSeconds / lastPoint
        cues = cues.map((c) => ({ ...c, start: c.start * scale, end: c.end === null ? null : c.end * scale }))
    }

    const rules = SUBTITLE_STYLE_RULES[style]
    const timed: SubtitleCue[] = []
    for (let i = 0; i < cues.length; i++) {
        const cue = cues[i]
        const start = Math.min(cue.start, durationSeconds)
        if (start >= durationSeconds - 0.05) break
        const nextStart = i + 1 < cues.length ? Math.min(cues[i + 1].start, durationSeconds) : durationSeconds
        const guess = start + Math.max(MIN_CUE_SECONDS, cue.text.length / CHARS_PER_SECOND)
        // Don't linger far beyond the time it takes to read the words (long cues are split later).
        const longest = Math.max(rules.maxCueSeconds * 2, guess - start)
        let end = Math.min(cue.end ?? guess, start + longest, durationSeconds)
        // Never overlap the next cue.
        if (nextStart > start) end = Math.min(end, nextStart)
        if (end - start < MIN_CUE_SECONDS) end = Math.min(start + MIN_CUE_SECONDS, durationSeconds)
        if (end <= start) continue

        const previous = timed[timed.length - 1]
        if (previous && previous.text === cue.text && start - previous.end < 1) {
            previous.end = Math.max(previous.end, end)
            continue
        }
        timed.push({ start, end, text: cue.text })
    }

    return timed.flatMap((cue) => fitCue(cue, style))
}

/** Shifts every cue by `offsetSeconds`, dropping any that would end before 0. */
export function shiftCues(cues: SubtitleCue[], offsetSeconds: number): SubtitleCue[] {
    return cues
        .map((cue) => ({ ...cue, start: Math.max(0, cue.start + offsetSeconds), end: cue.end + offsetSeconds }))
        .filter((cue) => cue.end > cue.start)
}

export type Silence = { start: number; end: number }

/** Parses ffmpeg `silencedetect` log lines into silence ranges. */
export function parseSilenceLog(lines: string[]): Silence[] {
    const silences: Silence[] = []
    let open: number | null = null
    for (const line of lines) {
        const start = /silence_start:\s*(-?[\d.]+)/.exec(line)
        if (start) open = Math.max(0, Number(start[1]))
        const end = /silence_end:\s*([\d.]+)/.exec(line)
        if (end && open !== null) {
            silences.push({ start: open, end: Number(end[1]) })
            open = null
        }
    }
    return silences
}

/**
 * Picks where to cut the audio into parts: roughly every SUBTITLE_CHUNK_TARGET_SECONDS,
 * moved back to the middle of the nearest pause so no word is cut in half.
 * Returns part boundaries including 0 and `duration`.
 */
export function chooseCutPoints(duration: number, silences: Silence[]): number[] {
    const cuts = [0]
    while (duration - cuts[cuts.length - 1] > SUBTITLE_CHUNK_TARGET_SECONDS + 30) {
        const previous = cuts[cuts.length - 1]
        const target = previous + SUBTITLE_CHUNK_TARGET_SECONDS
        const windowStart = target - SUBTITLE_CHUNK_SEARCH_SECONDS
        let best: number | null = null
        let bestScore = -Infinity
        for (const silence of silences) {
            const mid = (silence.start + silence.end) / 2
            if (mid < windowStart || mid > target) continue
            // Prefer longer pauses, then ones closer to the target.
            const score = Math.min(silence.end - silence.start, 2) * 30 - (target - mid)
            if (score > bestScore) {
                bestScore = score
                best = mid
            }
        }
        cuts.push(best ?? target)
    }
    cuts.push(duration)
    return cuts
}
