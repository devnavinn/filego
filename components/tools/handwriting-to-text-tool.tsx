"use client"

import { ImageOcrTool } from "@/components/tools/image-ocr-tool"

export function HandwritingToTextTool() {
    return (
        <ImageOcrTool
            mode="handwritten"
            title="Handwriting to Text"
            description="Upload a photo of handwritten notes and convert them into editable, plain text with AI."
            signInCallbackUrl="/tools/ai-tools/handwriting-to-text"
            downloadFileName="handwriting-transcript.txt"
        />
    )
}
