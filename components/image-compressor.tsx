"use client";

import { useEffect, useMemo, useRef, useState, memo } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { del, get, set } from "idb-keyval";
import JSZip from "jszip";
import {
  Download,
  FolderOpen,
  ImagePlus,
  Loader2,
  ShieldCheck,
  Trash2,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Images,
  Settings2
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { formatBytes, sanitizeZipPath } from "@/lib/image-utils";
import { completeUsageJob, startUsageJob } from "@/lib/usage-client";
import {
  pickFolderImagesViaFSAccess,
  pickFolderImagesViaInput,
} from "@/lib/folder-utils";

type StoredEntry = {
  file: File;
  relativePath: string;
};

type OutputFormat = "keep" | "webp" | "avif" | "jpeg" | "png";

type CompressionPreset =
  | "maximum"
  | "recommended"
  | "best-quality"
  | "custom";

type CompressionMode =
  | "best-compression"
  | "target-20"
  | "target-50"
  | "target-100"
  | "custom-size";

type QueueItem = {
  id: string;
  file: File;
  relativePath: string;
  status: "pending" | "processing" | "done" | "error";
  originalSize: number;
  outputSize?: number;
  outputName?: string;
  outputRelativePath?: string;
  blob?: Blob;
  error?: string;
  previewUrl?: string;
  width?: number;
  height?: number;
};

type WorkerDoneMessage = {
  id: string;
  status: "done";
  originalName: string;
  outputName: string;
  relativePath: string;
  originalSize: number;
  outputSize: number;
  blob: Blob;
};

type WorkerErrorMessage = {
  id: string;
  status: "error";
  error: string;
};

type WorkerResponse = WorkerDoneMessage | WorkerErrorMessage;


const QueueCard = memo(function QueueCard({
  item,
  running,
  onDownload,
  onRemove,
}: {
  item: QueueItem;
  running: boolean;
  onDownload: (item: QueueItem) => void;
  onRemove: (id: string) => void;
}) {
  const savedBytes = item.outputSize
    ? Math.max(0, item.originalSize - item.outputSize)
    : 0;

  const savedPercent =
    item.outputSize && item.originalSize > 0
      ? Math.max(
        0,
        Number(
          (
            ((item.originalSize - item.outputSize) / item.originalSize) *
            100
          ).toFixed(1)
        )
      )
      : 0;

  return (
    <div
      className={[
        "group overflow-hidden rounded-3xl border bg-card shadow-sm transition-all duration-300",
        "hover:-translate-y-0.5 hover:shadow-md",
        item.status === "done" && "border-emerald-500/20",
        item.status === "error" && "border-red-500/20",
        item.status === "processing" && "border-primary/30",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted/30">
        {item.previewUrl ? (
          <img
            src={item.previewUrl}
            alt={item.relativePath}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Images className="size-8" />
          </div>
        )}

        <div className="absolute left-3 top-3">
          <Badge
            className={[
              "capitalize",
              item.status === "done" &&
              "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400",
              item.status === "error" &&
              "bg-red-500/10 text-red-600 hover:bg-red-500/10 dark:text-red-400",
              item.status === "processing" &&
              "bg-primary/10 text-primary hover:bg-primary/10",
            ]
              .filter(Boolean)
              .join(" ")}
            variant="secondary"
          >
            {item.status === "done" ? (
              <CheckCircle2 className="mr-1 size-3.5" />
            ) : item.status === "error" ? (
              <AlertCircle className="mr-1 size-3.5" />
            ) : item.status === "processing" ? (
              <Loader2 className="mr-1 size-3.5 animate-spin" />
            ) : null}
            {item.status}
          </Badge>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="space-y-1">
          <p className="line-clamp-1 text-sm font-semibold">{item.file.name}</p>
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {item.relativePath}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-2.5 py-1">
            {formatBytes(item.originalSize)}
          </span>

          {item.width && item.height ? (
            <span className="rounded-full bg-muted px-2.5 py-1">
              {item.width} × {item.height}
            </span>
          ) : null}

          {item.outputSize ? (
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-700 dark:text-emerald-400">
              {formatBytes(item.outputSize)}
            </span>
          ) : null}
        </div>

        {item.outputSize ? (
          <div className="rounded-2xl border bg-muted/20 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Saved</span>
              <span className="font-medium">{formatBytes(savedBytes)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Reduction</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {savedPercent}%
              </span>
            </div>
          </div>
        ) : null}

        {item.error ? (
          <p className="text-xs font-medium text-red-500">{item.error}</p>
        ) : null}

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            disabled={!item.blob}
            onClick={() => onDownload(item)}
          >
            <Download className="mr-2 size-4" />
            Download
          </Button>

          <Button
            size="sm"
            variant="ghost"
            disabled={running}
            onClick={() => onRemove(item.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});


const PRESET_CONFIG: Record<
  Exclude<CompressionPreset, "custom">,
  { quality: number; effort: number; outputFormat: Exclude<OutputFormat, "keep"> }
> = {
  maximum: { quality: 45, effort: 6, outputFormat: "avif" },
  recommended: { quality: 75, effort: 4, outputFormat: "webp" },
  "best-quality": { quality: 88, effort: 4, outputFormat: "webp" },
};

const ACCEPTED_IMAGE_TYPES =
  "image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif,.svg";




function getTargetKB(mode: CompressionMode, customTargetKB: number) {
  switch (mode) {
    case "target-20":
      return 20;
    case "target-50":
      return 50;
    case "target-100":
      return 100;
    case "custom-size":
      return Math.max(1, customTargetKB);
    default:
      return null;
  }
}

function getOutputExtension(format: OutputFormat, file: File) {
  if (format === "keep") {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext) return ext;
    if (file.type.includes("png")) return "png";
    if (file.type.includes("jpeg")) return "jpg";
    if (file.type.includes("webp")) return "webp";
    if (file.type.includes("avif")) return "avif";
    return "img";
  }

  if (format === "jpeg") return "jpg";
  return format;
}

function replaceFileExtension(name: string, ext: string) {
  const dotIndex = name.lastIndexOf(".");
  const base = dotIndex >= 0 ? name.slice(0, dotIndex) : name;
  return `${base}.${ext}`;
}

function getCompressionHint(
  preset: CompressionPreset,
  mode: CompressionMode,
  format: OutputFormat
) {
  if (mode !== "best-compression") {
    return "Target-size mode may reduce quality more aggressively to hit your selected file size.";
  }

  if (preset === "maximum") {
    return "Smallest files with stronger quality reduction.";
  }

  if (preset === "best-quality") {
    return "Prioritizes visual quality with lighter compression.";
  }

  if (format === "avif") {
    return "AVIF usually gives the smallest files, but encoding can take longer.";
  }

  return "Balanced compression for smaller files with good visual quality.";
}

async function getImageMeta(
  file: File
): Promise<{ previewUrl?: string; width?: number; height?: number }> {
  if (typeof window === "undefined") {
    return { previewUrl: undefined, width: undefined, height: undefined };
  }

  const url = URL.createObjectURL(file);

  try {
    const img = new window.Image();

    const dimensions = await new Promise<{ width?: number; height?: number }>(
      (resolve) => {
        img.onload = () =>
          resolve({
            width: img.naturalWidth,
            height: img.naturalHeight,
          });

        img.onerror = () =>
          resolve({
            width: undefined,
            height: undefined,
          });

        img.src = url;
      }
    );

    return {
      previewUrl: url,
      width: dimensions.width,
      height: dimensions.height,
    };
  } catch {
    URL.revokeObjectURL(url);
    return { previewUrl: undefined, width: undefined, height: undefined };
  }
}

export function ImageCompressor() {
  const singleInputRef = useRef<HTMLInputElement | null>(null);
  const multiInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const dropzoneRef = useRef<HTMLDivElement | null>(null);
  const itemsRef = useRef<QueueItem[]>([]);

  const [preset, setPreset] = useState<CompressionPreset>("recommended");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("webp");
  const [quality, setQuality] = useState(75);
  const [effort, setEffort] = useState(4);

  const [compressionMode, setCompressionMode] =
    useState<CompressionMode>("best-compression");
  const [customTargetKB, setCustomTargetKB] = useState(150);

  const [items, setItems] = useState<QueueItem[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const showEffortControl =
    outputFormat === "webp" || outputFormat === "avif" || outputFormat === "keep";


  const targetKB = getTargetKB(compressionMode, customTargetKB);

  const stats = useMemo(() => {
    const total = items.length;
    const done = items.filter((i) => i.status === "done").length;
    const errors = items.filter((i) => i.status === "error").length;
    const processing = items.filter((i) => i.status === "processing").length;
    const original = items.reduce((sum, i) => sum + i.originalSize, 0);
    const compressed = items.reduce((sum, i) => sum + (i.outputSize ?? 0), 0);
    const saved = Math.max(0, original - compressed);
    const savingsPercent =
      original > 0 ? Number(((saved / original) * 100).toFixed(1)) : 0;

    return {
      total,
      done,
      errors,
      processing,
      original,
      compressed,
      saved,
      savingsPercent,
    };
  }, [items]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    let mounted = true;

    async function loadEntries() {
      try {
        const storedEntries = await get<StoredEntry[]>("filego-bulk-image-entries");

        if (!mounted) return;

        if (storedEntries?.length) {
          const nextItems = await Promise.all(
            storedEntries.map(async (entry) => {
              const meta = await getImageMeta(entry.file);

              return {
                id: crypto.randomUUID(),
                file: entry.file,
                relativePath: entry.relativePath,
                status: "pending" as const,
                originalSize: entry.file.size,
                previewUrl: meta.previewUrl,
                width: meta.width,
                height: meta.height,
              };
            })
          );

          setItems(nextItems);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadEntries();

    return () => {
      mounted = false;
      itemsRef.current.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  const persistEntries = async (nextItems: QueueItem[]) => {
    const entries: StoredEntry[] = nextItems.map((item) => ({
      file: item.file,
      relativePath: item.relativePath,
    }));
    await set("filego-bulk-image-entries", entries);
  };

  const resetProcessedState = () => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        status: "pending",
        outputSize: undefined,
        outputName: undefined,
        outputRelativePath: undefined,
        blob: undefined,
        error: undefined,
      }))
    );
    setProgress(0);
    setCurrentFileName(null);
  };

  const applyPreset = (nextPreset: CompressionPreset) => {
    setPreset(nextPreset);

    if (nextPreset === "custom") return;

    const config = PRESET_CONFIG[nextPreset];
    setQuality(config.quality);
    setEffort(config.effort);
    setOutputFormat(config.outputFormat);
    resetProcessedState();
  };

  const addFiles = async (entries: StoredEntry[]) => {
    const enrichedEntries = await Promise.all(
      entries.map(async (entry) => {
        const meta = await getImageMeta(entry.file);
        return {
          entry,
          meta,
        };
      })
    );

    setItems((prev) => {
      const existingKeys = new Set(
        prev.map((item) => `${item.relativePath}::${item.originalSize}`)
      );

      const next: QueueItem[] = enrichedEntries
        .filter(
          ({ entry }) =>
            !existingKeys.has(`${entry.relativePath}::${entry.file.size}`)
        )
        .map(({ entry, meta }) => ({
          id: crypto.randomUUID(),
          file: entry.file,
          relativePath: entry.relativePath,
          status: "pending" as const,
          originalSize: entry.file.size,
          previewUrl: meta.previewUrl,
          width: meta.width,
          height: meta.height,
        }));

      const merged = [...prev, ...next];
      void persistEntries(merged);
      return merged;
    });
  };

  const onPickSingle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    await addFiles([{ file, relativePath: file.name }]);
    e.target.value = "";
  };

  const onPickMultiple = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const entries = Array.from(e.target.files).map((file) => ({
      file,
      relativePath: file.name,
    }));

    await addFiles(entries);
    e.target.value = "";
  };

  const onPickFolderFallback = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const entries = await pickFolderImagesViaInput(e.target.files);
    await addFiles(entries);
    e.target.value = "";
  };

  const onPickFolderFS = async () => {
    try {
      const entries = await pickFolderImagesViaFSAccess();
      if (!entries.length) return;
      await addFiles(entries);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("Folder picker failed:", error);
    }
  };

  const onDropFiles = async (files: FileList | null) => {
    if (!files?.length) return;

    const entries = Array.from(files)
      .filter((file) => file.type.startsWith("image/") || /\.[a-zA-Z0-9]+$/.test(file.name))
      .map((file) => ({
        file,
        relativePath:
          (file as File & { webkitRelativePath?: string }).webkitRelativePath ||
          file.name,
      }));

    if (!entries.length) return;
    await addFiles(entries);
  };

  const createWorker = () =>
    new Worker(new URL("../workers/compress.worker.ts", import.meta.url), {
      type: "module",
    });

  const compressAll = async () => {
    const pending = items.filter(
      (item) => item.status === "pending" || item.status === "error"
    );

    if (!pending.length) return;

    const originalBytes = pending.reduce((sum, item) => sum + item.originalSize, 0);

    const usageJob = await startUsageJob({
      toolType: "BULK_IMAGE_COMPRESS",
      filesCount: pending.length,
      originalBytes,
      source: "web",
      metadata: {
        outputFormat,
        quality,
        effort,
        preset,
        compressionMode,
        targetKB,
      },
    });

    setRunning(true);
    setProgress(0);
    setCurrentFileName(null);

    const concurrency = Math.min(navigator.hardwareConcurrency || 4, 4);
    const workers = Array.from({ length: concurrency }, createWorker);

    let completed = 0;
    let nextIndex = 0;

    const runWorker = (worker: Worker) =>
      new Promise<void>((resolve) => {
        const processNext = () => {
          const item = pending[nextIndex++];
          if (!item) {
            resolve();
            return;
          }

          setCurrentFileName(item.relativePath);

          setItems((prev) =>
            prev.map((row) =>
              row.id === item.id
                ? { ...row, status: "processing", error: undefined }
                : row
            )
          );

          worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
            const result = event.data;

            if (result.status === "done") {
              setItems((prev) =>
                prev.map((row) =>
                  row.id === result.id
                    ? {
                      ...row,
                      status: "done",
                      outputSize: result.outputSize,
                      outputName: result.outputName,
                      outputRelativePath: result.relativePath,
                      blob: result.blob,
                    }
                    : row
                )
              );
            } else {
              setItems((prev) =>
                prev.map((row) =>
                  row.id === result.id
                    ? {
                      ...row,
                      status: "error",
                      error: result.error,
                    }
                    : row
                )
              );
            }

            completed += 1;
            setProgress(Math.round((completed / pending.length) * 100));
            processNext();
          };

          worker.postMessage({
            id: item.id,
            file: item.file,
            relativePath: item.relativePath,
            quality,
            effort,
            outputFormat,
            targetKB,
            compressionMode,
          });
        };

        processNext();
      });

    try {
      await Promise.all(workers.map(runWorker));
    } finally {
      workers.forEach((worker) => worker.terminate());
      setRunning(false);
      setCurrentFileName(null);
    }

    const finishedItems = itemsRef.current.filter((item) =>
      pending.some((p) => p.id === item.id)
    );

    const doneItems = finishedItems.filter((item) => item.status === "done");

    const outputBytes = doneItems.reduce(
      (sum, item) => sum + (item.outputSize ?? 0),
      0
    );
    const savedBytes = Math.max(0, originalBytes - outputBytes);
    const compressionRate =
      originalBytes > 0 ? Number(((savedBytes / originalBytes) * 100).toFixed(2)) : 0;

    if (usageJob?.jobId) {
      await completeUsageJob({
        jobId: usageJob.jobId,
        outputBytes,
        savedBytes,
        compressionRate,
        status: doneItems.length ? "COMPLETED" : "FAILED",
        metadata: {
          completedFiles: doneItems.length,
          failedFiles: pending.length - doneItems.length,
          outputFormat,
          quality,
          effort,
          preset,
          compressionMode,
          targetKB,
        },
      });
    }
  };

  const downloadOne = (item: QueueItem) => {
    if (!item.blob) return;

    const ext = getOutputExtension(outputFormat, item.file);
    const fileName =
      item.outputName || replaceFileExtension(item.file.name, ext);

    const url = URL.createObjectURL(item.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadZip = async () => {
    const zip = new JSZip();

    items.forEach((item) => {
      if (item.blob) {
        const ext = getOutputExtension(outputFormat, item.file);
        const outputPath =
          item.outputRelativePath ||
          replaceFileExtension(item.relativePath, ext);

        zip.file(sanitizeZipPath(outputPath), item.blob);
      }
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "compressed-images.zip";
    a.click();
    URL.revokeObjectURL(url);
    await del("filego-bulk-image-entries");
  };

  const removeOne = async (id: string) => {
    setItems((prev) => {
      const next = prev.filter((item) => {
        if (item.id === id && item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
        return item.id !== id;
      });

      void persistEntries(next);
      return next;
    });
  };

  const resetAll = async () => {
    items.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });

    setItems([]);
    setRunning(false);
    setProgress(0);
    setCurrentFileName(null);
    await del("filego-bulk-image-entries");
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading editor...</div>;
  }

  const settingsContent = (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Compression preset</Label>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["maximum", "Maximum Compression"],
              ["recommended", "Recommended"],
              ["best-quality", "Best Quality"],
              ["custom", "Custom"],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              variant={preset === value ? "default" : "outline"}
              className="justify-start rounded-xl"
              disabled={running}
              onClick={() => applyPreset(value)}
            >
              {preset === value ? <Sparkles className="mr-2 size-4" /> : null}
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Compression mode</Label>
        <div className="grid gap-2">
          {(
            [
              ["best-compression", "Best Compression"],
              ["target-20", "Compress to 20KB"],
              ["target-50", "Compress to 50KB"],
              ["target-100", "Compress to 100KB"],
              ["custom-size", "Custom Size"],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              variant={compressionMode === value ? "default" : "outline"}
              className="justify-start rounded-xl"
              disabled={running}
              onClick={() => {
                setCompressionMode(value);
                if (outputFormat === "keep" && value !== "best-compression") {
                  setOutputFormat("webp");
                }
                resetProcessedState();
              }}
            >
              {label}
            </Button>
          ))}
        </div>

        {compressionMode === "custom-size" ? (
          <div className="rounded-xl border bg-background p-3">
            <Label htmlFor="custom-target">Target size (KB)</Label>
            <Input
              id="custom-target"
              type="number"
              min={1}
              value={customTargetKB}
              disabled={running}
              onChange={(e) => {
                setCustomTargetKB(Number(e.target.value || 1));
                resetProcessedState();
              }}
              className="mt-2"
            />
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="output-format">Convert to</Label>
        <select
          id="output-format"
          value={outputFormat}
          disabled={running}
          onChange={(e) => {
            const nextValue = e.target.value as OutputFormat;
            setOutputFormat(nextValue);
            setPreset("custom");
            resetProcessedState();
          }}
          className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="keep" disabled={compressionMode !== "best-compression"}>
            Keep Original
          </option>
          <option value="webp">WebP (Recommended)</option>
          <option value="avif">AVIF (Smallest)</option>
          <option value="jpeg">JPG</option>
        </select>
      </div>

      <div className="space-y-3">
        <Label>Quality: {quality}</Label>
        <Slider
          value={[quality]}
          disabled={!items.length || running || preset !== "custom"}
          min={1}
          max={100}
          step={1}
          onValueChange={(value) => {
            setQuality(value[0] ?? 75);
            setPreset("custom");
            resetProcessedState();
          }}
        />
      </div>

      <div className="space-y-3">
        <Label className={!showEffortControl ? "text-muted-foreground" : ""}>
          Effort: {effort}
        </Label>
        <Slider
          value={[effort]}
          min={0}
          max={6}
          step={1}
          disabled={!showEffortControl || !items.length || running || preset !== "custom"}
          onValueChange={(value) => {
            setEffort(value[0] ?? 4);
            setPreset("custom");
            resetProcessedState();
          }}
        />
        <p className="text-xs text-muted-foreground">
          {getCompressionHint(preset, compressionMode, outputFormat)}
        </p>
      </div>

      <Separator />

      <div className="grid gap-3">
        <Button
          onClick={() => folderInputRef.current?.click()}
          variant="outline"
          className="justify-start rounded-xl"
        >
          <FolderOpen className="mr-2 size-4" />
          Folder fallback input
        </Button>

        <Button onClick={resetAll} variant="destructive" className="rounded-xl">
          <Trash2 className="mr-2 size-4" />
          Clear queue
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className="space-y-6">
        <Card className="overflow-visible border-primary/10 bg-gradient-to-br from-background via-background to-muted/30">
          <CardContent className="p-0">
            <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="p-6 md:p-8">
                <div className="mb-6 space-y-3">
                  <Badge variant="secondary" className="w-fit">
                    Bulk image compressor
                  </Badge>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold tracking-tight">
                      Compress images faster with presets and target-size modes
                    </h2>
                    <p className="max-w-2xl text-sm text-muted-foreground">
                      Drop images or folders, compress them in bulk, convert formats, and export
                      everything as a ZIP.
                    </p>
                  </div>
                </div>

                {items.length === 0 ? (
                  <>
                    <div
                      ref={dropzoneRef}
                      role="button"
                      tabIndex={0}
                      aria-label="Upload images by dragging and dropping, or press Enter to select files"
                      onClick={() => multiInputRef.current?.click()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          multiInputRef.current?.click();
                        }
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragActive(true);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragActive(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.currentTarget === e.target) {
                          setDragActive(false);
                        }
                      }}
                      onDrop={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragActive(false);
                        await onDropFiles(e.dataTransfer.files);
                      }}
                      className={[
                        "rounded-3xl border border-dashed p-8 transition-all duration-300 outline-none",
                        dragActive
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border bg-card hover:border-primary/30 hover:bg-muted/30",
                        "focus-visible:ring-2 focus-visible:ring-primary/30",
                      ].join(" ")}
                    >
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Upload className="size-6" />
                        </div>
                        <h3 className="text-lg font-semibold">Drag and drop images here</h3>
                        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                          Upload single images, multiple files, or entire folders. You can also
                          click this area to choose files.
                        </p>

                        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              singleInputRef.current?.click();
                            }}
                            disabled={running}
                            variant="secondary"
                          >
                            <ImagePlus className="mr-2 size-4" />
                            Select single image
                          </Button>

                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              multiInputRef.current?.click();
                            }}
                            disabled={running}
                          >
                            <Upload className="mr-2 size-4" />
                            Select multiple images
                          </Button>

                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPickFolderFS();
                            }}
                            disabled={running}
                            variant="secondary"
                          >
                            <FolderOpen className="mr-2 size-4" />
                            Pick folder
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border bg-muted/30 p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="size-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Private by default</p>
                          <p className="text-xs text-muted-foreground">
                            Your images stay on your device during compression. Use drag and
                            drop, buttons, or folder import based on your browser support.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4 pb-24 md:pb-0">
                    <div className="flex flex-col gap-3 rounded-2xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {items.length} {items.length === 1 ? "image" : "images"} added
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Manage your queue below or add more files.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => singleInputRef.current?.click()}
                          disabled={running}
                          variant="secondary"
                          size="sm"
                        >
                          <ImagePlus className="mr-2 size-4" />
                          Add image
                        </Button>

                        <Button
                          onClick={() => multiInputRef.current?.click()}
                          disabled={running}
                          size="sm"
                        >
                          <Upload className="mr-2 size-4" />
                          Add more
                        </Button>

                        <Button
                          onClick={onPickFolderFS}
                          disabled={running}
                          variant="outline"
                          size="sm"
                        >
                          <FolderOpen className="mr-2 size-4" />
                          Add folder
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border bg-background p-3 lg:hidden">
                      <div>
                        <p className="text-sm font-medium">Compression settings</p>
                        <p className="text-xs text-muted-foreground">
                          Preset, format, quality, target size
                        </p>
                      </div>

                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="outline" size="sm" className="rounded-xl">
                            <Settings2 className="mr-2 size-4" />
                            Settings
                          </Button>
                        </SheetTrigger>

                        <SheetContent side="bottom" className="max-h-[85vh] rounded-t-3xl">
                          <SheetHeader className="text-left">
                            <SheetTitle>Compression settings</SheetTitle>
                            <SheetDescription>
                              Adjust compression options for mobile.
                            </SheetDescription>
                          </SheetHeader>

                          <div className="mt-6 overflow-y-auto px-4 pb-6">
                            {settingsContent}
                          </div>
                        </SheetContent>
                      </Sheet>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
                      {items.map((item) => (
                        <QueueCard
                          key={item.id}
                          item={item}
                          running={running}
                          onDownload={downloadOne}
                          onRemove={removeOne}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <Input
                  ref={singleInputRef}
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES}
                  className="hidden"
                  onChange={onPickSingle}
                />

                <Input
                  ref={multiInputRef}
                  type="file"
                  multiple
                  accept={ACCEPTED_IMAGE_TYPES}
                  className="hidden"
                  onChange={onPickMultiple}
                />

                <Input
                  ref={folderInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={onPickFolderFallback}
                  {...({
                    webkitdirectory: "true",
                    directory: "true",
                  } as React.InputHTMLAttributes<HTMLInputElement>)}
                />
              </div>

              <div className="hidden border-t lg:block lg:border-l lg:border-t-0">
                <div className="lg:sticky lg:top-12 lg:self-start">
                  <div className="bg-muted/20 p-6 md:p-8 lg:h-fit">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label>Compression preset</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {(
                            [
                              ["maximum", "Maximum Compression"],
                              ["recommended", "Recommended"],
                              ["best-quality", "Best Quality"],
                              ["custom", "Custom"],
                            ] as const
                          ).map(([value, label]) => (
                            <Button
                              key={value}
                              type="button"
                              variant={preset === value ? "default" : "outline"}
                              className="justify-start"
                              disabled={running}
                              onClick={() => applyPreset(value)}
                            >
                              {preset === value ? (
                                <Sparkles className="mr-2 size-4" />
                              ) : null}
                              {label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Compression mode</Label>
                        <div className="grid gap-2">
                          {(
                            [
                              ["best-compression", "Best Compression"],
                              ["target-20", "Compress to 20KB"],
                              ["target-50", "Compress to 50KB"],
                              ["target-100", "Compress to 100KB"],
                              ["custom-size", "Custom Size"],
                            ] as const
                          ).map(([value, label]) => (
                            <Button
                              key={value}
                              type="button"
                              variant={compressionMode === value ? "default" : "outline"}
                              className="justify-start"
                              disabled={running}
                              onClick={() => {
                                setCompressionMode(value);
                                if (outputFormat === "keep" && value !== "best-compression") {
                                  setOutputFormat("webp");
                                }
                                resetProcessedState();
                              }}
                            >
                              {label}
                            </Button>
                          ))}
                        </div>

                        {compressionMode === "custom-size" ? (
                          <div className="rounded-xl border bg-background p-3">
                            <Label htmlFor="custom-target">Target size (KB)</Label>
                            <Input
                              id="custom-target"
                              type="number"
                              min={1}
                              value={customTargetKB}
                              disabled={running}
                              onChange={(e) => {
                                setCustomTargetKB(Number(e.target.value || 1));
                                resetProcessedState();
                              }}
                              className="mt-2"
                            />
                          </div>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="output-format">Convert to</Label>
                        <select
                          id="output-format"
                          value={outputFormat}
                          disabled={running}
                          onChange={(e) => {
                            const nextValue = e.target.value as OutputFormat;
                            setOutputFormat(nextValue);
                            setPreset("custom");
                            resetProcessedState();
                          }}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="keep" disabled={compressionMode !== "best-compression"}>
                            Keep Original
                          </option>
                          <option value="webp">WebP (Recommended)</option>
                          <option value="avif">AVIF (Smallest)</option>
                          <option value="jpeg">JPG</option>
                          {/* <option value="png">PNG</option> */}
                        </select>
                      </div>

                      <div className="space-y-3">
                        <Label>Quality: {quality}</Label>
                        <Slider
                          value={[quality]}
                          disabled={!items.length || running || preset !== "custom"}
                          min={1}
                          max={100}
                          step={1}
                          onValueChange={(value) => {
                            setQuality(value[0] ?? 75);
                            setPreset("custom");
                            resetProcessedState();
                          }}
                        />
                      </div>

                      <div className="space-y-3">
                        <Label
                          className={!showEffortControl ? "text-muted-foreground" : ""}
                        >
                          Effort: {effort}
                        </Label>
                        <Slider
                          value={[effort]}
                          min={0}
                          max={6}
                          step={1}
                          disabled={
                            !showEffortControl ||
                            !items.length ||
                            running ||
                            preset !== "custom"
                          }
                          onValueChange={(value) => {
                            setEffort(value[0] ?? 4);
                            setPreset("custom");
                            resetProcessedState();
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          {getCompressionHint(preset, compressionMode, outputFormat)}
                        </p>
                      </div>

                      <Separator />

                      <div className="grid gap-3">
                        <Button onClick={compressAll} disabled={!items.length || running}>
                          {running ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                          ) : null}
                          Compress all
                        </Button>

                        <Button
                          onClick={downloadZip}
                          disabled={
                            !items.some((item) => item.status === "done") ||
                            !items.length ||
                            running
                          }
                          variant="secondary"
                        >
                          <Download className="mr-2 size-4" />
                          Download ZIP
                        </Button>

                        <Button
                          onClick={() => folderInputRef.current?.click()}
                          variant="outline"
                          className="justify-start"
                        >
                          <FolderOpen className="mr-2 size-4" />
                          Folder fallback input
                        </Button>

                        <Button onClick={resetAll} variant="destructive">
                          <Trash2 className="mr-2 size-4" />
                          Clear queue
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Total files
                </p>
                <div className="flex items-center gap-2">
                  <Images className="size-4 text-primary" />
                  <p className="text-2xl font-semibold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Original size
                </p>
                <p className="text-2xl font-semibold">{formatBytes(stats.original)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Compressed size
                </p>
                <p className="text-2xl font-semibold">{formatBytes(stats.compressed)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/20">
            <CardContent className="p-5">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  You saved
                </p>
                <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatBytes(stats.saved)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.savingsPercent}% reduction
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle>Compression progress</CardTitle>
                <CardDescription>
                  Track processed files, live status, and final savings.
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{stats.done} done</Badge>
                <Badge variant="secondary">{stats.processing} processing</Badge>
                <Badge variant="secondary">{stats.errors} errors</Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-2xl border bg-muted/20 p-4">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{progress}% complete</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.done + stats.errors} of {stats.total} files finished
                  </p>
                </div>
                {running ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Processing
                  </div>
                ) : null}
              </div>

              <Progress value={progress} className="h-3" />

              <div className="mt-3 flex flex-col gap-2 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
                <span>
                  Current file:{" "}
                  <span className="font-medium text-foreground">
                    {currentFileName ?? "—"}
                  </span>
                </span>
                <span>
                  Saved so far:{" "}
                  <span className="font-medium text-foreground">
                    {formatBytes(stats.saved)}
                  </span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {items.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
          <div className="mx-auto max-w-md px-3 pb-2">
            <div className="rounded-2xl border bg-background/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <div className="flex items-center justify-between border-b px-3 py-2 text-[11px] text-muted-foreground">
                <span>{items.length} files</span>
                <span>{stats.done} ready</span>
              </div>

              <div className="grid grid-cols-2 gap-2 p-2">
                <Button
                  onClick={compressAll}
                  disabled={!items.length || running}
                  className="h-11 rounded-xl"
                  size="sm"
                >
                  {running ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  {running ? "Processing" : "Compress"}
                </Button>

                <Button
                  onClick={downloadZip}
                  disabled={
                    !items.some((item) => item.status === "done") ||
                    !items.length ||
                    running
                  }
                  variant="secondary"
                  className="h-11 rounded-xl"
                  size="sm"
                >
                  <Download className="mr-2 size-4" />
                  ZIP
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}