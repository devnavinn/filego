"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
    CheckSquare,
    Download,
    FileEdit,
    Loader2,
    MousePointer2,
    Type,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { PdfDropzone } from "@/components/tools/pdf-dropzone"
import { PdfFormPagesPanel } from "@/components/tools/pdf-form-pages-panel"
import { PdfFormFillCanvas } from "@/components/tools/pdf-form-fill-canvas"
import { PdfFormBuildCanvas } from "@/components/tools/pdf-form-build-canvas"
import { McqQuizBuilder } from "@/components/tools/mcq-quiz-builder"
import { usePdfJs } from "@/lib/use-pdfjs"
import { downloadBlob, pdfBytesToBlob, replaceExtension } from "@/lib/pdf-tool-utils"
import {
    addFieldsAndExport,
    createMcqFormPdf,
    createTemplatePdf,
    detectFormFields,
    fillExistingForm,
    type FormWarning,
} from "@/lib/pdf-form-utils"
import { FORM_TEMPLATES, type FormTemplate } from "@/lib/pdf-form-templates"
import type { BuildTool, DetectedField, FieldValue, FormPage, McqQuiz, NewFormField } from "@/lib/pdf-form-types"
import { cn } from "@/lib/utils"

type Mode = "fill" | "build"

const BUILD_TOOLS: { value: BuildTool; label: string; icon: typeof MousePointer2 }[] = [
    { value: "select", label: "Select", icon: MousePointer2 },
    { value: "text-field", label: "Text field", icon: Type },
    { value: "checkbox", label: "Checkbox", icon: CheckSquare },
]

