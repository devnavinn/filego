import {
    PDFDocument,
    PDFCheckBox,
    PDFDropdown,
    PDFOptionList,
    PDFRadioGroup,
    PDFTextField,
    StandardFonts,
    rgb,
    type PDFField,
    type PDFFont,
} from "@cantoo/pdf-lib"

import type { DetectedField, DetectedWidget, FieldKind, FieldValue, McqQuiz, NewFormField } from "@/lib/pdf-form-types"
import type { FormTemplate } from "@/lib/pdf-form-templates"

export type FormWarning = { field: string; message: string }

function classifyField(field: PDFField): FieldKind {
    if (field instanceof PDFTextField) return "text"
    if (field instanceof PDFCheckBox) return "checkbox"
    if (field instanceof PDFRadioGroup) return "radio"
    if (field instanceof PDFDropdown) return "dropdown"
    if (field instanceof PDFOptionList) return "optionList"
    return "unsupported"
}

function safe<T>(fn: () => T, fallback: T): T {
    try {
        return fn()
    } catch {
        return fallback
    }
}

/**
 * Reads every AcroForm field out of a PDF: its type, current value, and the
 * on-page rectangle(s) it should be rendered at. Best-effort throughout —
 * a single malformed field (bad DA string, orphaned widget, etc.) is skipped
 * rather than aborting detection for the whole document.
 */
export async function detectFormFields(
    bytes: ArrayBuffer
): Promise<{ fields: DetectedField[]; values: Record<string, FieldValue> }> {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false })
    const form = doc.getForm()
    const pages = doc.getPages()
    const pageRefTags = pages.map((p) => p.ref.tag)

    const fields: DetectedField[] = []
    const values: Record<string, FieldValue> = {}

    for (const field of form.getFields()) {
        const name = safe(() => field.getName(), "")
        if (!name) continue
        const kind = classifyField(field)

        const widgets: DetectedWidget[] = safe(
            () =>
                field.acroField.getWidgets().map((widget): DetectedWidget => {
                    const pageRef = safe(() => widget.P(), undefined)
                    const pageIndex = pageRef
                        ? pageRefTags.indexOf(pageRef.tag)
                        : pages.length === 1
                            ? 0
                            : -1
                    const rect = safe(() => widget.getRectangle(), { x: 0, y: 0, width: 0, height: 0 })
                    const onValue = safe(() => widget.getOnValue()?.decodeText(), undefined)
                    return { pageIndex, rect, optionValue: onValue }
                }),
            []
        )

        let options: string[] | undefined
        let multiline: boolean | undefined
        if (field instanceof PDFDropdown || field instanceof PDFOptionList || field instanceof PDFRadioGroup) {
            options = safe(() => field.getOptions(), [])
        }
        if (field instanceof PDFTextField) {
            multiline = safe(() => field.isMultiline(), false)
        }

        fields.push({
            name,
            kind,
            required: safe(() => field.isRequired(), false),
            readOnly: safe(() => field.isReadOnly(), false),
            multiline,
            options,
            widgets,
        })

        if (field instanceof PDFTextField) {
            values[name] = safe(() => field.getText(), undefined) ?? ""
        } else if (field instanceof PDFCheckBox) {
            values[name] = safe(() => field.isChecked(), false)
        } else if (field instanceof PDFRadioGroup) {
            values[name] = safe(() => field.getSelected(), undefined) ?? ""
        } else if (field instanceof PDFDropdown) {
            values[name] = safe(() => field.getSelected(), [])[0] ?? ""
        } else if (field instanceof PDFOptionList) {
            values[name] = safe(() => field.getSelected(), [])
        }
    }

    return { fields, values }
}

/**
 * Writes user-entered values into an existing AcroForm and re-saves the PDF.
 * A field that fails to set (bad encoding, corrupt widget, etc.) is recorded
 * as a warning instead of aborting the whole export.
 */
