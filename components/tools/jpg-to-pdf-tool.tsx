"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PDFDocument } from "pdf-lib";
import { completeUsageJob, startUsageJob } from "@/lib/usage-client";
import {
    ArrowDown,
    ArrowLeft,
    ArrowUp,
    Download,
    FileImage,
    GripVertical,
    ImagePlus,
    Loader2,
    Settings2,
    Shield,
    Trash2,
    Upload,
    Zap,
} from "lucide-react";

type ImageItem = {
    id: string;
    file: File;
    preview: string;
    width: number;
    height: number;
};

type PageSize = "fit-image" | "a4" | "letter";
type PageOrientation = "portrait" | "landscape";
type PageMargin = "none" | "small" | "medium";

const pageSizeMap = {
    a4: { portrait: [595.28, 841.89], landscape: [841.89, 595.28] },
    letter: { portrait: [612, 792], landscape: [792, 612] },
} as const;

function toSafeArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    const buffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(buffer).set(bytes);
    return buffer;
}

export function JpgToPdfTool() {
    const [images, setImages] = useState<ImageItem[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [pageSize, setPageSize] = useState<PageSize>("fit-image");
    const [orientation, setOrientation] = useState<PageOrientation>("portrait");
    const [margin, setMargin] = useState<PageMargin>("none");
    const [error, setError] = useState("");
    const [dragId, setDragId] = useState<string | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const inputRef = useRef<HTMLInputElement | null>(null);

    const marginValue = useMemo(() => {
        if (margin === "none") return 0;
        if (margin === "small") return 24;
        return 40;
    }, [margin]);

    useEffect(() => {
        return () => {
            images.forEach((item) => URL.revokeObjectURL(item.preview));
        };
    }, [images]);

    const addFiles = async (fileList: FileList | File[]) => {
        const picked = Array.from(fileList).filter((file) =>
            /image\/(jpeg|jpg|png|webp)/.test(file.type)
        );

        if (!picked.length) {
            setError("Please choose JPG, PNG, or WebP images.");
            return;
        }

        const items = await Promise.all(
            picked.map(async (file) => {
                const preview = URL.createObjectURL(file);
                const dimensions = await getImageDimensions(preview);

                return {
                    id: crypto.randomUUID(),
                    file,
                    preview,
                    width: dimensions.width,
                    height: dimensions.height,
                };
            })
        );

        setImages((prev) => [...prev, ...items]);
        setError("");
    };

    const removeImage = (id: string) => {
        setImages((prev) => {
            const found = prev.find((item) => item.id === id);
            if (found) URL.revokeObjectURL(found.preview);
            return prev.filter((item) => item.id !== id);
        });
    };

    const moveImage = (index: number, direction: "up" | "down") => {
        setImages((prev) => {
            const next = [...prev];
            const target = direction === "up" ? index - 1 : index + 1;
            if (target < 0 || target >= next.length) return prev;
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
    };

    const clearAll = () => {
        images.forEach((item) => URL.revokeObjectURL(item.preview));
        setImages([]);
        setError("");
    };

    const handleDropZone = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.length) {
            await addFiles(e.dataTransfer.files);
        }
    };

    const handleSortDrop = (targetId: string) => {
        if (!dragId || dragId === targetId) return;

        setImages((prev) => {
            const from = prev.findIndex((item) => item.id === dragId);
            const to = prev.findIndex((item) => item.id === targetId);
            if (from === -1 || to === -1) return prev;

            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
        });

        setDragId(null);
    };

    const generatePdf = async () => {
        if (!images.length) {
            setError("Add at least one image to continue.");
            return;
        }

        try {
            setIsGenerating(true);
            setError("");

            const pdfDoc = await PDFDocument.create();

            for (const item of images) {
                const bytes = await item.file.arrayBuffer();

                const embedded =
                    item.file.type === "image/png" || item.file.type === "image/webp"
                        ? await pdfDoc.embedPng(await convertImageToPngBytes(item.file))
                        : await pdfDoc.embedJpg(bytes);

                let pageWidth = item.width;
                let pageHeight = item.height;

                if (pageSize !== "fit-image") {
                    const selected = pageSizeMap[pageSize][orientation];
                    pageWidth = selected[0];
                    pageHeight = selected[1];
                }

                const page = pdfDoc.addPage([pageWidth, pageHeight]);

                const availableWidth = Math.max(1, pageWidth - marginValue * 2);
                const availableHeight = Math.max(1, pageHeight - marginValue * 2);

                const scaled = embedded.scale(
                    Math.min(availableWidth / embedded.width, availableHeight / embedded.height)
                );

                const x = (pageWidth - scaled.width) / 2;
                const y = (pageHeight - scaled.height) / 2;

                page.drawImage(embedded, {
                    x,
                    y,
                    width: scaled.width,
                    height: scaled.height,
                });
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([toSafeArrayBuffer(pdfBytes)], {
                type: "application/pdf",
            });
            const url = URL.createObjectURL(blob);
            const downloadName = `filego-jpg-to-pdf-${Date.now()}.pdf`;

            const a = document.createElement("a");
            a.href = url;
            a.download = downloadName;
            a.click();

            try {
                const totalOriginalBytes = images.reduce(
                    (sum, item) => sum + item.file.size,
                    0
                );

                const started = await startUsageJob({
                    toolType: "JPG_TO_PDF",
                    filesCount: images.length,
                    originalBytes: totalOriginalBytes,
                    source: "web",
                    metadata: {
                        inputFormats: [...new Set(images.map((item) => item.file.type))],
                        inputNames: images.map((item) => item.file.name),
                        outputName: downloadName,
                        pageSize,
                        orientation,
                        margin,
                    },
                });

                if (started?.jobId) {
                    const savedBytes = Math.max(0, totalOriginalBytes - blob.size);
                    const compressionRate =
                        totalOriginalBytes > 0
                            ? Number(((savedBytes / totalOriginalBytes) * 100).toFixed(2))
                            : 0;

                    await completeUsageJob({
                        jobId: started.jobId,
                        outputBytes: blob.size,
                        savedBytes,
                        compressionRate,
                        status: "COMPLETED",
                        metadata: {
                            downloaded: true,
                            inputCount: images.length,
                            inputNames: images.map((item) => item.file.name),
                            outputName: downloadName,
                            pageSize,
                            orientation,
                            margin,
                        },
                    });
                }
            } catch (usageError) {
                console.error("Failed to record JPG to PDF usage", usageError);
            }

            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            setError("Could not generate the PDF. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <section className="space-y-6">
            <div className="relative overflow-hidden rounded-[2rem] border bg-background">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.10),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.10),transparent_22%)]" />
                <div className="relative p-6 md:p-8 lg:p-10">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to home
                    </Link>

                    <div className="mt-6 inline-flex rounded-full border bg-background/80 px-3 py-1 text-xs text-muted-foreground">
                        Fast browser conversion
                    </div>

                    <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
                        Convert JPG to PDF in seconds
                    </h1>

                    <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                        Upload images, arrange them, adjust export settings, and download one clean PDF from a simpler workspace.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-2">
                            <Zap className="h-4 w-4" />
                            Fast local processing
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-2">
                            <Shield className="h-4 w-4" />
                            No file upload required
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
                onDrop={handleDropZone}
                className={`rounded-[2rem] border bg-background p-5 shadow-sm transition md:p-6 ${isDragging ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/10" : ""
                    }`}
            >
                <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed px-6 py-12 text-center">
                    <div className="rounded-2xl bg-muted p-4">
                        <ImagePlus className="h-7 w-7" />
                    </div>

                    <h2 className="mt-5 text-2xl font-semibold tracking-tight">
                        Select images to start
                    </h2>

                    <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
                        Add JPG, PNG, or WebP images, then arrange and export them from the same workspace below.
                    </p>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <button
                            onClick={() => inputRef.current?.click()}
                            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:opacity-90"
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Select images
                        </button>

                        <button
                            onClick={clearAll}
                            className="inline-flex min-h-11 items-center justify-center rounded-xl border px-5 py-3 text-sm font-medium transition hover:bg-muted"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Clear all
                        </button>
                    </div>

                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                            if (e.target.files) addFiles(e.target.files);
                        }}
                    />
                </div>

                {error ? (
                    <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
                ) : null}
            </div>

            <div className="rounded-[2rem] border bg-background shadow-sm">
                <div className="sticky top-3 z-20 rounded-t-[2rem] border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                    <div className="flex flex-col gap-3 px-4 py-4 md:px-6">
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">Images and export</h2>
                                <p className="text-sm text-muted-foreground">
                                    Keep selection, ordering, settings, and download together in one place.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => inputRef.current?.click()}
                                    className="inline-flex min-h-11 items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    Add images
                                </button>

                                <button
                                    type="button"
                                    onClick={clearAll}
                                    disabled={images.length === 0}
                                    className="inline-flex min-h-11 items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Clear
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
                                    onClick={generatePdf}
                                    disabled={isGenerating || images.length === 0}
                                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generating PDF...
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
                                {images.length} {images.length === 1 ? "image" : "images"}
                            </div>
                            <div className="rounded-full border px-3 py-1">
                                Page size: {pageSize}
                            </div>
                            {pageSize !== "fit-image" ? (
                                <div className="rounded-full border px-3 py-1">
                                    {orientation}
                                </div>
                            ) : null}
                            <div className="rounded-full border px-3 py-1">
                                Margin: {margin}
                            </div>
                        </div>

                        {showAdvanced ? (
                            <div className="grid gap-4 rounded-[1.25rem] border bg-muted/30 p-4 md:grid-cols-3">
                                <SettingGroup
                                    label="Page size"
                                    value={pageSize}
                                    onChange={(value) => setPageSize(value as PageSize)}
                                    options={[
                                        { label: "Fit", value: "fit-image" },
                                        { label: "A4", value: "a4" },
                                        { label: "Letter", value: "letter" },
                                    ]}
                                />

                                <SettingGroup
                                    label="Orientation"
                                    value={orientation}
                                    onChange={(value) => setOrientation(value as PageOrientation)}
                                    options={[
                                        { label: "Portrait", value: "portrait" },
                                        { label: "Landscape", value: "landscape" },
                                    ]}
                                />

                                <SettingGroup
                                    label="Margins"
                                    value={margin}
                                    onChange={(value) => setMargin(value as PageMargin)}
                                    options={[
                                        { label: "None", value: "none" },
                                        { label: "Small", value: "small" },
                                        { label: "Medium", value: "medium" },
                                    ]}
                                />
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="p-4 md:p-6">
                    {images.length === 0 ? (
                        <div className="rounded-[1.5rem] border border-dashed p-10 text-center text-sm text-muted-foreground">
                            Added images will appear here in export order.
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {images.map((item, index) => (
                                <div
                                    key={item.id}
                                    draggable
                                    onDragStart={() => setDragId(item.id)}
                                    onDragEnd={() => setDragId(null)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() => handleSortDrop(item.id)}
                                    className="grid gap-4 rounded-[1.5rem] border bg-card p-3 md:grid-cols-[120px_1fr_auto]"
                                >
                                    <div className="overflow-hidden rounded-xl bg-muted">
                                        <img
                                            src={item.preview}
                                            alt={item.file.name}
                                            className="h-28 w-full object-cover"
                                        />
                                    </div>

                                    <div className="min-w-0">
                                        <div className="flex items-start gap-3">
                                            <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">{item.file.name}</p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {item.width} × {item.height} px
                                                </p>
                                                <p className="mt-2 text-xs text-muted-foreground">
                                                    PDF page {index + 1}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => moveImage(index, "up")}
                                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border transition hover:bg-muted"
                                            aria-label="Move up"
                                        >
                                            <ArrowUp className="h-4 w-4" />
                                        </button>

                                        <button
                                            onClick={() => moveImage(index, "down")}
                                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border transition hover:bg-muted"
                                            aria-label="Move down"
                                        >
                                            <ArrowDown className="h-4 w-4" />
                                        </button>

                                        <button
                                            onClick={() => removeImage(item.id)}
                                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border transition hover:bg-muted"
                                            aria-label="Remove image"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
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

async function getImageDimensions(
    src: string
): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () =>
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = reject;
        img.src = src;
    });
}

async function convertImageToPngBytes(file: File): Promise<Uint8Array> {
    const url = URL.createObjectURL(file);

    try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const el = new Image();
            el.onload = () => resolve(el);
            el.onerror = reject;
            el.src = url;
        });

        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context not available.");

        ctx.drawImage(img, 0, 0);

        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob((result) => resolve(result), "image/png")
        );

        if (!blob) throw new Error("Could not convert image.");

        return new Uint8Array(await blob.arrayBuffer());
    } finally {
        URL.revokeObjectURL(url);
    }
}