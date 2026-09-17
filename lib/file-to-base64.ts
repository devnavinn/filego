/** Reads a File/Blob and resolves to its base64 payload, without the `data:...;base64,` prefix. */
export function fileToBase64(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            const result = reader.result
            if (typeof result !== "string") {
                reject(new Error("Could not read this file."))
                return
            }
            resolve(result.slice(result.indexOf(",") + 1))
        }
        reader.onerror = () => reject(new Error("Could not read this file."))
        reader.readAsDataURL(file)
    })
}