export async function fillExistingForm(
    bytes: ArrayBuffer,
    values: Record<string, FieldValue>,
    flatten: boolean
): Promise<{ bytes: Uint8Array; warnings: FormWarning[] }> {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false })
    const form = doc.getForm()
    const warnings: FormWarning[] = []

    for (const field of form.getFields()) {
        const name = safe(() => field.getName(), "")
        if (!name || !(name in values)) continue
        const value = values[name]

        try {
            if (field instanceof PDFTextField) {
                field.setText(typeof value === "string" ? value : "")
            } else if (field instanceof PDFCheckBox) {
                if (value) field.check()
                else field.uncheck()
            } else if (field instanceof PDFRadioGroup) {
                if (typeof value === "string" && value) field.select(value)
            } else if (field instanceof PDFDropdown) {
                if (typeof value === "string" && value) field.select(value)
            } else if (field instanceof PDFOptionList) {
                if (Array.isArray(value) && value.length) field.select(value)
            }
        } catch (err) {
            warnings.push({ field: name, message: err instanceof Error ? err.message : "Could not set this field." })
        }
    }

    try {
        form.updateFieldAppearances()
    } catch {
        // best-effort; PDFDocument.save() retries this internally
    }

    if (flatten) {
        try {
            form.flatten()
        } catch {
            warnings.push({ field: "*", message: "Some fields could not be flattened, so the form stays fillable." })
        }
    }

    return { bytes: await doc.save(), warnings }
}

/**
 * Creates brand-new AcroForm text/checkbox fields on an existing PDF (fields
 * placed via the "Add fields" canvas), fills in any value typed while placing
 * them, and optionally flattens the result.
 */
export async function addFieldsAndExport(
    bytes: ArrayBuffer,
    fields: NewFormField[],
    flatten: boolean
): Promise<Uint8Array> {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false })
    const form = doc.getForm()
    const pages = doc.getPages()
    const font = await doc.embedFont(StandardFonts.Helvetica)
    const usedNames = new Set(form.getFields().map((f) => safe(() => f.getName(), "")))

    for (const field of fields) {
        const page = pages[field.pageIndex]
        if (!page) continue

        const base = field.name.trim() || (field.type === "text" ? "Text Field" : "Checkbox")
        let unique = base
        let suffix = 1
        while (usedNames.has(unique)) {
            suffix += 1
            unique = `${base} ${suffix}`
        }
        usedNames.add(unique)

        if (field.type === "text") {
            const textField = form.createTextField(unique)
            textField.addToPage(page, {
                x: field.x,
                y: field.y,
                width: field.width,
                height: field.height,
                font,
            })
            try {
                textField.setFontSize(field.fontSize)
            } catch {
                // some readers reject unusual sizes; fall back to the field's default
            }
            if (field.value) textField.setText(field.value)
            if (field.required) textField.enableRequired()
        } else {
            const checkBox = form.createCheckBox(unique)
            checkBox.addToPage(page, {
                x: field.x,
                y: field.y,
                width: field.width,
                height: field.height,
            })
            if (field.checked) checkBox.check()
            if (field.required) checkBox.enableRequired()
        }
    }

    try {
        form.updateFieldAppearances()
    } catch {
        // best-effort; PDFDocument.save() retries this internally
    }

    if (flatten) form.flatten()

    return doc.save()
}

/**
 * Renders a blank starting PDF for a form template: just the title and field
 * labels drawn as static text. The template's own field specs are placed onto
 * it afterwards through the same "Add fields" flow used for uploaded PDFs.
 */
export async function createTemplatePdf(template: FormTemplate): Promise<Uint8Array> {
    const doc = await PDFDocument.create()
    const page = doc.addPage([template.pageWidth, template.pageHeight])
    const font = await doc.embedFont(StandardFonts.Helvetica)
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold)

    page.drawText(template.title, { x: 56, y: template.pageHeight - 60, size: 22, font: boldFont })
    page.drawLine({
        start: { x: 56, y: template.pageHeight - 76 },
        end: { x: template.pageWidth - 56, y: template.pageHeight - 76 },
        thickness: 1,
        color: rgb(0.85, 0.85, 0.85),
    })

    for (const label of template.labels) {
        page.drawText(label.text, { x: label.x, y: label.y, size: 10, font, color: rgb(0.4, 0.4, 0.4) })
    }

    return doc.save()
}

/** Greedily wraps text into lines that each fit within maxWidth at the given font/size. */
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const words = text.trim().split(/\s+/).filter(Boolean)
    if (words.length === 0) return [""]

    const lines: string[] = []
    let current = words[0]
    for (let i = 1; i < words.length; i++) {
        const candidate = `${current} ${words[i]}`
        if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
            current = candidate
        } else {
            lines.push(current)
            current = words[i]
        }
    }
    lines.push(current)
    return lines
}

