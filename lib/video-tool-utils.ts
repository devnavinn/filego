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
