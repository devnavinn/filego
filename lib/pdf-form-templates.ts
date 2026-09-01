import { Briefcase, CalendarCheck, ClipboardList, FileSignature, Mail, UserPlus, type LucideIcon } from "lucide-react"

export type TemplateFieldSpec = {
    type: "text" | "checkbox"
    name: string
    x: number
    y: number
    width: number
    height: number
    fontSize: number
    required: boolean
}

export type TemplateLabelSpec = { text: string; x: number; y: number }

export type FormTemplate = {
    id: string
    name: string
    description: string
    icon: LucideIcon
    title: string
    pageWidth: number
    pageHeight: number
    fields: TemplateFieldSpec[]
    labels: TemplateLabelSpec[]
}

type TemplateRow =
    | { type: "text"; label: string; multiline?: boolean; required?: boolean }
    | { type: "checkbox"; label: string; required?: boolean }

const PAGE_WIDTH = 612
const MIN_PAGE_HEIGHT = 792
const MARGIN_X = 56
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2
const TOP_GAP = 96
const FIELD_FONT_SIZE = 12

/**
 * Lays out a top-down list of rows into field/label rectangles. Positions are
 * computed as a distance from the page's top edge, then flipped into pdf-lib's
 * bottom-left-origin space once the final page height is known — this keeps
 * everything anchored to the top regardless of how tall the page ends up.
 */
function layout(rows: TemplateRow[]): { fields: TemplateFieldSpec[]; labels: TemplateLabelSpec[]; pageHeight: number } {
    const fieldsFromTop: (Omit<TemplateFieldSpec, "y"> & { yFromTop: number })[] = []
    const labelsFromTop: { text: string; x: number; yFromTop: number }[] = []
    let cursor = TOP_GAP

    for (const row of rows) {
        if (row.type === "checkbox") {
            const size = 16
            fieldsFromTop.push({
                type: "checkbox",
                name: row.label,
                x: MARGIN_X,
                yFromTop: cursor,
                width: size,
                height: size,
                fontSize: FIELD_FONT_SIZE,
                required: row.required ?? false,
            })
            labelsFromTop.push({ text: row.label, x: MARGIN_X + size + 10, yFromTop: cursor + size - 3 })
            cursor += size + 30
        } else {
            labelsFromTop.push({ text: row.label, x: MARGIN_X, yFromTop: cursor })
            cursor += 16
            const height = row.multiline ? 72 : 26
            fieldsFromTop.push({
                type: "text",
                name: row.label,
                x: MARGIN_X,
                yFromTop: cursor,
                width: CONTENT_WIDTH,
                height,
                fontSize: FIELD_FONT_SIZE,
                required: row.required ?? false,
            })
            cursor += height + 28
        }
    }

    const pageHeight = Math.max(MIN_PAGE_HEIGHT, cursor + 50)
    const fields = fieldsFromTop.map(({ yFromTop, ...f }) => ({ ...f, y: pageHeight - yFromTop - f.height }))
    const labels = labelsFromTop.map((l) => ({ text: l.text, x: l.x, y: pageHeight - l.yFromTop }))

    return { fields, labels, pageHeight }
}

function defineTemplate(
    id: string,
    name: string,
    description: string,
    icon: LucideIcon,
    title: string,
    rows: TemplateRow[]
): FormTemplate {
    const { fields, labels, pageHeight } = layout(rows)
    return { id, name, description, icon, title, pageWidth: PAGE_WIDTH, pageHeight, fields, labels }
}

export const FORM_TEMPLATES: FormTemplate[] = [
    defineTemplate(
        "simple-application",
        "Application Form",
        "Name, contact details, and the role someone's applying for.",
        ClipboardList,
        "Application Form",
        [
            { type: "text", label: "Full Name", required: true },
            { type: "text", label: "Email Address", required: true },
            { type: "text", label: "Phone Number" },
            { type: "text", label: "Position Applying For", required: true },
            { type: "text", label: "Available Start Date" },
            { type: "checkbox", label: "I certify that the information provided is accurate" },
        ]
    ),
    defineTemplate(
        "registration",
        "Registration Form",
        "Collect attendee details for an event, class, or program.",
        UserPlus,
        "Registration Form",
        [
            { type: "text", label: "First Name", required: true },
            { type: "text", label: "Last Name", required: true },
            { type: "text", label: "Email Address", required: true },
            { type: "text", label: "Organization" },
            { type: "checkbox", label: "Register for the full event" },
            { type: "checkbox", label: "I agree to receive email updates" },
        ]
    ),
    defineTemplate(
        "contact-intake",
        "Contact Form",
        "A simple name, email, and message intake form.",
        Mail,
        "Contact Form",
        [
            { type: "text", label: "Name", required: true },
            { type: "text", label: "Email", required: true },
            { type: "text", label: "Phone Number" },
            { type: "text", label: "Subject" },
            { type: "text", label: "Message", multiline: true, required: true },
        ]
    ),
    defineTemplate(
        "consent-release",
        "Consent & Release Form",
        "Get written consent with a signature line and date.",
        FileSignature,
        "Consent & Release Form",
        [
            { type: "text", label: "Participant Name", required: true },
            { type: "text", label: "Date of Birth" },
            { type: "text", label: "Details of Consent", multiline: true, required: true },
            { type: "checkbox", label: "I consent to the terms described above", required: true },
            { type: "text", label: "Signature (type full name)", required: true },
            { type: "text", label: "Date", required: true },
        ]
    ),
    defineTemplate(
        "employment-application",
        "Employment Application",
        "A fuller job application with work-authorization checks.",
        Briefcase,
        "Employment Application",
        [
            { type: "text", label: "Full Name", required: true },
            { type: "text", label: "Address" },
            { type: "text", label: "Phone Number", required: true },
            { type: "text", label: "Email Address", required: true },
            { type: "text", label: "Position Applied For", required: true },
            { type: "text", label: "Desired Salary" },
            { type: "checkbox", label: "Legally authorized to work in this country" },
            { type: "checkbox", label: "Previously employed here before" },
        ]
    ),
    defineTemplate(
        "event-rsvp",
        "Event RSVP",
        "Quick yes/no RSVP with guest count and dietary notes.",
        CalendarCheck,
        "Event RSVP",
        [
            { type: "text", label: "Guest Name", required: true },
            { type: "text", label: "Email Address", required: true },
            { type: "text", label: "Number of Guests" },
            { type: "checkbox", label: "I will attend" },
            { type: "checkbox", label: "I need a vegetarian meal" },
            { type: "text", label: "Dietary restrictions or notes", multiline: true },
        ]
    ),
]