const MCQ_PAGE_WIDTH = 612
const MCQ_PAGE_HEIGHT = 792
const MCQ_MARGIN_X = 56
const MCQ_MARGIN_BOTTOM = 60
const MCQ_CONTENT_WIDTH = MCQ_PAGE_WIDTH - MCQ_MARGIN_X * 2
const MCQ_QUESTION_SIZE = 13
const MCQ_OPTION_SIZE = 11
const MCQ_RADIO_SIZE = 13
const MCQ_OPTION_INDENT = 26
const MCQ_OPTION_TEXT_X = MCQ_MARGIN_X + MCQ_OPTION_INDENT + MCQ_RADIO_SIZE + 8
const MCQ_OPTION_TEXT_WIDTH = MCQ_CONTENT_WIDTH - (MCQ_OPTION_INDENT + MCQ_RADIO_SIZE + 8)
const MCQ_OPTION_LETTERS = "ABCDEFGH"

/**
 * Renders a multiple-choice quiz straight into a real AcroForm: each
 * question becomes its own radio group, with one widget per answer choice.
 * Runs through the same detect/fill pipeline as any other PDF afterwards, so
 * the result is immediately previewable and fillable, and paginates on its
 * own when a quiz runs past one page.
 */
export async function createMcqFormPdf(quiz: McqQuiz): Promise<Uint8Array> {
    const doc = await PDFDocument.create()
    const font = await doc.embedFont(StandardFonts.Helvetica)
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold)
    const form = doc.getForm()

    let page = doc.addPage([MCQ_PAGE_WIDTH, MCQ_PAGE_HEIGHT])
    let cursorY = MCQ_PAGE_HEIGHT - 64

    page.drawText(quiz.title.trim() || "Quiz", { x: MCQ_MARGIN_X, y: cursorY, size: 22, font: boldFont })
    cursorY -= 40

    function ensureSpace(needed: number) {
        if (cursorY - needed < MCQ_MARGIN_BOTTOM) {
            page = doc.addPage([MCQ_PAGE_WIDTH, MCQ_PAGE_HEIGHT])
            cursorY = MCQ_PAGE_HEIGHT - 64
        }
    }

    const usedNames = new Set<string>()

    quiz.questions.forEach((question, qIndex) => {
        const stemLines = wrapText(`${qIndex + 1}. ${question.text}`, boldFont, MCQ_QUESTION_SIZE, MCQ_CONTENT_WIDTH)
        const optionLineGroups = question.options.map((opt) => wrapText(opt.text, font, MCQ_OPTION_SIZE, MCQ_OPTION_TEXT_WIDTH))

        const stemHeight = stemLines.length * 17 + 6
        const optionsHeight = optionLineGroups.reduce((sum, lines) => sum + Math.max(MCQ_RADIO_SIZE, lines.length * 14) + 8, 0)
        ensureSpace(stemHeight + optionsHeight + 20)

        for (const line of stemLines) {
            page.drawText(line, { x: MCQ_MARGIN_X, y: cursorY, size: MCQ_QUESTION_SIZE, font: boldFont })
            cursorY -= 17
        }
        cursorY -= 6

        let groupName = `Question ${qIndex + 1}`
        let suffix = 1
        while (usedNames.has(groupName)) {
            suffix += 1
            groupName = `Question ${qIndex + 1} (${suffix})`
        }
        usedNames.add(groupName)
        const radioGroup = form.createRadioGroup(groupName)

        question.options.forEach((_option, oIndex) => {
            const lines = optionLineGroups[oIndex]
            const blockHeight = Math.max(MCQ_RADIO_SIZE, lines.length * 14)

            radioGroup.addOptionToPage(MCQ_OPTION_LETTERS[oIndex] ?? `Option ${oIndex + 1}`, page, {
                x: MCQ_MARGIN_X + MCQ_OPTION_INDENT,
                y: cursorY - MCQ_RADIO_SIZE,
                width: MCQ_RADIO_SIZE,
                height: MCQ_RADIO_SIZE,
            })

            let lineY = cursorY - 2
            for (const line of lines) {
                page.drawText(line, { x: MCQ_OPTION_TEXT_X, y: lineY, size: MCQ_OPTION_SIZE, font })
                lineY -= 14
            }

            cursorY -= blockHeight + 8
        })

        cursorY -= 16
    })

    return doc.save()
}
