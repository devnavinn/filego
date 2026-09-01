export type LoadedImage = {
    img: HTMLImageElement
    url: string
    width: number
    height: number
}

export function loadImageElement(file: File): Promise<LoadedImage> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file)
        const img = new Image()
        img.onload = () => resolve({ img, url, width: img.naturalWidth, height: img.naturalHeight })
        img.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error("Could not load that image."))
        }
        img.src = url
    })
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error("Could not export the image."))),
            type,
            quality
        )
    })
}

export function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
}

export function replaceExtension(filename: string, ext: string) {
    return filename.replace(/\.[^./\\]+$/, "") + "." + ext
}
