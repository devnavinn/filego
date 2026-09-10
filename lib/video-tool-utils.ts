export type VideoMeta = {
    duration: number
    width: number
    height: number
}

export function getVideoMeta(file: File): Promise<VideoMeta & { url: string }> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file)
        const video = document.createElement("video")
        video.preload = "metadata"
        video.onloadedmetadata = () => {
            resolve({ duration: video.duration, width: video.videoWidth, height: video.videoHeight, url })
        }
        video.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error("Could not read this video file."))
        }
        video.src = url
    })
}

/**
 * ffmpeg.wasm's `readFile()` returns a `Uint8Array<ArrayBufferLike>`, whose backing
 * buffer type is wider than `BlobPart` accepts. Copying into a fresh `ArrayBuffer`
 * keeps `new Blob([...])` happy.
 */
export function bytesToBlob(bytes: Uint8Array, type: string): Blob {
    const buffer = new ArrayBuffer(bytes.byteLength)
    new Uint8Array(buffer).set(bytes)
    return new Blob([buffer], { type })
}

export function formatDuration(seconds: number) {
    if (!Number.isFinite(seconds)) return "0:00"
    const total = Math.round(seconds)
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    const mm = h > 0 ? String(m).padStart(2, "0") : String(m)
    const ss = String(s).padStart(2, "0")
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

/** Same as formatDuration, but keeps one decimal place for fine-grained trim handles. */
export function formatDurationPrecise(seconds: number) {
    if (!Number.isFinite(seconds)) return "0:00.0"
    const clamped = Math.max(0, seconds)
    const m = Math.floor(clamped / 60)
    const s = clamped - m * 60
    return `${m}:${s.toFixed(1).padStart(4, "0")}`
}

/**
 * Extracts evenly spaced frame thumbnails from a video file by seeking a
 * hidden <video> element and capturing each frame to a canvas. Used to
 * render a filmstrip-style timeline instead of a plain slider.
 */
export function generateVideoThumbnails(file: File, duration: number, count = 12): Promise<string[]> {
    return new Promise((resolve, reject) => {
        if (duration <= 0) {
            resolve([])
            return
        }

        const url = URL.createObjectURL(file)
        const video = document.createElement("video")
        video.preload = "auto"
        video.muted = true
        video.playsInline = true

        const canvas = document.createElement("canvas")
        const thumbnails: string[] = []
        let index = 0

        function cleanup() {
            URL.revokeObjectURL(url)
        }

        function seekNext() {
            const target = (duration * index) / count
            video.currentTime = Math.min(target, Math.max(duration - 0.05, 0))
        }

        video.onloadeddata = () => seekNext()

        video.onseeked = () => {
            const ctx = canvas.getContext("2d")
            if (!ctx) {
                cleanup()
                reject(new Error("Canvas is not supported in this browser."))
                return
            }
            canvas.width = video.videoWidth || 320
            canvas.height = video.videoHeight || 180
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            thumbnails.push(canvas.toDataURL("image/jpeg", 0.6))
            index += 1

            if (index >= count) {
                cleanup()
                resolve(thumbnails)
            } else {
                seekNext()
            }
        }

        video.onerror = () => {
            cleanup()
            reject(new Error("Could not generate a preview timeline for this video."))
        }

        video.src = url
    })
}
