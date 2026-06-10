"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Download, ImagePlus, Minus, Plus, RotateCcw, X } from "lucide-react";

type OutputFormat = "webp" | "avif" | "jpeg" | "png";

type WorkerInput = {
  id: string;
  file: File;
  relativePath: string;
  quality: number;
  effort: number;
  outputFormat: OutputFormat;
  resizeEnabled: boolean;
  width?: number;
  height?: number;
};

type WorkerOutput =
  | {
      id: string;
      status: "done";
      originalName: string;
      outputName: string;
      relativePath: string;
      originalSize: number;
      outputSize: number;
      blob: Blob;
      width: number;
      height: number;
    }
  | {
      id: string;
      status: "error";
      error: string;
    };

export function ImageSquooshEditor() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const compareRef = useRef<HTMLDivElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [outputName, setOutputName] = useState<string>("");

  const [format, setFormat] = useState<OutputFormat>("webp");
  const [quality, setQuality] = useState(75);
  const [effort, setEffort] = useState(4);

  const [resizeEnabled, setResizeEnabled] = useState(false);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");

  const [zoom, setZoom] = useState(100);
  const [split, setSplit] = useState(50);
  const [dragging, setDragging] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [outputSize, setOutputSize] = useState<number>(0);
  const [outputWidth, setOutputWidth] = useState<number>(0);
  const [outputHeight, setOutputHeight] = useState<number>(0);

  const originalSize = file?.size ?? 0;

  const savings = useMemo(() => {
    if (!originalSize || !outputSize || outputSize >= originalSize) return 0;
    return Math.round(((originalSize - outputSize) / originalSize) * 100);
  }, [originalSize, outputSize]);

  function formatBytes(bytes: number) {
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  const revokeUrl = (url: string | null) => {
    if (url) URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/image-codec.worker.ts", import.meta.url),
      { type: "module" },
    );

    worker.onmessage = (event: MessageEvent<WorkerOutput>) => {
      const message = event.data;

      if (message.id !== String(requestIdRef.current)) return;

      if (message.status === "error") {
        setLoading(false);
        setError(message.error);
        return;
      }

      setLoading(false);
      setError("");
      setOutputSize(message.outputSize);
      setOutputWidth(message.width);
      setOutputHeight(message.height);
      setOutputName(message.outputName);
      setResultBlob(message.blob);

      const nextUrl = URL.createObjectURL(message.blob);
      setResultUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return nextUrl;
      });
    };

    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const processImage = useCallback(() => {
    if (!file || !workerRef.current) return;

    const id = String(++requestIdRef.current);
    setLoading(true);
    setError("");

    const payload: WorkerInput = {
      id,
      file,
      relativePath: file.name,
      quality,
      effort,
      outputFormat: format,
      resizeEnabled,
      width: width ? Number(width) : undefined,
      height: height ? Number(height) : undefined,
    };

    workerRef.current.postMessage(payload);
  }, [effort, file, format, height, quality, resizeEnabled, width]);

  useEffect(() => {
    if (!file) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      processImage();
    }, 180);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [file, processImage]);

  const openPicker = () => inputRef.current?.click();

  const handleFile = (nextFile: File) => {
    revokeUrl(originalUrl);
    revokeUrl(resultUrl);

    const nextOriginalUrl = URL.createObjectURL(nextFile);
    setFile(nextFile);
    setOriginalUrl(nextOriginalUrl);
    setResultUrl(null);
    setResultBlob(null);
    setOutputSize(0);
    setOutputWidth(0);
    setOutputHeight(0);
    setOutputName("");
    setError("");
    setSplit(50);
    setZoom(100);
  };

  const resetAll = () => {
    revokeUrl(originalUrl);
    revokeUrl(resultUrl);
    setFile(null);
    setOriginalUrl(null);
    setResultUrl(null);
    setResultBlob(null);
    setOutputName("");
    setOutputSize(0);
    setOutputWidth(0);
    setOutputHeight(0);
    setError("");
    setZoom(100);
    setSplit(50);
    setLoading(false);
  };

  const updateSplitFromClientX = useCallback((clientX: number) => {
    const el = compareRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const percent = ((clientX - rect.left) / rect.width) * 100;
    setSplit(Math.max(0, Math.min(100, percent)));
  }, []);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      updateSplitFromClientX(e.clientX);
    };

    const onPointerUp = () => setDragging(false);

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [dragging, updateSplitFromClientX]);

  useEffect(() => {
    return () => {
      revokeUrl(originalUrl);
      revokeUrl(resultUrl);
    };
  }, [originalUrl, resultUrl]);

  const downloadResult = () => {
    if (!resultBlob || !resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = outputName || "optimized-image";
    a.click();
  };

  return (
    <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
      {!file || !originalUrl ? (
        <section className="relative min-h-[720px] overflow-hidden bg-[#f7f7f7] text-slate-900">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:22px_22px]" />

          <div className="relative z-10 flex min-h-[720px] flex-col items-center justify-center px-6 py-16 text-center">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex rounded-full border border-black/10 bg-white/70 px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-600">
                One image at a time
              </div>
              <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
                Tune one image like Squoosh
              </h2>
              <p className="mt-4 text-base text-slate-600 md:text-lg">
                Upload one image, compare before and after, change quality and
                effort, and download the result locally.
              </p>
            </div>

            <button
              onClick={openPicker}
              className="relative mt-14 flex h-[280px] w-[280px] flex-col items-center justify-center rounded-full bg-pink-500 text-white shadow-[0_28px_80px_rgba(236,72,153,0.35)] transition hover:scale-[1.01]"
            >
              <div className="rounded-2xl bg-white/10 p-4">
                <ImagePlus className="h-10 w-10" />
              </div>
              <span className="mt-4 text-lg font-semibold">Upload image</span>
              <span className="mt-1 text-sm text-white/85">
                JPG, PNG, WebP, AVIF
              </span>
            </button>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const next = e.target.files?.[0];
                if (!next) return;
                handleFile(next);
              }}
            />
          </div>
        </section>
      ) : (
        <section className="flex min-h-[760px] flex-col bg-[#2d2d2d] text-white xl:flex-row">
          <aside className="hidden w-[230px] flex-col justify-between border-r border-white/10 bg-[#262626] p-4 xl:flex">
            <div>
              <button
                onClick={resetAll}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-600 transition hover:bg-pink-500"
                aria-label="Remove image"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-2xl bg-black p-4">
              <h3 className="text-lg font-semibold">Image</h3>
              <div className="mt-4 rounded-xl bg-[#1b1b1b] p-3 text-sm text-zinc-300 break-all">
                {file.name}
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-[#1b1b1b] p-3">
                <button
                  onClick={downloadResult}
                  disabled={!resultBlob}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-black transition hover:bg-zinc-800 disabled:opacity-40"
                  aria-label="Download optimized image"
                >
                  <Download className="h-5 w-5" />
                </button>

                <div className="text-right">
                  <div className="text-sm text-zinc-400">
                    {formatBytes(originalSize)}
                  </div>
                  <div className="text-3xl font-bold">
                    {outputSize ? `${savings}%` : "--"}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="relative flex min-w-0 flex-1 flex-col items-center justify-center overflow-hidden p-4">
            <div
              ref={compareRef}
              className="relative h-[560px] w-full max-w-5xl overflow-hidden rounded-2xl bg-[#efefef] touch-none"
              style={{ touchAction: "none" }}
              onPointerDown={(e) => {
                setDragging(true);
                updateSplitFromClientX(e.clientX);
              }}
            >
              <div className="absolute inset-0 grid place-items-center p-6">
                <div
                  className="relative h-full w-full"
                  style={{
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={resultUrl || originalUrl}
                    alt="Optimized preview"
                    draggable={false}
                    className="pointer-events-none absolute left-1/2 top-1/2 max-h-full max-w-full select-none object-contain"
                    style={{
                      transform: `translate(-50%, -50%) scale(${zoom / 100})`,
                      transformOrigin: "center center",
                    }}
                  />

                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{
                      clipPath: `inset(0 ${100 - split}% 0 0)`,
                    }}
                  >
                    <img
                      src={originalUrl}
                      alt="Original preview"
                      draggable={false}
                      className="pointer-events-none absolute left-1/2 top-1/2 max-h-full max-w-full select-none object-contain"
                      style={{
                        transform: `translate(-50%, -50%) scale(${zoom / 100})`,
                        transformOrigin: "center center",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div
                className="absolute inset-y-0 z-20 w-[2px] bg-black/30 shadow-[0_0_0_1px_rgba(255,255,255,0.2)]"
                style={{ left: `${split}%`, transform: "translateX(-50%)" }}
              />

              <button
                type="button"
                aria-label="Drag compare slider"
                className="absolute top-1/2 z-30 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black text-white shadow-xl"
                style={{ left: `${split}%` }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setDragging(true);
                  updateSplitFromClientX(e.clientX);
                }}
              >
                <div className="flex items-center gap-1">
                  <span className="h-0 w-0 border-y-[8px] border-y-transparent border-r-[10px] border-r-pink-500" />
                  <span className="h-0 w-0 border-y-[8px] border-y-transparent border-l-[10px] border-l-sky-400" />
                </div>
              </button>

              <div className="absolute left-4 top-4 z-20 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">
                Original
              </div>

              <div className="absolute right-4 top-4 z-20 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">
                Optimized
              </div>
            </div>

            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-xl bg-[#1f1f1f] p-2 shadow-2xl">
              <button
                onClick={() => setZoom((z) => Math.max(25, z - 10))}
                className="rounded-lg p-2 hover:bg-white/10"
                aria-label="Zoom out"
              >
                <Minus className="h-4 w-4" />
              </button>

              <div className="min-w-[72px] text-center text-sm font-semibold">
                {zoom}%
              </div>

              <button
                onClick={() => setZoom((z) => Math.min(300, z + 10))}
                className="rounded-lg p-2 hover:bg-white/10"
                aria-label="Zoom in"
              >
                <Plus className="h-4 w-4" />
              </button>

              <div className="mx-1 h-6 w-px bg-white/10" />

              <button
                onClick={() => setZoom(100)}
                className="rounded-lg p-2 hover:bg-white/10"
                aria-label="Reset zoom"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
          <aside className="w-full border-t border-white/10 bg-[#2b2b2b] p-4 xl:w-[340px] xl:border-l xl:border-t-0">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1f1f1f]">
              <div className="bg-sky-400 px-4 py-3 text-lg font-bold text-black">
                Controls
              </div>

              <div className="space-y-5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-200">Resize</span>
                  <button
                    onClick={() => setResizeEnabled((v) => !v)}
                    className={`relative h-7 w-14 rounded-full transition ${
                      resizeEnabled ? "bg-sky-400" : "bg-zinc-700"
                    }`}
                    aria-label="Toggle resize"
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                        resizeEnabled ? "left-8" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                {resizeEnabled ? (
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      placeholder="Width"
                      className="rounded-lg border border-white/10 bg-[#2a2a2a] px-3 py-3 text-sm outline-none"
                    />
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="Height"
                      className="rounded-lg border border-white/10 bg-[#2a2a2a] px-3 py-3 text-sm outline-none"
                    />
                  </div>
                ) : null}

                <div className="border-t border-white/10 pt-5">
                  <h3 className="bg-sky-400 px-3 py-2 text-lg font-semibold text-black">
                    Compression
                  </h3>

                  <div className="mt-4">
                    <label className="mb-2 block text-sm text-zinc-300">
                      Format
                    </label>
                    <select
                      value={format}
                      onChange={(e) =>
                        setFormat(e.target.value as OutputFormat)
                      }
                      className="w-full rounded-lg border border-white/10 bg-[#2a2a2a] px-3 py-3 text-sm outline-none"
                    >
                      <option value="webp">WebP</option>
                      <option value="avif">AVIF</option>
                      <option value="jpeg">JPEG</option>
                      <option value="png">PNG</option>
                    </select>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-sm text-zinc-200">
                      <span>Quality</span>
                      <span>{quality}</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={100}
                      value={quality}
                      onChange={(e) => setQuality(Number(e.target.value))}
                      className="w-full accent-sky-400"
                      disabled={format === "png"}
                    />
                  </div>

                  {format === "webp" || format === "avif" ? (
                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between text-sm text-zinc-200">
                        <span>Effort</span>
                        <span>{effort}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={6}
                        value={effort}
                        onChange={(e) => setEffort(Number(e.target.value))}
                        className="w-full accent-sky-400"
                      />
                    </div>
                  ) : null}

                  {error ? (
                    <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                      {error}
                    </div>
                  ) : null}

                  <div className="mt-6 rounded-xl border border-white/10 bg-[#262626] p-3 text-sm text-zinc-300">
                    <div className="flex justify-between">
                      <span>Status</span>
                      <span>
                        {loading
                          ? "Updating..."
                          : outputSize
                            ? "Ready"
                            : "Waiting"}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between">
                      <span>Original</span>
                      <span>{formatBytes(originalSize)}</span>
                    </div>
                    <div className="mt-2 flex justify-between">
                      <span>Optimized</span>
                      <span>
                        {outputSize
                          ? formatBytes(outputSize)
                          : "Calculating..."}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between">
                      <span>Resolution</span>
                      <span>
                        {outputWidth && outputHeight
                          ? `${outputWidth}×${outputHeight}`
                          : "--"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-3">
                    <div className="flex-1 rounded-xl bg-sky-400 px-4 py-4 text-black">
                      <div className="text-4xl font-bold leading-none">
                        {outputSize ? `${savings}%` : "--"}
                      </div>
                      <div className="mt-1 text-sm font-medium">
                        {outputSize ? formatBytes(outputSize) : "Processing..."}
                      </div>
                    </div>

                    <button
                      onClick={downloadResult}
                      disabled={!resultBlob}
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg transition hover:bg-sky-400 disabled:opacity-40"
                      aria-label="Download output"
                    >
                      <Download className="h-7 w-7" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </section>
      )}
    </div>
  );
}
