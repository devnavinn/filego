"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import mammoth from "mammoth";
import DOMPurify from "dompurify";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import {
    ArrowLeft,
    Download,
    FileText,
    Loader2,
    RotateCcw,
    Settings2,
    Shield,
    Trash2,
    Type,
    Upload,
    Zap,
} from "lucide-react";

type PageFormat = "a4" | "letter";
type PageMargin = "narrow" | "normal" | "wide";

export function WordToPdfTool() {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const previewRef = useRef<HTMLDivElement | null>(null);
    const editorRef = useRef<HTMLDivElement | null>(null);

    const [file, setFile] = useState<File | null>(null);
    const [html, setHtml] = useState("");
    const [editableHtml, setEditableHtml] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [pageFormat, setPageFormat] = useState<PageFormat>("a4");
    const [margin, setMargin] = useState<PageMargin>("normal");
    const [lineHeight, setLineHeight] = useState("1.65");
    const [paragraphSpacing, setParagraphSpacing] = useState("1");
    const [pagePadding, setPagePadding] = useState("40");
    const [fontSize, setFontSize] = useState("15");
    const [isEditMode, setIsEditMode] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [error, setError] = useState("");
    const [warning, setWarning] = useState("");

    const marginMap = useMemo(
        () =>
            ({
                narrow: 24,
                normal: 40,
                wide: 56,
            }) as const,
        []
    );

    const sanitizeHtml = (value: string) =>
        DOMPurify.sanitize(value, {
            USE_PROFILES: { html: true },
        });

    useEffect(() => {
        if (!editorRef.current) return;
        if (!editableHtml) {
            if (editorRef.current.innerHTML !== "") {
                editorRef.current.innerHTML = "";
            }
            return;
        }
        if (editorRef.current.innerHTML !== editableHtml) {
            editorRef.current.innerHTML = editableHtml;
        }
    }, [editableHtml]);

    const addFile = async (picked: File | null) => {
        if (!picked) return;

        const isDocx =
            picked.type ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            picked.name.toLowerCase().endsWith(".docx");

        if (!isDocx) {
            setError("Please upload a valid .docx Word document.");
            return;
        }

        try {
            setIsParsing(true);
            setError("");
            setWarning("");
            setFile(picked);

            const buffer = await picked.arrayBuffer();
            const result = await mammoth.convertToHtml(
                { arrayBuffer: buffer },
                {
                    includeDefaultStyleMap: true,
                    ignoreEmptyParagraphs: false,
                }
            );

            const safeHtml = sanitizeHtml(result.value);

            setHtml(safeHtml);
            setEditableHtml(safeHtml);

            if (result.messages.length > 0) {
                setWarning(
                    "Some advanced Word formatting may not match perfectly in the preview or exported PDF."
                );
            }
        } catch (err) {
            console.error(err);
            setError("Could not read this DOCX file. Please try another file.");
            setHtml("");
            setEditableHtml("");
        } finally {
            setIsParsing(false);
        }
    };

    const resetAll = () => {
        setFile(null);
        setHtml("");
        setEditableHtml("");
        setError("");
        setWarning("");
        setLineHeight("1.65");
        setParagraphSpacing("1");
        setPagePadding("40");
        setFontSize("15");
        setPageFormat("a4");
        setMargin("normal");
        setIsEditMode(true);
        setShowSettings(false);

        if (editorRef.current) {
            editorRef.current.innerHTML = "";
        }

        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    const resetPreviewEdits = () => {
        if (editorRef.current) {
            editorRef.current.innerHTML = html;
        }
        setEditableHtml(html);
        setLineHeight("1.65");
        setParagraphSpacing("1");
        setPagePadding("40");
        setFontSize("15");
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files?.length) {
            await addFile(e.dataTransfer.files[0]);
        }
    };

    const handlePreviewInput = () => {
        if (!editorRef.current) return;
        setEditableHtml(sanitizeHtml(editorRef.current.innerHTML));
    };

    const createPdfPageContainer = ({
        width,
        minHeight,
    }: {
        width: number;
        minHeight: number;
    }) => {
        const page = document.createElement("div");
        page.setAttribute("data-pdf-page", "true");
        page.style.width = `${width}px`;
        page.style.minHeight = `${minHeight}px`;
        page.style.boxSizing = "border-box";
        page.style.background = "#ffffff";
        page.style.color = "#000000";
        page.style.overflow = "hidden";
        page.style.padding = `${pagePadding}px`;

        const content = document.createElement("div");
        content.className = "docx-preview";
        content.style.lineHeight = String(lineHeight);
        content.style.fontSize = `${fontSize}px`;
        content.style.setProperty("--paragraph-spacing", `${paragraphSpacing}em`);

        page.appendChild(content);
        return page;
    };

    const generatePdf = async () => {
        if (!previewRef.current || !editorRef.current) {
            setError("Upload and preview a DOCX file first.");
            return;
        }

        const liveHtml = sanitizeHtml(editorRef.current.innerHTML);

        if (!liveHtml.trim()) {
            setError("Preview content is empty.");
            return;
        }

        let sandbox: HTMLDivElement | null = null;

        try {
            setIsGenerating(true);
            setError("");
            setEditableHtml(liveHtml);

            const pdf = new jsPDF({
                orientation: "p",
                unit: "pt",
                format: pageFormat,
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const pageMargin = marginMap[margin];
            const usableWidth = pageWidth - pageMargin * 2;
            const usableHeight = pageHeight - pageMargin * 2;

            const previewWidth = Math.max(previewRef.current.offsetWidth, 800);
            const previewHeight = (previewWidth * usableHeight) / usableWidth;

            sandbox = document.createElement("div");
            sandbox.style.position = "fixed";
            sandbox.style.left = "-100000px";
            sandbox.style.top = "0";
            sandbox.style.width = `${previewWidth}px`;
            sandbox.style.pointerEvents = "none";
            sandbox.style.opacity = "0";
            sandbox.style.zIndex = "-1";
            document.body.appendChild(sandbox);

            const measureRoot = document.createElement("div");
            measureRoot.className = "docx-preview";
            measureRoot.style.lineHeight = String(lineHeight);
            measureRoot.style.fontSize = `${fontSize}px`;
            measureRoot.style.setProperty("--paragraph-spacing", `${paragraphSpacing}em`);
            measureRoot.innerHTML = liveHtml;

            sandbox.appendChild(measureRoot);

            const sourceBlocks =
                measureRoot.children.length > 0
                    ? (Array.from(measureRoot.children) as HTMLElement[])
                    : [measureRoot];

            const pages: HTMLElement[] = [];
            let currentPage = createPdfPageContainer({
                width: previewWidth,
                minHeight: previewHeight,
            });
            sandbox.appendChild(currentPage);

            let currentContent = currentPage.querySelector(".docx-preview") as HTMLElement;

            for (const block of sourceBlocks) {
                const clone = block.cloneNode(true) as HTMLElement;
                currentContent.appendChild(clone);

                if (currentPage.scrollHeight > previewHeight) {
                    currentContent.removeChild(clone);

                    if (currentContent.children.length === 0) {
                        const forcedClone = block.cloneNode(true) as HTMLElement;
                        currentContent.appendChild(forcedClone);
                        pages.push(currentPage);

                        currentPage = createPdfPageContainer({
                            width: previewWidth,
                            minHeight: previewHeight,
                        });
                        sandbox.appendChild(currentPage);
                        currentContent = currentPage.querySelector(".docx-preview") as HTMLElement;
                    } else {
                        pages.push(currentPage);

                        currentPage = createPdfPageContainer({
                            width: previewWidth,
                            minHeight: previewHeight,
                        });
                        sandbox.appendChild(currentPage);
                        currentContent = currentPage.querySelector(".docx-preview") as HTMLElement;
                        currentContent.appendChild(block.cloneNode(true));
                    }
                }
            }

            if (currentContent.children.length > 0 && !pages.includes(currentPage)) {
                pages.push(currentPage);
            }

            if (!pages.length) {
                throw new Error("No printable pages were created.");
            }

            for (let i = 0; i < pages.length; i++) {
                const canvas = await html2canvas(pages[i], {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: "#ffffff",
                });

                const imageData = canvas.toDataURL("image/jpeg", 0.95);

                if (i > 0) {
                    pdf.addPage();
                }

                pdf.addImage(
                    imageData,
                    "JPEG",
                    pageMargin,
                    pageMargin,
                    usableWidth,
                    usableHeight
                );
            }

            const name = (file?.name || "document").replace(/\.docx$/i, "");
            pdf.save(`${name}.pdf`);
        } catch (err) {
            console.error(err);
            setError("Could not export the PDF. Please try again.");
        } finally {
            if (sandbox && sandbox.parentNode) {
                sandbox.parentNode.removeChild(sandbox);
            }
            setIsGenerating(false);
        }
    };

    return (
        <section className="space-y-6">
            <div className="relative overflow-hidden rounded-[2rem] border bg-background">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.11),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.10),transparent_24%)]" />
                <div className="relative p-6 md:p-8 lg:p-10">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to home
                    </Link>

                    <div className="mt-6 inline-flex rounded-full border bg-background/80 px-3 py-1 text-xs text-muted-foreground">
                        DOCX to PDF export
                    </div>

                    <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
                        Convert Word documents to PDF
                    </h1>

                    <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                        Upload a DOCX file, adjust spacing in the preview, edit the content,
                        and export a cleaner PDF directly in your browser.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-2">
                            <Zap className="h-4 w-4" />
                            Fast in-browser conversion
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-2">
                            <Shield className="h-4 w-4" />
                            No upload required
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-2">
                            <Type className="h-4 w-4" />
                            Edit and export preview
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-[2rem] border bg-background p-5 shadow-sm md:p-6">
                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`rounded-[1.5rem] border border-dashed px-6 py-10 text-center transition ${isDragging ? "border-orange-500 bg-orange-50/40 dark:bg-orange-950/10" : ""
                        }`}
                >
                    <div className="mx-auto w-fit rounded-2xl bg-muted p-4">
                        <Upload className="h-7 w-7" />
                    </div>

                    <h2 className="mt-5 text-2xl font-semibold tracking-tight">
                        Drop your DOCX here
                    </h2>

                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                        Upload a Word document in .docx format, preview it, edit it, and export it.
                    </p>

                    <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:opacity-90"
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Select DOCX
                        </button>

                        <button
                            type="button"
                            onClick={resetAll}
                            className="inline-flex min-h-11 items-center justify-center rounded-xl border px-5 py-3 text-sm font-medium transition hover:bg-muted"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Reset
                        </button>
                    </div>

                    <input
                        ref={inputRef}
                        type="file"
                        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="hidden"
                        onChange={(e) => addFile(e.target.files?.[0] || null)}
                    />
                </div>

                <div className="mt-4 rounded-[1.5rem] border bg-muted/30 p-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-background p-3">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                                {file ? file.name : "No DOCX selected"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {file
                                    ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                                    : "Choose a Word file to begin"}
                            </p>
                        </div>
                    </div>
                </div>

                {error ? (
                    <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
                ) : null}

                {warning ? (
                    <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
                        {warning}
                    </p>
                ) : null}
            </div>

            <div className="rounded-[2rem] border bg-background shadow-sm">
                <div className="sticky top-3 z-20 rounded-t-[2rem] border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                    <div className="flex flex-col gap-3 px-4 py-4 md:px-6">
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">Edit and export</h2>
                                <p className="text-sm text-muted-foreground">
                                    Keep editing, layout controls, and PDF export together in one workspace.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => inputRef.current?.click()}
                                    className="inline-flex min-h-11 items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    Change DOCX
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setShowSettings((prev) => !prev)}
                                    className="inline-flex min-h-11 items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                                >
                                    <Settings2 className="mr-2 h-4 w-4" />
                                    {showSettings ? "Hide settings" : "Show settings"}
                                </button>

                                <button
                                    type="button"
                                    onClick={generatePdf}
                                    disabled={!editableHtml || isGenerating || isParsing}
                                    className="hidden min-h-11 items-center justify-center rounded-xl bg-orange-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60 md:inline-flex"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Exporting PDF...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="mr-2 h-4 w-4" />
                                            Download PDF
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <div className="rounded-full border px-3 py-1">
                                Format: {pageFormat.toUpperCase()}
                            </div>
                            <div className="rounded-full border px-3 py-1">
                                Margin: {margin}
                            </div>
                            <div className="rounded-full border px-3 py-1">
                                Font: {fontSize}px
                            </div>
                            <div className="rounded-full border px-3 py-1">
                                Editing: {isEditMode ? "on" : "off"}
                            </div>
                        </div>

                        {showSettings ? (
                            <div className="grid gap-4 rounded-[1.25rem] border bg-muted/30 p-4 lg:grid-cols-2 xl:grid-cols-3">
                                <SettingGroup
                                    label="Page format"
                                    value={pageFormat}
                                    onChange={(value) => setPageFormat(value as PageFormat)}
                                    options={[
                                        { label: "A4", value: "a4" },
                                        { label: "Letter", value: "letter" },
                                    ]}
                                    columns={2}
                                />

                                <SettingGroup
                                    label="PDF margins"
                                    value={margin}
                                    onChange={(value) => setMargin(value as PageMargin)}
                                    options={[
                                        { label: "Narrow", value: "narrow" },
                                        { label: "Normal", value: "normal" },
                                        { label: "Wide", value: "wide" },
                                    ]}
                                    columns={3}
                                />

                                <div>
                                    <label className="text-sm font-medium">Editing mode</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditMode((prev) => !prev)}
                                        className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                                    >
                                        {isEditMode ? "Disable text editing" : "Enable text editing"}
                                    </button>
                                </div>

                                <SliderControl
                                    label="Line height"
                                    min={1.2}
                                    max={2.2}
                                    step={0.05}
                                    value={lineHeight}
                                    onChange={setLineHeight}
                                />

                                <SliderControl
                                    label="Paragraph spacing"
                                    min={0}
                                    max={2.5}
                                    step={0.1}
                                    value={paragraphSpacing}
                                    onChange={setParagraphSpacing}
                                />

                                <SliderControl
                                    label="Preview page padding"
                                    min={24}
                                    max={72}
                                    step={4}
                                    value={pagePadding}
                                    onChange={setPagePadding}
                                />

                                <SliderControl
                                    label="Preview font size"
                                    min={12}
                                    max={20}
                                    step={1}
                                    value={fontSize}
                                    onChange={setFontSize}
                                />

                                <div className="lg:col-span-2 xl:col-span-3">
                                    <button
                                        type="button"
                                        onClick={resetPreviewEdits}
                                        disabled={!html}
                                        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <RotateCcw className="mr-2 h-4 w-4" />
                                        Reset preview edits
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                {!editableHtml ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                        Parsed DOCX content will appear here.
                    </div>
                ) : (
                    <div className="w-full overflow-x-auto bg-muted/20">
                        <div className="min-w-full px-2 py-4 md:px-4 md:py-6">
                            <div ref={previewRef} className="mx-auto w-full max-w-[1100px]">
                                <div
                                    className="mx-auto w-full bg-white text-black shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
                                    style={{ padding: `${pagePadding}px` }}
                                >
                                    <div
                                        ref={editorRef}
                                        className="docx-preview min-h-[70vh] w-full max-w-none outline-none"
                                        contentEditable={isEditMode}
                                        suppressContentEditableWarning
                                        onInput={handlePreviewInput}
                                        style={
                                            {
                                                lineHeight,
                                                fontSize: `${fontSize}px`,
                                                ["--paragraph-spacing" as any]: `${paragraphSpacing}em`,
                                            } as React.CSSProperties
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {editableHtml ? (
                <div className="sticky bottom-4 z-20 flex justify-center px-2 md:hidden">
                    <button
                        type="button"
                        onClick={generatePdf}
                        disabled={!editableHtml || isGenerating || isParsing}
                        className="inline-flex min-h-12 items-center justify-center rounded-full bg-orange-600 px-6 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Exporting PDF...
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF
                            </>
                        )}
                    </button>
                </div>
            ) : null}

            <style jsx global>{`
        .docx-preview {
          font-family: Arial, Helvetica, sans-serif;
          color: #111827;
          white-space: normal;
          word-break: break-word;
        }

        .docx-preview h1,
        .docx-preview h2,
        .docx-preview h3,
        .docx-preview h4,
        .docx-preview h5,
        .docx-preview h6 {
          margin-top: 1.4em;
          margin-bottom: 0.6em;
          line-height: 1.25;
          font-weight: 700;
        }

        .docx-preview p {
          margin-top: 0;
          margin-bottom: var(--paragraph-spacing, 1em);
          white-space: pre-wrap;
        }

        .docx-preview p:empty {
          min-height: 1.2em;
          margin-bottom: var(--paragraph-spacing, 1em);
        }

        .docx-preview ul,
        .docx-preview ol {
          margin: 0 0 var(--paragraph-spacing, 1em) 1.4em;
          padding-left: 1.2em;
        }

        .docx-preview li {
          margin: 0.25em 0;
        }

        .docx-preview blockquote {
          margin: 1em 0;
          padding-left: 1em;
          border-left: 3px solid #d1d5db;
        }

        .docx-preview table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.2em 0;
        }

        .docx-preview th,
        .docx-preview td {
          border: 1px solid #d1d5db;
          padding: 10px 12px;
          vertical-align: top;
        }

        .docx-preview img {
          max-width: 100%;
          height: auto;
        }

        .docx-preview a {
          color: #1d4ed8;
          text-decoration: underline;
        }

        .docx-preview hr {
          border: 0;
          border-top: 1px solid #d1d5db;
          margin: 1.5em 0;
        }
      `}</style>
        </section>
    );
}

function SettingGroup({
    label,
    value,
    onChange,
    options,
    columns,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { label: string; value: string }[];
    columns: 2 | 3;
}) {
    return (
        <div>
            <label className="text-sm font-medium">{label}</label>
            <div className={`mt-2 grid gap-2 ${columns === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {options.map((option) => (
                    <button
                        type="button"
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className={`rounded-xl border px-3 py-2 text-sm transition ${value === option.value
                            ? "border-foreground bg-foreground text-background"
                            : "hover:bg-muted"
                            }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

function SliderControl({
    label,
    min,
    max,
    step,
    value,
    onChange,
}: {
    label: string;
    min: number;
    max: number;
    step: number;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <div>
            <div className="mb-2 flex items-center justify-between gap-3">
                <label className="text-sm font-medium">{label}</label>
                <span className="text-xs text-muted-foreground">{value}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full"
            />
        </div>
    );
}