"use client"

import { ImageOcrTool } from "@/components/tools/image-ocr-tool"

export function OcrImageToTextTool() {
    return (
        <ImageOcrTool
            mode="printed"
            title="OCR Image to Text"
            description="Upload an image and extract its readable text with AI — screenshots, photos, signs, and printed documents."
            signInCallbackUrl="/tools/ai-tools/ocr-image-to-text"
            downloadFileName="extracted-text.txt"
        />
    )
}
