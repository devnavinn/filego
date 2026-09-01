"use client"

import { useCallback, useRef, useState } from "react"
import { FFmpeg } from "@ffmpeg/ffmpeg"
import { toBlobURL } from "@ffmpeg/util"

// Must match the ffmpeg-core version bundled by the installed @ffmpeg/ffmpeg release.
const CORE_VERSION = "0.12.9"
const CORE_BASE_URL = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`

let sharedFfmpeg: FFmpeg | null = null
let loadPromise: Promise<FFmpeg> | null = null

async function loadFfmpeg(onLog?: (message: string) => void) {
    if (sharedFfmpeg?.loaded) return sharedFfmpeg

    if (!loadPromise) {
        loadPromise = (async () => {
            const ffmpeg = new FFmpeg()
            if (onLog) ffmpeg.on("log", ({ message }) => onLog(message))

            await ffmpeg.load({
                coreURL: await toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.js`, "text/javascript"),
                wasmURL: await toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.wasm`, "application/wasm"),
            })

            sharedFfmpeg = ffmpeg
            return ffmpeg
        })()
    }

    return loadPromise
}

/** Lazily loads the shared ffmpeg.wasm engine (~31MB, cached after first use). */
export function useFFmpeg() {
    const [isLoading, setIsLoading] = useState(false)
    const [isReady, setIsReady] = useState(false)
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const ffmpegRef = useRef<FFmpeg | null>(null)

    const ensureLoaded = useCallback(async () => {
        if (ffmpegRef.current?.loaded) return ffmpegRef.current

        setIsLoading(true)
        setError(null)

        try {
            const ffmpeg = await loadFfmpeg()
            ffmpeg.on("progress", ({ progress: p }) => setProgress(Math.min(1, Math.max(0, p))))
            ffmpegRef.current = ffmpeg
            setIsReady(true)
            return ffmpeg
        } catch (err) {
            const message = err instanceof Error ? err.message : "Could not load the video engine."
            setError(message)
            throw new Error(message)
        } finally {
            setIsLoading(false)
        }
    }, [])

    return { ensureLoaded, isLoading, isReady, progress, setProgress, error, setError }
}
