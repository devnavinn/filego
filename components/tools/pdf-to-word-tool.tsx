"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { saveAs } from "file-saver";
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
} from "docx";
import {
    ArrowLeft,
    Download,
    FileText,
    Loader2,
    Shield,
    Trash2,
    Upload,
    Zap,
    Settings2,
} from "lucide-react";

type ExtractionMode = "balanced" | "text-first";
type SpacingMode = "compact" | "normal" | "loose";
type PdfStatus = "idle" | "loading" | "ready" | "error";

type ExtractedLine = {
    text: string;
    y: number;
    x: number;
    fontSize: number;
    isLikelyHeading: boolean;
};

type ExtractedPage = {
    pageNumber: number;
    lines: ExtractedLine[];
};

type PdfTextItem = {
    str?: string;
    transform?: number[];
};

declare global {
    interface Window {
        pdfjsLib?: {
            GlobalWorkerOptions: {
                workerSrc: string;
            };
            getDocument: (src: { data: Uint8Array }) => {
                promise: Promise<{
                    numPages: number;
                    getPage: (pageNumber: number) => Promise<{
                        getTextContent: () => Promise<{
                            items: PdfTextItem[];
                        }>;
                    }>;
                }>;
            };
        };
    }
}

const PDFJS_CDN =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDFJS_WORKER_CDN =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

