/**
 * pdf-lib's `save()` returns a `Uint8Array<ArrayBufferLike>`, whose backing
 * buffer type (`ArrayBuffer | SharedArrayBuffer`) is wider than `BlobPart`
 * accepts. Copying into a fresh `ArrayBuffer` keeps `new Blob([...])` happy.
 */
export function pdfBytesToBlob(bytes: Uint8Array, type = "application/pdf"): Blob {
    const buffer = new ArrayBuffer(bytes.byteLength)
    new Uint8Array(buffer).set(bytes)
    return new Blob([buffer], { type })
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
