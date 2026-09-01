export type EditorTool = "select" | "text" | "edit-text" | "image" | "rect" | "ellipse" | "line" | "draw" | "whiteout"

export type EditorPage = {
    /** Stable identity, independent of position in the (reorderable) page list. */
    id: string
    /** Index into the ORIGINAL source PDF's pages — used at export time to copy the right page. */
    originalIndex: number
    /** Native page size in PDF points, at the page's own inherent rotation. */
    width: number
    height: number
    /** Additional rotation applied in the editor, on top of the page's inherent rotation. */
    rotationDelta: number
}

type ElementCommon = {
    id: string
    pageId: string
}

export type TextElement = ElementCommon & {
    type: "text"
    x: number
    y: number
    width: number
    height: number
    content: string
    fontSize: number
    color: string
    bold: boolean
}

export type ImageElement = ElementCommon & {
    type: "image"
    x: number
    y: number
    width: number
    height: number
    dataUrl: string
    mimeType: "image/png" | "image/jpeg"
}

export type ShapeElement = ElementCommon & {
    type: "rect" | "ellipse" | "whiteout"
    x: number
    y: number
    width: number
    height: number
    color: string
    strokeWidth: number
    filled: boolean
}

export type LineElement = ElementCommon & {
    type: "line"
    x1: number
    y1: number
    x2: number
    y2: number
    color: string
    strokeWidth: number
}

export type DrawElement = ElementCommon & {
    type: "draw"
    points: { x: number; y: number }[]
    color: string
    strokeWidth: number
}

export type EditorElement = TextElement | ImageElement | ShapeElement | LineElement | DrawElement

export const DEFAULT_TEXT_COLOR = "#111827"
export const DEFAULT_SHAPE_COLOR = "#ef4444"
export const DEFAULT_STROKE_WIDTH = 2
export const DEFAULT_FONT_SIZE = 18
