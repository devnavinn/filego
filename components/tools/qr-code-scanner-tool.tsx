"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import jsQR from "jsqr"
import { Camera, CameraOff, ExternalLink, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/tools/copy-button"

function isProbablyUrl(value: string) {
    try {
        const url = new URL(value)
        return url.protocol === "http:" || url.protocol === "https:"
    } catch {
        return false
    }
}

export function QrCodeScannerTool() {
    const [result, setResult] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isScanning, setIsScanning] = useState(false)
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const frameRef = useRef<number | null>(null)
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    const stopCamera = useCallback(() => {
        if (frameRef.current) cancelAnimationFrame(frameRef.current)
        frameRef.current = null
        streamRef.current?.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        setIsScanning(false)
    }, [])

    useEffect(() => () => stopCamera(), [stopCamera])

    function scanFrame() {
        const video = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
            frameRef.current = requestAnimationFrame(scanFrame)
            return
        }

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) return

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)

        if (code?.data) {
            setResult(code.data)
            setError(null)
            stopCamera()
            return
        }

        frameRef.current = requestAnimationFrame(scanFrame)
    }

    async function handleStartCamera() {
        setError(null)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
            })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                await videoRef.current.play()
            }
            setIsScanning(true)
            frameRef.current = requestAnimationFrame(scanFrame)
        } catch {
            setError("Camera access was denied or is unavailable. Try uploading an image instead.")
        }
    }

    function handleFileUpload(file: File) {
        setError(null)
        const image = new Image()
        const objectUrl = URL.createObjectURL(file)

        image.onload = () => {
            URL.revokeObjectURL(objectUrl)
            const canvas = document.createElement("canvas")
            canvas.width = image.width
            canvas.height = image.height
            const ctx = canvas.getContext("2d")
            if (!ctx) return

            ctx.drawImage(image, 0, 0)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const code = jsQR(imageData.data, imageData.width, imageData.height)

            if (code?.data) {
                setResult(code.data)
            } else {
                setError("No QR code found in that image.")
            }
        }
        image.onerror = () => {
            URL.revokeObjectURL(objectUrl)
            setError("Could not load that image file.")
        }
        image.src = objectUrl
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">QR Code Scanner</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Scan a QR code with your camera or upload an image to decode it.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                    <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-muted/30">
                        <video
                            ref={videoRef}
                            className={`h-full w-full object-cover ${isScanning ? "block" : "hidden"}`}
                            muted
                            playsInline
                        />
                        {!isScanning && (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <Camera className="h-8 w-8" />
                                <p className="px-6 text-center text-xs">Start the camera or upload a QR image</p>
                            </div>
                        )}
                    </div>
                    <canvas ref={canvasRef} className="hidden" />

                    <div className="flex flex-col gap-2 sm:flex-row">
                        {isScanning ? (
                            <Button type="button" variant="secondary" className="w-full rounded-full sm:w-auto" onClick={stopCamera}>
                                <CameraOff />
                                Stop camera
                            </Button>
                        ) : (
                            <Button type="button" className="w-full rounded-full sm:w-auto" onClick={handleStartCamera}>
                                <Camera />
                                Start camera
                            </Button>
                        )}

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full rounded-full sm:w-auto"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload />
                            Upload image
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleFileUpload(file)
                                e.target.value = ""
                            }}
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <p className="text-sm font-medium">Decoded result</p>
                    <div className="min-h-40 rounded-2xl border border-border/60 bg-muted/30 p-4">
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        {!error && !result && (
                            <p className="text-sm text-muted-foreground">Scan or upload a QR code to see its content here.</p>
                        )}
                        {result && (
                            <p className="overflow-x-auto break-all whitespace-pre-wrap text-sm">{result}</p>
                        )}
                    </div>

                    {result && (
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <CopyButton value={result} label="Copy result" />
                            {isProbablyUrl(result) && (
                                <Button asChild variant="outline" className="w-full rounded-full sm:w-auto">
                                    <a href={result} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink />
                                        Open link
                                    </a>
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