export function PdfToWordTool() {
    const inputRef = useRef<HTMLInputElement | null>(null);

    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [mode, setMode] = useState<ExtractionMode>("balanced");
    const [spacingMode, setSpacingMode] = useState<SpacingMode>("normal");
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [pageCount, setPageCount] = useState<number>(0);
    const [previewPages, setPreviewPages] = useState<ExtractedPage[]>([]);
    const [error, setError] = useState("");
    const [warning, setWarning] = useState("");
    const [pdfStatus, setPdfStatus] = useState<PdfStatus>("loading");

    const paragraphSpacing = useMemo(() => {
        if (spacingMode === "compact") return 80;
        if (spacingMode === "loose") return 220;
        return 140;
    }, [spacingMode]);

    const getBrowserPdfJs = () => {
        if (typeof window === "undefined") return null;
        return window.pdfjsLib ?? null;
    };

    const resetResultsOnly = () => {
        setPreviewPages([]);
        setPageCount(0);
    };

    const addFile = (picked: File | null) => {
        if (!picked) return;

        const isPdf =
            picked.type === "application/pdf" ||
            picked.name.toLowerCase().endsWith(".pdf");

        if (!isPdf) {
            setError("Please upload a valid PDF file.");
            return;
        }

        resetResultsOnly();
        setFile(picked);
        setError("");
        setWarning("");
    };

    const resetAll = () => {
        resetResultsOnly();
        setFile(null);
        setError("");
        setWarning("");
        setMode("balanced");
        setSpacingMode("normal");
        setShowAdvanced(false);

        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files?.length) {
            addFile(e.dataTransfer.files[0]);
        }
    };

    const convertPdfToWord = async () => {
        if (!file) {
            setError("Upload a PDF to continue.");
            return;
        }

        const pdfjsLib = getBrowserPdfJs();

        if (!pdfjsLib) {
            setError("PDF engine is still loading. Please wait a moment and try again.");
            return;
        }

        try {
            setIsConverting(true);
            setError("");
            setWarning("");
            resetResultsOnly();

            pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;

            const buffer = await file.arrayBuffer();
            const uint8 = new Uint8Array(buffer);

            const loadingTask = pdfjsLib.getDocument({ data: uint8 });
            const pdf = await loadingTask.promise;

            setPageCount(pdf.numPages);

            const extractedPages: ExtractedPage[] = [];

            for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
                const page = await pdf.getPage(pageNumber);
                const textContent = await page.getTextContent();

                const rawItems = textContent.items
                    .map((item) => {
                        const transform = item.transform || [0, 0, 0, 0, 0, 0];
                        const x = Number(transform[4] || 0);
                        const y = Number(transform[5] || 0);
                        const fontSize = Math.abs(Number(transform[0] || transform[3] || 12));
                        const text = String(item.str || "").trim();

                        return { text, x, y, fontSize };
                    })
                    .filter((item) => item.text.length > 0);

                const groupedLines = groupItemsIntoLines(rawItems, mode);

                const avgFont =
                    groupedLines.length > 0
                        ? groupedLines.reduce((sum, line) => sum + line.fontSize, 0) /
                        groupedLines.length
                        : 12;

                const normalizedLines: ExtractedLine[] = groupedLines.map((line) => ({
                    ...line,
                    isLikelyHeading:
                        line.fontSize > avgFont * 1.18 || isLikelyHeadingText(line.text),
                }));

                extractedPages.push({
                    pageNumber,
                    lines: normalizedLines,
                });
            }

            setPreviewPages(extractedPages);

            const doc = new Document({
                sections: extractedPages.map((page) => ({
                    properties: {},
                    children: buildDocxParagraphs(page.lines, paragraphSpacing),
                })),
            });

            const blob = await Packer.toBlob(doc);
            const baseName = file.name.replace(/\.pdf$/i, "");

            if (looksLikeScannedPdf(extractedPages)) {
                setWarning(
                    "This PDF appears to have very little extractable text. It may be scanned or image-based, so the Word output may be limited without OCR."
                );
            } else {
                setWarning(
                    "This conversion works best for text-based PDFs. Complex tables, columns, and exact visual layout may not fully match the original."
                );
            }

            saveAs(blob, `${baseName}.docx`);
        } catch (err) {
            console.error(err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not convert this PDF to Word. Try another file."
            );
        } finally {
            setIsConverting(false);
        }
    };

    return (
        <>
            <Script
                id="pdfjs-cdn-script"
                src={PDFJS_CDN}
                strategy="afterInteractive"
                onLoad={() => {
                    if (window.pdfjsLib) {
                        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
                        setPdfStatus("ready");
                        setError((prev) =>
                            prev === "Failed to load the PDF engine." ||
                                prev === "PDF engine loaded incorrectly."
                                ? ""
                                : prev
                        );
                    } else {
                        setPdfStatus("error");
                        setError("PDF engine loaded incorrectly.");
                    }
                }}
                onError={() => {
                    setPdfStatus("error");
                    setError("Failed to load the PDF engine.");
                }}
            />

            <section className="space-y-6">
                <div className="relative overflow-hidden rounded-[2rem] border bg-background">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.10),transparent_24%)]" />
                    <div className="relative p-6 md:p-8 lg:p-10">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to home
                        </Link>

                        <div className="mt-6 inline-flex rounded-full border bg-background/80 px-3 py-1 text-xs text-muted-foreground">
                            Editable DOCX export
                        </div>

                        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
                            Convert PDF to Word
                        </h1>

                        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                            Upload a PDF, extract readable text in the browser, preview the recovered structure,
                            and download an editable Word document.
                        </p>

                        <div className="mt-6 flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-2">
                                <Zap className="h-4 w-4" />
                                Browser-based extraction
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-2">
                                <Shield className="h-4 w-4" />
                                No upload required
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-2">
                                {pdfStatus === "ready"
                                    ? "Engine ready"
                                    : pdfStatus === "error"
                                        ? "Engine failed"
                                        : "Loading engine"}
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`rounded-[2rem] border bg-background p-5 shadow-sm transition md:p-6 ${isDragging ? "border-blue-500 bg-blue-50/40 dark:bg-blue-950/10" : ""
                        }`}
                >
                    <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed px-6 py-12 text-center">
                        <div className="rounded-2xl bg-muted p-4">
                            <Upload className="h-7 w-7" />
                        </div>

                        <h2 className="mt-5 text-2xl font-semibold tracking-tight">
                            Select your PDF
                        </h2>

                        <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
                            Add one PDF file, then extract its text into an editable Word document.
                        </p>

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:opacity-90"
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                Select PDF
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
                            accept="application/pdf,.pdf"
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
                                <p className="text-sm font-medium">
                                    {file ? file.name : "No PDF selected"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {file
                                        ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                                        : "Choose a PDF to begin"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {error ? (
                        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
                    ) : null}

                    {warning ? (
                        <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">{warning}</p>
                    ) : null}
                </div>

                <div className="rounded-[2rem] border bg-background shadow-sm">
                    <div className="sticky top-3 z-20 rounded-t-[2rem] border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                        <div className="flex flex-col gap-3 px-4 py-4 md:px-6">
                            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold">Extract and export</h2>
                                    <p className="text-sm text-muted-foreground">
                                        Keep settings, conversion, and preview together in one workspace.
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => inputRef.current?.click()}
                                        className="inline-flex min-h-11 items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                                    >
                                        <Upload className="mr-2 h-4 w-4" />
                                        Change PDF
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setShowAdvanced((prev) => !prev)}
                                        className="inline-flex min-h-11 items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                                    >
                                        <Settings2 className="mr-2 h-4 w-4" />
                                        {showAdvanced ? "Hide settings" : "Show settings"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={convertPdfToWord}
                                        disabled={!file || isConverting || pdfStatus !== "ready"}
                                        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isConverting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Converting...
                                            </>
                                        ) : pdfStatus !== "ready" ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Loading engine...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="mr-2 h-4 w-4" />
                                                Download Word
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <div className="rounded-full border px-3 py-1">
                                    {pageCount} {pageCount === 1 ? "page" : "pages"}
                                </div>
                                <div className="rounded-full border px-3 py-1">
                                    Mode: {mode}
                                </div>
                                <div className="rounded-full border px-3 py-1">
                                    Spacing: {spacingMode}
                                </div>
                            </div>

                            {showAdvanced ? (
                                <div className="grid gap-4 rounded-[1.25rem] border bg-muted/30 p-4 md:grid-cols-2">
                                    <SettingGroup
                                        label="Extraction mode"
                                        value={mode}
                                        onChange={(value) => setMode(value as ExtractionMode)}
                                        options={[
                                            { label: "Balanced", value: "balanced" },
                                            { label: "Text first", value: "text-first" },
                                        ]}
                                    />

                                    <SettingGroup
                                        label="Word spacing"
                                        value={spacingMode}
                                        onChange={(value) => setSpacingMode(value as SpacingMode)}
                                        options={[
                                            { label: "Compact", value: "compact" },
                                            { label: "Normal", value: "normal" },
                                            { label: "Loose", value: "loose" },
                                        ]}
                                    />
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="p-4 md:p-6">
                        {previewPages.length === 0 ? (
                            <div className="rounded-[1.5rem] border border-dashed p-10 text-center text-sm text-muted-foreground">
                                Extracted page text preview will appear here after conversion.
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {previewPages.map((page) => (
                                    <div
                                        key={page.pageNumber}
                                        className="rounded-[1.5rem] border bg-card p-4"
                                    >
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <h3 className="text-sm font-semibold">Page {page.pageNumber}</h3>
                                            <div className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
                                                {page.lines.length} {page.lines.length === 1 ? "line" : "lines"}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {page.lines.slice(0, 18).map((line, index) => (
                                                <p
                                                    key={`${page.pageNumber}-${index}`}
                                                    className={`text-sm ${line.isLikelyHeading ? "font-semibold" : "text-muted-foreground"
                                                        }`}
                                                >
                                                    {line.text}
                                                </p>
                                            ))}

                                            {page.lines.length > 18 ? (
                                                <p className="text-xs text-muted-foreground">
                                                    + {page.lines.length - 18} more lines
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}

function SettingGroup({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { label: string; value: string }[];
}) {
    return (
        <div>
            <label className="text-sm font-medium">{label}</label>
            <div className={`mt-2 grid gap-2 ${options.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
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

function groupItemsIntoLines(
    items: { text: string; x: number; y: number; fontSize: number }[],
    mode: ExtractionMode
): ExtractedLine[] {
    const sorted = [...items].sort((a, b) => {
        if (Math.abs(b.y - a.y) > 2) return b.y - a.y;
        return a.x - b.x;
    });

    const tolerance = mode === "text-first" ? 4 : 2.5;
    const lines: { items: typeof sorted; y: number }[] = [];

    for (const item of sorted) {
        const existing = lines.find((line) => Math.abs(line.y - item.y) <= tolerance);

        if (existing) {
            existing.items.push(item);
        } else {
            lines.push({
                items: [item],
                y: item.y,
            });
        }
    }

    return lines
        .map((line) => {
            const ordered = [...line.items].sort((a, b) => a.x - b.x);

            const combined = ordered
                .map((item, index) => {
                    const prev = ordered[index - 1];
                    if (!prev) return item.text;

                    const gap = item.x - prev.x;
                    const spacer = gap > prev.fontSize * 1.8 ? "    " : " ";
                    return `${spacer}${item.text}`;
                })
                .join("")
                .replace(/\s+/g, " ")
                .trim();

            const avgFont =
                ordered.reduce((sum, item) => sum + item.fontSize, 0) /
                Math.max(ordered.length, 1);

            return {
                text: combined,
                y: line.y,
                x: ordered[0]?.x ?? 0,
                fontSize: avgFont,
            };
        })
        .filter((line) => line.text.length > 0)
        .sort((a, b) => b.y - a.y);
}

function buildDocxParagraphs(lines: ExtractedLine[], spacing: number) {
    const children: Paragraph[] = [];

    for (const line of lines) {
        if (!line.text.trim()) continue;

        if (line.isLikelyHeading) {
            children.push(
                new Paragraph({
                    heading: HeadingLevel.HEADING_2,
                    spacing: { after: spacing },
                    children: [
                        new TextRun({
                            text: line.text,
                            bold: true,
                        }),
                    ],
                })
            );
        } else {
            children.push(
                new Paragraph({
                    spacing: { after: spacing },
                    alignment: AlignmentType.LEFT,
                    children: [
                        new TextRun({
                            text: line.text,
                        }),
                    ],
                })
            );
        }
    }

    if (children.length === 0) {
        children.push(
            new Paragraph({
                children: [new TextRun("No extractable text was found on this page.")],
            })
        );
    }

    return children;
}

function isLikelyHeadingText(text: string) {
    const trimmed = text.trim();

    if (!trimmed) return false;
    if (trimmed.length > 90) return false;

    const words = trimmed.split(/\s+/);
    const titleCaseCount = words.filter((word) => /^[A-Z][a-z]/.test(word)).length;

    return (
        words.length <= 10 &&
        (titleCaseCount >= Math.ceil(words.length * 0.6) || /^[A-Z0-9\s\-:&]+$/.test(trimmed))
    );
}

function looksLikeScannedPdf(pages: ExtractedPage[]) {
    const totalLines = pages.reduce((sum, page) => sum + page.lines.length, 0);
    const totalChars = pages.reduce(
        (sum, page) => sum + page.lines.reduce((lineSum, line) => lineSum + line.text.length, 0),
        0
    );

    return totalLines < 8 || totalChars < 100;
}