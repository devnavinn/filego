export type FieldKind = "text" | "checkbox" | "radio" | "dropdown" | "optionList" | "unsupported"

export type FieldValue = string | boolean | string[]

export type DetectedWidget = {
    /** 0-based index into the original PDF's pages, or -1 if it could not be resolved. */
    pageIndex: number
    /** Native PDF space (bottom-left origin), same convention pdf-lib drawing uses. */
    rect: { x: number; y: number; width: number; height: number }
    /** For checkbox/radio widgets: the export value this specific widget represents. */
    optionValue?: string
}

export type DetectedField = {
    name: string
    kind: FieldKind
    required: boolean
    readOnly: boolean
    multiline?: boolean
    /** Possible export values, for radio/dropdown/optionList fields. */
    options?: string[]
    widgets: DetectedWidget[]
}

export type FormPage = {
    /** 0-based index into the original PDF's pages. */
    index: number
    width: number
    height: number
}

export type BuildTool = "select" | "text-field" | "checkbox"

export type NewFormField = {
    id: string
    pageIndex: number
    type: "text" | "checkbox"
    name: string
    x: number
    y: number
    width: number
    height: number
    value: string
    checked: boolean
    fontSize: number
    required: boolean
}

export const DEFAULT_TEXT_FIELD_WIDTH = 180
export const DEFAULT_TEXT_FIELD_HEIGHT = 26
export const DEFAULT_CHECKBOX_SIZE = 18
export const DEFAULT_FIELD_FONT_SIZE = 12

export type McqOption = { id: string; text: string }
export type McqQuestion = { id: string; text: string; options: McqOption[] }
export type McqQuiz = { title: string; questions: McqQuestion[] }
