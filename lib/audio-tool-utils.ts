export type AudioMeta = {
    duration: number
}

export function getAudioMeta(file: File): Promise<AudioMeta & { url: string }> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file)
        const audio = document.createElement("audio")
        audio.preload = "metadata"
        audio.onloadedmetadata = () => {
            resolve({ duration: audio.duration, url })
        }
        audio.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error("Could not read this audio file."))
        }
        audio.src = url
    })
}