function slugify(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

type PdfFormsToolProps = {
    /** A FORM_TEMPLATES id to auto-load on mount, for a template's dedicated page. */
    initialTemplateId?: string
    /** Skips straight to the MCQ builder or the upload dropzone on a dedicated page. */
    initialMode?: "mcq" | "upload"
}

export function PdfFormsTool({ initialTemplateId, initialMode }: PdfFormsToolProps) {
    const { pdfjsLib, error: engineError } = usePdfJs()
    const router = useRouter()

    const [file, setFile] = useState<File | null>(null)
    const [pages, setPages] = useState<FormPage[]>([])
    const [activePageIndex, setActivePageIndex] = useState(0)
    const [mode, setMode] = useState<Mode>("build")

    const [detectedFields, setDetectedFields] = useState<DetectedField[]>([])
    const [fillValues, setFillValues] = useState<Record<string, FieldValue>>({})
    const [flattenOnFill, setFlattenOnFill] = useState(true)

    const [buildTool, setBuildTool] = useState<BuildTool>("text-field")
    const [newFields, setNewFields] = useState<NewFormField[]>([])
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
    const [flattenNewFields, setFlattenNewFields] = useState(false)

    const [isLoadingFile, setIsLoadingFile] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [warnings, setWarnings] = useState<FormWarning[]>([])
    const [showMcqBuilder, setShowMcqBuilder] = useState(initialMode === "mcq")

    const activePage = pages.find((p) => p.index === activePageIndex) ?? null
    const selectedField = newFields.find((f) => f.id === selectedFieldId) ?? null

    const fieldCountByPage = useMemo(() => {
        const counts: Record<number, number> = {}
        for (const field of detectedFields) {
            for (const widget of field.widgets) {
                if (widget.pageIndex < 0) continue
                counts[widget.pageIndex] = (counts[widget.pageIndex] ?? 0) + 1
            }
        }
        return counts
    }, [detectedFields])

    const unresolvedFields = useMemo(
        () => detectedFields.filter((f) => f.widgets.length === 0 || f.widgets.every((w) => w.pageIndex < 0)),
        [detectedFields]
    )

    async function loadPages(pdfFile: File): Promise<FormPage[]> {
        const buffer = await pdfFile.arrayBuffer()
        const doc = await pdfjsLib!.getDocument({ data: new Uint8Array(buffer) }).promise

        const nextPages: FormPage[] = []
        for (let i = 1; i <= doc.numPages; i++) {
            const pdfPage = await doc.getPage(i)
            const viewport = pdfPage.getViewport({ scale: 1, rotation: pdfPage.rotate })
            nextPages.push({ index: i - 1, width: viewport.width, height: viewport.height })
        }
        return nextPages
    }

    async function handleFileSelect(next: File) {
        if (!pdfjsLib) {
            setError("The PDF engine is still loading. Try again in a moment.")
            return
        }

        setIsLoadingFile(true)
        setError(null)
        setWarnings([])

        try {
            // pdf.js transfers (and thus detaches) the buffer it's given to its worker,
            // so detection needs its own fresh read rather than reusing that buffer.
            const nextPages = await loadPages(next)
            const detectionBuffer = await next.arrayBuffer()
            const { fields, values } = await detectFormFields(detectionBuffer)

            setFile(next)
            setPages(nextPages)
            setActivePageIndex(0)
            setDetectedFields(fields)
            setFillValues(values)
            setNewFields([])
            setSelectedFieldId(null)
            setBuildTool("text-field")
            setMode(fields.length > 0 ? "fill" : "build")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not read this PDF.")
        } finally {
            setIsLoadingFile(false)
        }
    }

    async function handleSelectTemplate(template: FormTemplate) {
        if (!pdfjsLib) {
            setError("The PDF engine is still loading. Try again in a moment.")
            return
        }

        setIsLoadingFile(true)
        setError(null)
        setWarnings([])

        try {
            const bytes = await createTemplatePdf(template)
            const templateFile = new File([pdfBytesToBlob(bytes)], `${slugify(template.name)}.pdf`, { type: "application/pdf" })
            const nextPages = await loadPages(templateFile)

            setFile(templateFile)
            setPages(nextPages)
            setActivePageIndex(0)
            setDetectedFields([])
            setFillValues({})
            setNewFields(
                template.fields.map((f) => ({
                    id: crypto.randomUUID(),
                    pageIndex: 0,
                    type: f.type,
                    name: f.name,
                    x: f.x,
                    y: f.y,
                    width: f.width,
                    height: f.height,
                    value: "",
                    checked: false,
                    fontSize: f.fontSize,
                    required: f.required,
                }))
            )
            setSelectedFieldId(null)
            setBuildTool("select")
            setMode("build")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not create this template.")
        } finally {
            setIsLoadingFile(false)
        }
    }

    useEffect(() => {
        if (!initialTemplateId || file || !pdfjsLib) return
        const template = FORM_TEMPLATES.find((t) => t.id === initialTemplateId)
        if (!template) return
        // eslint-disable-next-line react-hooks/set-state-in-effect
        handleSelectTemplate(template)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialTemplateId, file, pdfjsLib])

    async function handleCreateMcq(quiz: McqQuiz) {
        if (!pdfjsLib) {
            setError("The PDF engine is still loading. Try again in a moment.")
            return
        }

        setIsLoadingFile(true)
        setError(null)
        setWarnings([])

        try {
            const bytes = await createMcqFormPdf(quiz)
            const quizFile = new File([pdfBytesToBlob(bytes)], `${slugify(quiz.title || "quiz")}.pdf`, { type: "application/pdf" })
            const nextPages = await loadPages(quizFile)
            const detectionBuffer = await quizFile.arrayBuffer()
            const { fields, values } = await detectFormFields(detectionBuffer)

            setFile(quizFile)
            setPages(nextPages)
            setActivePageIndex(0)
            setDetectedFields(fields)
            setFillValues(values)
            setNewFields([])
            setSelectedFieldId(null)
            setBuildTool("select")
            setMode("fill")
            setShowMcqBuilder(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not create this quiz.")
        } finally {
            setIsLoadingFile(false)
        }
    }

    function handleClear() {
        setFile(null)
        setPages([])
        setActivePageIndex(0)
        setDetectedFields([])
        setFillValues({})
        setNewFields([])
        setSelectedFieldId(null)
        setMode("build")
        setError(null)
        setWarnings([])
        setShowMcqBuilder(initialMode === "mcq")
    }

    function handleFillValueChange(name: string, value: FieldValue) {
        setFillValues((prev) => ({ ...prev, [name]: value }))
    }

    function createField(field: NewFormField) {
        setNewFields((prev) => [...prev, field])
    }

    function updateField(id: string, patch: Partial<NewFormField>) {
        setNewFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)))
    }

    function deleteField(id: string) {
        setNewFields((prev) => prev.filter((f) => f.id !== id))
        setSelectedFieldId((current) => (current === id ? null : current))
    }

    function handleBuildToolSelect(next: BuildTool) {
        setSelectedFieldId(null)
        setBuildTool(next)
    }

    async function handleExportFill() {
        if (!file) return
        setIsExporting(true)
        setError(null)
        setWarnings([])

        try {
            const buffer = await file.arrayBuffer()
            const { bytes, warnings: fillWarnings } = await fillExistingForm(buffer, fillValues, flattenOnFill)
            downloadBlob(pdfBytesToBlob(bytes), replaceExtension(file.name, "filled.pdf"))
            setWarnings(fillWarnings)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not fill this PDF.")
        } finally {
            setIsExporting(false)
        }
    }

    async function handleExportBuild() {
        if (!file) return
        setIsExporting(true)
        setError(null)
        setWarnings([])

        try {
            const buffer = await file.arrayBuffer()
            const bytes = await addFieldsAndExport(buffer, newFields, flattenNewFields)
            downloadBlob(pdfBytesToBlob(bytes), replaceExtension(file.name, "form.pdf"))
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not add fields to this PDF.")
        } finally {
            setIsExporting(false)
        }
    }

    if (!file) {
        if (showMcqBuilder) {
            return (
                <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
                    <McqQuizBuilder
                        onCreate={handleCreateMcq}
                        onCancel={() => router.push("/pdf-forms")}
                        isCreating={isLoadingFile}
                    />
                    {(error || engineError) && <p className="mt-3 text-sm text-destructive">{error || engineError}</p>}
                </div>
            )
        }

        if (initialTemplateId) {
            return (
                <div className="rounded-3xl border border-border/60 bg-card p-8 text-center sm:p-10">
                    <p className="text-sm text-muted-foreground">Preparing your form...</p>
                    {(error || engineError) && <p className="mt-3 text-sm text-destructive">{error || engineError}</p>}
                </div>
            )
        }

        return (
            <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
                <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Upload your PDF</h2>
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                    Fill in an existing PDF&apos;s fields, or add new text fields and checkboxes to it — then download.
                </p>

                <div className="mt-6">
                    <PdfDropzone onFileSelect={handleFileSelect} />
                </div>

                {isLoadingFile && <p className="mt-3 text-sm text-muted-foreground">Preparing your form...</p>}
                {(error || engineError) && <p className="mt-3 text-sm text-destructive">{error || engineError}</p>}
            </div>
        )
    }

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                <div className="flex flex-wrap items-center gap-1">
                    <Button
                        type="button"
                        variant={mode === "fill" ? "secondary" : "ghost"}
                        size="sm"
                        className="rounded-full"
                        onClick={() => setMode("fill")}
                    >
                        <FileEdit />
                        Fill form
                        {detectedFields.length > 0 && (
                            <span className="ml-0.5 rounded-full bg-primary/10 px-1.5 text-[10px] font-medium text-primary">
                                {detectedFields.length}
                            </span>
                        )}
                    </Button>
                    <Button
                        type="button"
                        variant={mode === "build" ? "secondary" : "ghost"}
                        size="sm"
                        className="rounded-full"
                        onClick={() => setMode("build")}
                    >
                        <Type />
                        Add fields
                        {newFields.length > 0 && (
                            <span className="ml-0.5 rounded-full bg-primary/10 px-1.5 text-[10px] font-medium text-primary">
                                {newFields.length}
                            </span>
                        )}
                    </Button>

                    {mode === "build" && (
                        <div className="ml-2 flex items-center gap-1 border-l border-border/60 pl-2">
                            {BUILD_TOOLS.map((t) => (
                                <Button
                                    key={t.value}
                                    type="button"
                                    variant={buildTool === t.value ? "secondary" : "ghost"}
                                    size="sm"
                                    className="rounded-full"
                                    onClick={() => handleBuildToolSelect(t.value)}
                                    title={t.label}
                                >
                                    <t.icon />
                                    <span className="hidden sm:inline">{t.label}</span>
                                </Button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={handleClear}>
                        Start over
                    </Button>
                    {mode === "fill" ? (
                        <Button type="button" size="sm" className="rounded-full" onClick={handleExportFill} disabled={isExporting}>
                            {isExporting ? <Loader2 className="animate-spin" /> : <Download />}
                            {isExporting ? "Filling..." : "Download filled PDF"}
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            size="sm"
                            className="rounded-full"
                            onClick={handleExportBuild}
                            disabled={isExporting || newFields.length === 0}
                        >
                            {isExporting ? <Loader2 className="animate-spin" /> : <Download />}
                            {isExporting ? "Saving..." : "Download form"}
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 py-2">
                {mode === "fill" ? (
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Switch checked={flattenOnFill} onCheckedChange={setFlattenOnFill} size="sm" />
                        Flatten into the page (recommended) — makes the filled values permanent and non-editable
                    </label>
                ) : (
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Switch checked={flattenNewFields} onCheckedChange={setFlattenNewFields} size="sm" />
                        Flatten new fields — bakes any typed values in instead of leaving them fillable
                    </label>
                )}

                {mode === "build" && selectedField && (
                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            type="text"
                            value={selectedField.name}
                            onChange={(e) => updateField(selectedField.id, { name: e.target.value })}
                            placeholder={selectedField.type === "text" ? "Text Field" : "Checkbox"}
                            className="h-7 w-36 rounded-md border border-border/60 bg-background px-2 text-xs outline-none focus:border-primary"
                        />
                        {selectedField.type === "text" && (
                            <div className="flex items-center gap-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon-sm"
                                    className="rounded-full"
                                    onClick={() =>
                                        updateField(selectedField.id, { fontSize: Math.max(8, selectedField.fontSize - 1) })
                                    }
                                >
                                    -
                                </Button>
                                <span className="w-6 text-center text-xs">{selectedField.fontSize}</span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon-sm"
                                    className="rounded-full"
                                    onClick={() =>
                                        updateField(selectedField.id, { fontSize: Math.min(36, selectedField.fontSize + 1) })
                                    }
                                >
                                    +
                                </Button>
                            </div>
                        )}
                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Switch
                                checked={selectedField.required}
                                onCheckedChange={(checked) => updateField(selectedField.id, { required: checked })}
                                size="sm"
                            />
                            Required
                        </label>
                        <span className="text-xs text-muted-foreground">Press Delete to remove</span>
                    </div>
                )}
            </div>

            <div className="mt-3 flex flex-col gap-3 lg:flex-row">
                {pdfjsLib && (
                    <PdfFormPagesPanel
                        pdfjsLib={pdfjsLib}
                        file={file}
                        pages={pages}
                        activePageIndex={activePageIndex}
                        fieldCountByPage={fieldCountByPage}
                        onSelectPage={(index) => {
                            setActivePageIndex(index)
                            setSelectedFieldId(null)
                        }}
                    />
                )}

                <div className={cn("min-w-0 flex-1 overflow-x-auto py-2")}>
                    {pdfjsLib && activePage ? (
                        mode === "fill" ? (
                            <PdfFormFillCanvas
                                pdfjsLib={pdfjsLib}
                                file={file}
                                page={activePage}
                                fields={detectedFields}
                                values={fillValues}
                                onChange={handleFillValueChange}
                            />
                        ) : (
                            <PdfFormBuildCanvas
                                pdfjsLib={pdfjsLib}
                                file={file}
                                page={activePage}
                                fields={newFields}
                                tool={buildTool}
                                selectedFieldId={selectedFieldId}
                                onSelectField={setSelectedFieldId}
                                onCreateField={createField}
                                onUpdateField={updateField}
                                onDeleteField={deleteField}
                                onToolConsumed={() => setBuildTool("select")}
                            />
                        )
                    ) : (
                        <p className="p-6 text-sm text-muted-foreground">Loading...</p>
                    )}
                </div>
            </div>

            {mode === "fill" && detectedFields.length === 0 && (
                <p className="mt-3 rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
                    This PDF doesn&apos;t have any fillable fields yet. Switch to{" "}
                    <button type="button" className="font-medium text-primary underline underline-offset-2" onClick={() => setMode("build")}>
                        Add fields
                    </button>{" "}
                    to place text fields and checkboxes on it.
                </p>
            )}

            {mode === "fill" && unresolvedFields.length > 0 && (
                <div className="mt-3 space-y-2 rounded-xl border border-border/60 p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                        Other fields on this document (position not detected)
                    </p>
                    {unresolvedFields.map((field) => (
                        <div key={field.name} className="flex items-center justify-between gap-3">
                            <span className="min-w-0 truncate text-sm">{field.name}</span>
                            {field.kind === "text" && (
                                <input
                                    type="text"
                                    value={typeof fillValues[field.name] === "string" ? (fillValues[field.name] as string) : ""}
                                    onChange={(e) => handleFillValueChange(field.name, e.target.value)}
                                    className="h-8 w-48 rounded-md border border-border/60 bg-background px-2 text-sm outline-none focus:border-primary"
                                />
                            )}
                            {field.kind === "checkbox" && (
                                <input
                                    type="checkbox"
                                    checked={Boolean(fillValues[field.name])}
                                    onChange={(e) => handleFillValueChange(field.name, e.target.checked)}
                                    className="h-4 w-4 accent-primary"
                                />
                            )}
                            {(field.kind === "dropdown" || field.kind === "radio") && (
                                <select
                                    value={typeof fillValues[field.name] === "string" ? (fillValues[field.name] as string) : ""}
                                    onChange={(e) => handleFillValueChange(field.name, e.target.value)}
                                    className="h-8 w-48 rounded-md border border-border/60 bg-background px-2 text-sm outline-none focus:border-primary"
                                >
                                    <option value="" disabled>
                                        Choose...
                                    </option>
                                    {(field.options ?? []).map((opt) => (
                                        <option key={opt} value={opt}>
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {(field.kind === "unsupported" || field.kind === "optionList") && (
                                <span className="text-xs text-muted-foreground">Not supported here</span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {(error || engineError) && <p className="mt-3 text-sm text-destructive">{error || engineError}</p>}

            {warnings.length > 0 && (
                <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
                    <p className="font-medium">Downloaded, but {warnings.length} field{warnings.length > 1 ? "s" : ""} needed attention:</p>
                    <ul className="mt-1 list-inside list-disc">
                        {warnings.map((w, i) => (
                            <li key={i}>
                                {w.field}: {w.message}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <p className="mt-2 text-xs text-muted-foreground">
                {mode === "fill"
                    ? "Click a highlighted field on the page to fill it in, then download."
                    : buildTool === "select"
                        ? "Click a field to select, drag to move, corner handles to resize."
                        : `Click${buildTool === "text-field" ? " and drag" : ""} on the page to place a ${buildTool === "text-field" ? "text field" : "checkbox"}.`}
            </p>
        </div>
    )
}
