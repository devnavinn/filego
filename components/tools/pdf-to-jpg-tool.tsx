"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import JSZip from "jszip";
import {
    ArrowLeft,
    Download,
    FileImage,
    FileText,
    Loader2,
    Settings2,
    Shield,
    Trash2,
    Upload,
    Zap,
} from "lucide-react";

type OutputImage = {
    name: string;
    url: string;
    blob: Blob;
    pageNumber: number;
};

type QualityOption = "high" | "medium" | "low";
type ScaleOption = "1" | "1.5" | "2";

export function PdfToJpgTool() {
    const inputRef = useRef<HTMLInputElement | null>(null);

    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [quality, setQuality] = useState<QualityOption>("high");
    const [scale, setScale] = useState<ScaleOption>("1.5");
    const [pages, setPages] = useState<OutputImage[]>([]);
    const [error, setError] = useState("");
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [progressText, setProgressText] = useState("");

    const [pdfReady, setPdfReady] = useState(false);

    const getBrowserPdfJs = () => {
        if (typeof window === "undefined") return null;
        return window.pdfjsLib ?? (globalThis as typeof globalThis & { pdfjsLib?: typeof window.pdfjsLib }).pdfjsLib ?? null;
    };

    useEffect(() => {
        const check = () => {
            const lib = getBrowserPdfJs();
            if (lib) {
                lib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.js";
                setPdfReady(true);
            }
        };

        check();

        const timer = window.setInterval(() => {
            check();
        }, 200);

        return () => window.clearInterval(timer);
    }, []);

    const qualityValue = useMemo(() => {
        if (quality === "low") return 0.72;
        if (quality === "medium") return 0.84;
        return 0.92;
    }, [quality]);

    useEffect(() => {
        return () => {
            pages.forEach((page) => URL.revokeObjectURL(page.url));
        };
    }, [pages]);

    const clearResults = () => {
        setPages((prev) => {
            prev.forEach((page) => URL.revokeObjectURL(page.url));
            return [];
        });
        setProgressText("");
    };

    const addFile = (picked: File | null) => {
        if (!picked) return;

        const isPdf =
            picked.type === "application/pdf" || picked.name.toLowerCase().endsWith(".pdf");

        if (!isPdf) {
            setError("Please upload a valid PDF file.");
            return;
        }

        clearResults();
        setFile(picked);
        setError("");
    };

    const resetAll = () => {
        clearResults();
        setFile(null);
        setError("");
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

    const convertPdf = async () => {
        if (!file) {
            setError("Upload a PDF to continue.");
            return;
        }

        if (!window.pdfjsLib) {
            setError("PDF engine is still loading. Please try again.");
            return;
        }

        try {
            setIsConverting(true);
            setError("");
            clearResults();
            setProgressText("Reading PDF file...");

            const pdfjsLib = window.pdfjsLib ?? null;

            if (!pdfjsLib) {
                setError("PDF engine is still loading. Please wait a moment and try again.");
                return;
            }

            pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;

            const buffer = await file.arrayBuffer();
            const uint8 = new Uint8Array(buffer);

            setProgressText("Loading PDF document...");
            const loadingTask = pdfjsLib.getDocument({ data: uint8 }) as {
                promise: Promise<any>;
                onProgress?: (progress: { loaded: number; total: number }) => void;
            };

            loadingTask.onProgress = (progress) => {
                if (progress.total > 0) {
                    const percent = Math.round((progress.loaded / progress.total) * 100);
                    setProgressText(`Loading PDF document... ${percent}%`);
                }
            };

            const pdf = await loadingTask.promise;
            const renderedPages: OutputImage[] = [];

            for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
                setProgressText(`Rendering page ${pageNumber} of ${pdf.numPages}...`);

                const page = await pdf.getPage(pageNumber);
                const viewport = page.getViewport({ scale: Number(scale) });

                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d", { alpha: false });

                if (!context) {
                    throw new Error("Canvas context is not available.");
                }

                canvas.width = Math.max(1, Math.floor(viewport.width));
                canvas.height = Math.max(1, Math.floor(viewport.height));

                context.fillStyle = "#ffffff";
                context.fillRect(0, 0, canvas.width, canvas.height);

                const renderTask = page.render({
                    canvasContext: context,
                    viewport,
                });

                await renderTask.promise;

                const blob = await canvasToBlob(canvas, "image/jpeg", qualityValue);
                const url = URL.createObjectURL(blob);
                const baseName = file.name.replace(/\.pdf$/i, "");
                const name = `${baseName}-page-${pageNumber}.jpg`;

                renderedPages.push({
                    name,
                    url,
                    blob,
                    pageNumber,
                });

                page.cleanup();
            }

            setPages(renderedPages);
            setProgressText(`Done. Converted ${renderedPages.length} page${renderedPages.length === 1 ? "" : "s"}.`);
        } catch (err) {
            console.error(err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not convert this PDF. Try another file."
            );
            setProgressText("");
        } finally {
            setIsConverting(false);
        }
    };

    const downloadSingle = (item: OutputImage) => {
        const a = document.createElement("a");
        a.href = item.url;
        a.download = item.name;
        a.click();
    };

    const downloadAll = async () => {
        if (!pages.length) return;

        const zip = new JSZip();
        pages.forEach((page) => {
            zip.file(page.name, page.blob);
        });

        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        const baseName = (file?.name || "converted-file").replace(/\.pdf$/i, "");

        const a = document.createElement("a");
        a.href = url;
        a.download = `${baseName}-jpg-images.zip`;
        a.click();

        URL.revokeObjectURL(url);
    };

    const PDFJS_CDN =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    const PDFJS_WORKER_CDN =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    return (
        <>
            <Script
                src={PDFJS_CDN}
                strategy="afterInteractive"
                onLoad={() => {
                    if (window.pdfjsLib) {
                        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
                        setPdfReady(true);
                        setError("");
                    } else {
                        setPdfReady(false);
                        setError("PDF engine loaded incorrectly.");
                    }
                }}
                onError={() => {
                    setPdfReady(false);
                    setError("Failed to load the PDF engine.");
                }}
            />
            <section className="space-y-6">
                <div className="relative overflow-hidden rounded-[2rem] border bg-background">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.10),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.10),transparent_24%)]" />
                    <div className="relative p-6 md:p-8 lg:p-10">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to home
                        </Link>

                        <div className="mt-6 inline-flex rounded-full border bg-background/80 px-3 py-1 text-xs text-muted-foreground">
                            High-quality image export
                        </div>

                        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
                            Convert PDF pages to JPG
                        </h1>

                        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                            Upload a PDF, convert every page in the browser, and download clean JPG images from one focused workspace.
                        </p>

                        <div className="mt-6 flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-2">
                                <Zap className="h-4 w-4" />
                                Fast local conversion
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-2">
                                <Shield className="h-4 w-4" />
                                Your file stays in browser
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
                    className={`rounded-[2rem] border bg-background p-5 shadow-sm transition md:p-6 ${isDragging ? "border-sky-500 bg-sky-50/40 dark:bg-sky-950/10" : ""
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
                            Add one PDF file, then convert and download all pages from the same workspace below.
                        </p>

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                            <button
                                onClick={() => inputRef.current?.click()}
                                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:opacity-90"
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                Select PDF
                            </button>

                            <button
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

                    {progressText ? (
                        <p className="mt-3 text-sm text-muted-foreground">{progressText}</p>
                    ) : null}
                </div>

                <div className="rounded-[2rem] border bg-background shadow-sm">
                    <div className="sticky top-3 z-20 rounded-t-[2rem] border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                        <div className="flex flex-col gap-3 px-4 py-4 md:px-6">
                            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold">Convert and download</h2>
                                    <p className="text-sm text-muted-foreground">
                                        Keep conversion, settings, and downloads together above the results.
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
                                        onClick={convertPdf}
                                        disabled={!file || isConverting}
                                        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-sky-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isConverting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Converting...
                                            </>
                                        ) : (
                                            <>
                                                <FileImage className="mr-2 h-4 w-4" />
                                                Convert to JPG
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={downloadAll}
                                        disabled={!pages.length}
                                        className="inline-flex min-h-11 items-center justify-center rounded-xl border px-5 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <Download className="mr-2 h-4 w-4" />
                                        Download ZIP
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <div className="rounded-full border px-3 py-1">
                                    {pages.length} {pages.length === 1 ? "page" : "pages"}
                                </div>
                                <div className="rounded-full border px-3 py-1">
                                    Quality: {quality}
                                </div>
                                <div className="rounded-full border px-3 py-1">
                                    Scale: {scale}x
                                </div>
                            </div>

                            {showAdvanced ? (
                                <div className="grid gap-4 rounded-[1.25rem] border bg-muted/30 p-4 md:grid-cols-2">
                                    <SettingGroup
                                        label="JPG quality"
                                        value={quality}
                                        onChange={(value) => setQuality(value as QualityOption)}
                                        options={[
                                            { label: "High", value: "high" },
                                            { label: "Medium", value: "medium" },
                                            { label: "Low", value: "low" },
                                        ]}
                                    />

                                    <SettingGroup
                                        label="Render scale"
                                        value={scale}
                                        onChange={(value) => setScale(value as ScaleOption)}
                                        options={[
                                            { label: "1x", value: "1" },
                                            { label: "1.5x", value: "1.5" },
                                            { label: "2x", value: "2" },
                                        ]}
                                    />
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="p-4 md:p-6">
                        {pages.length === 0 ? (
                            <div className="rounded-[1.5rem] border border-dashed p-10 text-center text-sm text-muted-foreground">
                                Converted JPG pages will appear here.
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {pages.map((page) => (
                                    <div
                                        key={page.name}
                                        className="overflow-hidden rounded-[1.5rem] border bg-card"
                                    >
                                        <div className="aspect-[3/4] overflow-hidden bg-muted">
                                            <img
                                                src={page.url}
                                                alt={`PDF page ${page.pageNumber} converted to JPG`}
                                                className="h-full w-full object-cover object-top"
                                            />
                                        </div>

                                        <div className="space-y-3 p-4">
                                            <div>
                                                <p className="text-sm font-medium">Page {page.pageNumber}</p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {page.name}
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => downloadSingle(page)}
                                                className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                                            >
                                                <Download className="mr-2 h-4 w-4" />
                                                Download JPG
                                            </button>
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
            <div className="mt-2 grid grid-cols-3 gap-2">
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


function canvasToBlob(
    canvas: HTMLCanvasElement,
    type: string,
    quality?: number
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error("Failed to create image blob."));
                return;
            }
            resolve(blob);
        }, type, quality);
    });
}