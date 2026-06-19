"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { del, get, set } from "idb-keyval";
import JSZip from "jszip";
import {
  Download,
  FolderOpen,
  ImagePlus,
  Loader2,
  Trash2,
  Upload,
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
import {
  pickFolderImagesViaFSAccess,
  pickFolderImagesViaInput,
} from "@/lib/folder-utils";

type StoredEntry = {
  file: File;
  relativePath: string;
};

type OutputFormat = "webp" | "avif" | "jpeg" | "png";

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

export function ImageCompressor() {
  const singleInputRef = useRef<HTMLInputElement | null>(null);
  const multiInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const [outputFormat, setOutputFormat] = useState<OutputFormat>("webp");
  const [quality, setQuality] = useState(75);
  const [effort, setEffort] = useState(4);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  const showEffortControl = outputFormat === "webp" || outputFormat === "avif";

  const stats = useMemo(() => {
    const total = items.length;
    const done = items.filter((i) => i.status === "done").length;
    const errors = items.filter((i) => i.status === "error").length;
    const original = items.reduce((sum, i) => sum + i.originalSize, 0);
    const compressed = items.reduce((sum, i) => sum + (i.outputSize ?? 0), 0);

    return {
      total,
      done,
      errors,
      original,
      compressed,
      saved: Math.max(0, original - compressed),
    };
  }, [items]);

  useEffect(() => {
    let mounted = true;

    async function loadEntries() {
      try {
        const storedEntries = await get<StoredEntry[]>("filego-bulk-image-entries");

        if (!mounted) return;

        if (storedEntries?.length) {
          setItems(
            storedEntries.map((entry) => ({
              id: crypto.randomUUID(),
              file: entry.file,
              relativePath: entry.relativePath,
              status: "pending" as const,
              originalSize: entry.file.size,
            }))
          );
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
  };

  const addFiles = async (entries: StoredEntry[]) => {
    setItems((prev) => {
      const existingKeys = new Set(
        prev.map((item) => `${item.relativePath}::${item.originalSize}`)
      );

      const next: QueueItem[] = entries
        .filter(
          (entry) => !existingKeys.has(`${entry.relativePath}::${entry.file.size}`)
        )
        .map((entry) => ({
          id: crypto.randomUUID(),
          file: entry.file,
          relativePath: entry.relativePath,
          status: "pending" as const,
          originalSize: entry.file.size,
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

  const createWorker = () =>
    new Worker(new URL("../workers/compress.worker.ts", import.meta.url), {
      type: "module",
    });

  const compressAll = async () => {
    const pending = items.filter(
      (item) => item.status === "pending" || item.status === "error"
    );

    if (!pending.length) return;

    setRunning(true);
    setProgress(0);

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
          });
        };

        processNext();
      });

    await Promise.all(workers.map(runWorker));
    workers.forEach((worker) => worker.terminate());

    setRunning(false);
  };


  const downloadOne = (item: QueueItem) => {
    if (!item.blob || !item.outputName) return;

    const url = URL.createObjectURL(item.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = item.outputName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadZip = async () => {
    const zip = new JSZip();

    items.forEach((item) => {
      if (item.blob && item.outputRelativePath) {
        zip.file(sanitizeZipPath(item.outputRelativePath), item.blob);
      }
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "compressed-images.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetAll = async () => {
    setItems([]);
    setRunning(false);
    setProgress(0);
    await del("filego-bulk-image-entries");
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading editor...</div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Controls</CardTitle>
          <CardDescription>
            Add more images or folders, tune compression, and export results as ZIP.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Quality: {quality}</Label>
            <Slider
              value={[quality]}
              disabled={!showEffortControl || !items.length || running}
              min={1}
              max={100}
              step={1}
              onValueChange={(value) => {
                setQuality(value[0] ?? 75);
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
              disabled={!showEffortControl || !items.length || running}
              onValueChange={(value) => {
                setEffort(value[0] ?? 4);
                resetProcessedState();
              }}
            />
            <p className="text-xs text-muted-foreground">
              {showEffortControl
                ? "Higher effort can improve compression but takes more time."
                : "Effort is only used for WebP or AVIF outputs."}
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="output-format">Output format</Label>
            <select
              id="output-format"
              value={outputFormat}
              disabled={!items.length || running}
              onChange={(e) => {
                setOutputFormat(e.target.value as OutputFormat);
                resetProcessedState();
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="webp">WebP</option>
              <option value="avif">AVIF</option>
              {/* <option value="jpeg">JPEG</option>
              <option value="png">PNG</option> */}
            </select>
          </div>

          <Separator />

          <div className="grid gap-3">
            <Input
              ref={singleInputRef}
              type="file"
              accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif,.svg"
              className="hidden"
              onChange={onPickSingle}
            />

            <Input
              ref={multiInputRef}
              type="file"
              multiple
              accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif,.svg"
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

            <Button
              onClick={() => singleInputRef.current?.click()}
              disabled={!items.length || running}
              variant="secondary"
              className="justify-start"
            >
              <ImagePlus className="mr-2 size-4" />
              Select single image
            </Button>

            <Button
              onClick={() => multiInputRef.current?.click()}
              disabled={!items.length || running}
              variant="secondary"
              className="justify-start"
            >
              <Upload className="mr-2 size-4" />
              Select multiple images
            </Button>

            <Button
              disabled={!items.length || running}
              onClick={onPickFolderFS}
              variant="secondary"
              className="justify-start"
            >
              <FolderOpen className="mr-2 size-4" />
              Pick folder
            </Button>

            <Button
              onClick={() => folderInputRef.current?.click()}
              variant="outline"
              className="justify-start"
            >
              <FolderOpen className="mr-2 size-4" />
              Folder fallback input
            </Button>
          </div>

          <Separator />

          <div className="grid gap-3">
            <Button onClick={compressAll} disabled={!items.length || running}>
              {running ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Compress all
            </Button>

            <Button
              onClick={downloadZip}
              disabled={!items.some((item) => item.status === "done") || !items.length || running}
            >
              <Download className="mr-2 size-4" />
              Download ZIP
            </Button>

            <Button onClick={resetAll} variant="destructive">
              <Trash2 className="mr-2 size-4" />
              Clear queue
            </Button>
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Total files</span>
              <Badge variant="secondary">{stats.total}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Done</span>
              <Badge variant="secondary">{stats.done}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Errors</span>
              <Badge variant="secondary">{stats.errors}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Original</span>
              <span>{formatBytes(stats.original)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Compressed</span>
              <span>{formatBytes(stats.compressed)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Saved</span>
              <span>{formatBytes(stats.saved)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-xs text-muted-foreground">{progress}% complete</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Queue</CardTitle>
          <CardDescription>
            Selected images and folders appear here before compression.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-[850px] pr-4">
            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
                  No files added yet.
                </div>
              ) : null}

              {items.map((item) => (
                <div
                  key={item.id}
                  className={[
                    "group relative overflow-hidden rounded-2xl border bg-card/90 p-4 shadow-sm transition-all duration-300",
                    "hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/20",
                    "supports-[backdrop-filter]:bg-card/80 supports-[backdrop-filter]:backdrop-blur-sm",
                    item.status === "done" && "border-emerald-500/20",
                    item.status === "error" && "border-red-500/20",
                    item.status === "processing" && "border-primary/30 shadow-primary/5",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div
                    className={[
                      "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent",
                      item.status === "processing" ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                      "transition-opacity duration-300",
                    ].join(" ")}
                  />

                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/[0.04] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-white/[0.03]" />

                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-muted/60 text-xs font-semibold shadow-sm">
                          {item.status === "done" ? "✓" : item.status === "error" ? "!" : item.status === "processing" ? "…" : "IMG"}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={[
                                "inline-block h-2.5 w-2.5 rounded-full",
                                item.status === "done" && "bg-emerald-500",
                                item.status === "error" && "bg-red-500",
                                item.status === "pending" && "bg-zinc-400",
                                item.status === "processing" && "bg-primary animate-pulse",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            />
                            <p className="truncate text-sm font-semibold tracking-tight">
                              {item.relativePath}
                            </p>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span>{formatBytes(item.originalSize)}</span>
                            {item.outputSize ? (
                              <>
                                <span>→</span>
                                <span className="font-medium text-foreground/80">
                                  {formatBytes(item.outputSize)}
                                </span>
                              </>
                            ) : null}

                            {item.outputSize && item.outputSize < item.originalSize ? (
                              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-600 dark:text-emerald-400">
                                Saved {formatBytes(item.originalSize - item.outputSize)}
                              </span>
                            ) : null}
                          </div>

                          {item.error ? (
                            <p className="mt-2 text-xs font-medium text-red-500">
                              {item.error}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        className={[
                          "capitalize transition-colors",
                          item.status === "done" && "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400",
                          item.status === "error" && "bg-red-500/10 text-red-600 hover:bg-red-500/10 dark:text-red-400",
                          item.status === "processing" && "bg-primary/10 text-primary hover:bg-primary/10",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        variant="secondary"
                      >
                        {item.status}
                      </Badge>

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!item.blob}
                        onClick={() => downloadOne(item)}
                        className="min-w-[96px] rounded-xl transition-all duration-300 group-hover:border-primary/30 group-hover:bg-primary/5"
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div >
  );
}