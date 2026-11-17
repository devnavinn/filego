// Client-safe settings for the AI Photo Editor.

export type PhotoEditQuality = "standard" | "hd"

/** Photos are downscaled in the browser to this long edge before upload (keeps requests small and fast). */
export const PHOTO_EDIT_MAX_EDGE = 2048
export const PHOTO_EDIT_MAX_PROMPT = 500
/** Base64 cap per image (~1.6 MB of JPEG). Two images (photo + brush marks) must fit the ~4.5 MB body limit. */
export const PHOTO_EDIT_MAX_BASE64 = 2_200_000

export type PhotoEditPreset = { id: string; label: string; prompt: string; needsMarks?: boolean }

/** One-tap edits. The prompt is what's sent; the label is what's shown. */
export const PHOTO_EDIT_PRESETS: PhotoEditPreset[] = [
    {
        id: "erase",
        label: "Erase what I brushed",
        prompt: "Remove the object(s) under the marks and fill the area naturally so it looks like they were never there.",
        needsMarks: true,
    },
    {
        id: "remove-people",
        label: "Remove people in background",
        prompt: "Remove the people in the background. Keep the main subject and everything else unchanged, and fill the gaps naturally.",
    },
    {
        id: "white-bg",
        label: "Clean white background",
        prompt: "Replace the background with a clean, evenly lit pure white studio background. Keep the subject exactly the same, with natural edges and a soft shadow.",
    },
    {
        id: "studio-headshot",
        label: "Professional headshot",
        prompt: "Turn this into a professional headshot for LinkedIn: soft neutral grey studio background, flattering soft lighting. Keep the person's face, features, hair, and expression exactly the same.",
    },
    {
        id: "product",
        label: "Product photo",
        prompt: "Make this a professional e-commerce product photo: place the product on a clean light background with soft studio lighting and a subtle shadow. Keep the product itself exactly the same, including any text or logos.",
    },
    {
        id: "enhance",
        label: "Enhance photo",
        prompt: "Enhance this photo: fix the exposure and white balance, make the colours natural and vibrant, reduce noise, and sharpen the details. Do not change the content or composition.",
    },
    {
        id: "golden-hour",
        label: "Golden hour light",
        prompt: "Relight this photo as if taken at golden hour, with warm, soft sunlight. Keep the subject and composition the same.",
    },
    {
        id: "remove-text",
        label: "Remove text",
        prompt: "Remove the overlaid text and captions from this image and fill the area naturally. Keep everything else the same.",
    },
]

/** Aspect ratios the image models accept. The closest one to the photo is requested so framing is kept. */
const ASPECT_RATIOS = ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"] as const

export function closestAspectRatio(width: number, height: number): string {
    const target = width / height
    let best: string = "1:1"
    let bestDiff = Infinity
    for (const ratio of ASPECT_RATIOS) {
        const [w, h] = ratio.split(":").map(Number)
        // Compare on a log scale so 2:1 and 1:2 are equally far from 1:1.
        const diff = Math.abs(Math.log(w / h) - Math.log(target))
        if (diff < bestDiff) {
            bestDiff = diff
            best = ratio
        }
    }
    return best
}
