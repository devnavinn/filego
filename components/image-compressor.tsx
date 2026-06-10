"use client";

import { useMemo, useRef, useState } from "react";
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
      })),
    );
    setProgress(0);
  };

  const addFiles = async (entries: { file: File; relativePath: string }[]) => {
    setItems((prev) => {
      const existingKeys = new Set(
        prev.map((item) => `${item.relativePath}::${item.originalSize}`),
      );

      const next: QueueItem[] = entries
        .filter(
          (entry) => !existingKeys.has(`${entry.relativePath}::${entry.file.size}`),
        )
        .map((entry) => ({
          id: crypto.randomUUID(),
          file: entry.file,
          relativePath: entry.relativePath,
          status: "pending" as const,
          originalSize: entry.file.size,
        }));

      return [...prev, ...next];
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
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      console.error("Folder picker failed:", error);
    }
  };

  const compressAll = async () => {
    const pending = items.filter(
      (item) => item.status === "pending" || item.status === "error",
    );

    if (!pending.length) return;

    setRunning(true);
    setProgress(0);

    let processed = 0;

    for (const item of pending) {
      setItems((prev) =>
        prev.map((row) =>
          row.id === item.id
            ? { ...row, status: "processing", error: undefined }
            : row,
        ),
      );

      const worker = new Worker(
        new URL("../workers/compress.worker.ts", import.meta.url),
        { type: "module" },
      );

      const result = await new Promise<WorkerResponse>((resolve) => {
        worker.onmessage = (event: MessageEvent<WorkerResponse>) =>
          resolve(event.data);

        worker.postMessage({
          id: item.id,
          file: item.file,
          relativePath: item.relativePath,
          quality,
          effort,
          outputFormat,
        });
      });

      worker.terminate();

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
              : row,
          ),
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
              : row,
          ),
        );
      }

      processed += 1;
      setProgress(Math.round((processed / pending.length) * 100));
    }

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

  const resetAll = () => {
    setItems([]);
    setRunning(false);
    setProgress(0);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Controls</CardTitle>
          <CardDescription>
            Compress and convert single images, batches, or folders locally with ZIP
            export.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Quality: {quality}</Label>
            <Slider
              value={[quality]}
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
              disabled={!showEffortControl}
              onValueChange={(value) => {
                setEffort(value[0] ?? 4);
                resetProcessedState();
              }}
            />
            <p className="text-xs text-muted-foreground">
              {showEffortControl
                ? "Higher effort can improve compression but takes more time."
                : "Effort is only used for modern codec outputs like WebP or AVIF."}
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="output-format">Output format</Label>
            <select
              id="output-format"
              value={outputFormat}
              onChange={(e) => {
                setOutputFormat(e.target.value as OutputFormat);
                resetProcessedState();
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="webp">WebP</option>
              <option value="avif">AVIF</option>
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
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
              variant="secondary"
              className="justify-start"
            >
              <ImagePlus className="mr-2 size-4" />
              Select single image
            </Button>

            <Button
              onClick={() => multiInputRef.current?.click()}
              variant="secondary"
              className="justify-start"
            >
              <Upload className="mr-2 size-4" />
              Select multiple images
            </Button>

            <Button
              onClick={onPickFolderFS}
              variant="secondary"
              className="justify-start"
            >
              <FolderOpen className="mr-2 size-4" />
              Pick folder (Chromium)
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
              disabled={!items.some((item) => item.status === "done")}
              variant="default"
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
            Files stay on the user device. Output format is selected by the user and
            ZIP is generated in-browser.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-[650px] pr-4">
            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
                  No files added yet.
                </div>
              ) : null}

              {items.map((item) => (
                <div key={item.id} className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.relativePath}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatBytes(item.originalSize)}
                        {item.outputSize ? ` → ${formatBytes(item.outputSize)}` : ""}
                      </p>
                      {item.error ? (
                        <p className="mt-1 text-xs text-red-500">{item.error}</p>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          item.status === "done"
                            ? "default"
                            : item.status === "error"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {item.status}
                      </Badge>

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!item.blob}
                        onClick={() => downloadOne(item)}
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
    </div>
  );
}