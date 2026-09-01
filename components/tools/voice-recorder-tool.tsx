"use client"

import { useRef, useState } from "react"
import { Circle, Download, Mic, Square } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatBytes } from "@/lib/image-utils"
import { formatDuration } from "@/lib/video-tool-utils"
import { downloadBlob } from "@/lib/pdf-tool-utils"

function pickMimeType() {
    const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]
    for (const type of candidates) {
        if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) return type
    }
    return ""
}

export function VoiceRecorderTool() {
    const [isRecording, setIsRecording] = useState(false)
    const [elapsed, setElapsed] = useState(0)
    const [recording, setRecording] = useState<{ blob: Blob; url: string } | null>(null)
    const [error, setError] = useState<string | null>(null)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const streamRef = useRef<MediaStream | null>(null)
    const timerRef = useRef<number | null>(null)
    const startTimeRef = useRef(0)

    async function handleStart() {
        setError(null)
        setRecording(null)

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            streamRef.current = stream

            const mimeType = pickMimeType()
            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
            chunksRef.current = []

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" })
                setRecording({ blob, url: URL.createObjectURL(blob) })
                streamRef.current?.getTracks().forEach((track) => track.stop())
            }

            recorder.start()
            mediaRecorderRef.current = recorder
            setIsRecording(true)
            startTimeRef.current = Date.now()
            setElapsed(0)

            timerRef.current = window.setInterval(() => {
                setElapsed((Date.now() - startTimeRef.current) / 1000)
            }, 200)
        } catch {
            setError("Microphone access was denied or is unavailable.")
        }
    }

    function handleStop() {
        mediaRecorderRef.current?.stop()
        setIsRecording(false)
        if (timerRef.current) window.clearInterval(timerRef.current)
    }

    function handleDownload() {
        if (!recording) return
        const ext = recording.blob.type.includes("mp4") ? "m4a" : recording.blob.type.includes("ogg") ? "ogg" : "webm"
        downloadBlob(recording.blob, `recording.${ext}`)
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Voice Recorder</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Record voice directly in your browser and download the audio.
            </p>

            <div className="mt-6 flex flex-col items-center gap-6 rounded-2xl border border-border/60 bg-muted/30 p-8 text-center">
                <div
                    className={`flex h-20 w-20 items-center justify-center rounded-full border-2 ${isRecording ? "border-red-500" : "border-border/60"
                        }`}
                >
                    {isRecording ? (
                        <Circle className="h-8 w-8 animate-pulse fill-red-500 text-red-500" />
                    ) : (
                        <Mic className="h-8 w-8 text-muted-foreground" />
                    )}
                </div>

                <p className="text-2xl font-semibold tabular-nums">{formatDuration(elapsed)}</p>

                {isRecording ? (
                    <Button type="button" variant="destructive" className="rounded-full" onClick={handleStop}>
                        <Square />
                        Stop recording
                    </Button>
                ) : (
                    <Button type="button" className="rounded-full" onClick={handleStart}>
                        <Mic />
                        Start recording
                    </Button>
                )}

                {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            {recording && (
                <div className="mt-4 space-y-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
                    <audio src={recording.url} controls className="w-full" />
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">{formatBytes(recording.blob.size)}</p>
                        <Button type="button" size="sm" className="rounded-full" onClick={handleDownload}>
                            <Download />
                            Download
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
