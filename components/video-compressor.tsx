"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { del, get, set } from "idb-keyval";
import JSZip from "jszip";
import {
    Download,
    FolderOpen,
    Loader2,
    Trash2,
    Upload,
    Video,
} from "lucide-react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

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
import {
    BULK_VIDEO_STORAGE_KEY,
    BULK_VIDEO_TTL_MS,
} from "@/lib/constants";
import {
    pickFolderVideosViaFSAccess,
    pickFolderVideosViaInput,
} from "@/lib/folder-video-utils";
import {
    formatBytes,
    formatDuration,
    getVideoDuration,
    replaceExt,
    sanitizeZipPath,
    type OutputFormat,
    type QueueItem,
    type StoredVideoEntry,
    type StoredVideoPayload,
} from "@/lib/video-utils";

type Preset = "ultrafast" | "fast" | "medium" | "slow";
type Resolution = "original" | "1080" | "720" | "480";
type FrameRate = "original" | "30" | "24";
type VideoCodec = "h264" | "h265";

export function VideoCompressor() {
    const singleInputRef = useRef<HTMLInputElement | null>(null);
    const folderInputRef = useRef<HTMLInputElement | null>(null);
    const ffmpegRef = useRef<FFmpeg | null>(null);
    const loadedRef = useRef(false);

    const [outputFormat, setOutputFormat] = useState<OutputFormat>("mp4");
    const [crf, setCrf] = useState(23);
    const [preset, setPreset] = useState<Preset>("slow");
    const [resolution, setResolution] = useState<Resolution>("original");
    const [audioBitrate, setAudioBitrate] = useState(128);
    const [removeAudio, setRemoveAudio] = useState(false);
    const [items, setItems] = useState<QueueItem[]>([]);
    const [running, setRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(true);
    const [ffmpegReady, setFfmpegReady] = useState(false);
    const [ffmpegLoading, setFfmpegLoading] = useState(false);

    const [frameRate, setFrameRate] = useState<FrameRate>("original");
    const [videoCodec, setVideoCodec] = useState<VideoCodec>("h265");

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
                const stored = await get<StoredVideoPayload>(BULK_VIDEO_STORAGE_KEY);

                if (!mounted) return;

                if (
                    stored?.createdAt &&
                    Date.now() - stored.createdAt > BULK_VIDEO_TTL_MS
                ) {
                    await del(BULK_VIDEO_STORAGE_KEY);
                    return;
                }

                if (stored?.entries?.length) {
                    const nextItems = await Promise.all(
                        stored.entries.map(async (entry) => ({
                            id: crypto.randomUUID(),
                            file: entry.file,
                            relativePath: entry.relativePath,
                            status: "pending" as const,
                            originalSize: entry.file.size,
                            durationSec: await getVideoDuration(entry.file).catch(() => undefined),
                        }))
                    );
                    setItems(nextItems);
                }
            } catch (error) {
                console.error(error);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        void loadEntries();

        return () => {
            mounted = false;
        };
    }, []);

    async function ensureFfmpeg() {
        if (loadedRef.current && ffmpegRef.current) return ffmpegRef.current;

        setFfmpegLoading(true);

        try {
            const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
            const ffmpeg = new FFmpeg();

            ffmpeg.on("log", ({ message }) => {
                console.debug("[ffmpeg]", message);
            });

            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
                wasmURL: await toBlobURL(
                    `${baseURL}/ffmpeg-core.wasm`,
                    "application/wasm"
                ),
            });

            ffmpegRef.current = ffmpeg;
            loadedRef.current = true;
            setFfmpegReady(true);
            return ffmpeg;
        } finally {
            setFfmpegLoading(false);
        }
    }

    const persistEntries = async (nextItems: QueueItem[]) => {
        const entries: StoredVideoEntry[] = nextItems.map((item) => ({
            file: item.file,
            relativePath: item.relativePath,
        }));

        const payload: StoredVideoPayload = {
            entries,
            createdAt: Date.now(),
        };

        await set(BULK_VIDEO_STORAGE_KEY, payload);
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

    const addFiles = async (entries: StoredVideoEntry[]) => {
        const withMeta = await Promise.all(
            entries.map(async (entry) => ({
                ...entry,
                durationSec: await getVideoDuration(entry.file).catch(() => undefined),
            }))
        );

        setItems((prev) => {
            const existingKeys = new Set(
                prev.map((item) => `${item.relativePath}::${item.originalSize}`)
            );

            const next: QueueItem[] = withMeta
                .filter(
                    (entry) => !existingKeys.has(`${entry.relativePath}::${entry.file.size}`)
                )
                .map((entry) => ({
                    id: crypto.randomUUID(),
                    file: entry.file,
                    relativePath: entry.relativePath,
                    status: "pending" as const,
                    originalSize: entry.file.size,
                    durationSec: entry.durationSec,
                }));

            const merged = [...prev, ...next];
            void persistEntries(merged);
            return merged;
        });
    };

    const onPickMultiple = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        const entries = Array.from(e.target.files)
            .filter((file) => file.type.startsWith("video/"))
            .map((file) => ({
                file,
                relativePath: file.name,
            }));

        await addFiles(entries);
        e.target.value = "";
    };

    const onPickFolderFallback = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        const entries = await pickFolderVideosViaInput(e.target.files);
        await addFiles(entries);
        e.target.value = "";
    };

    const onPickFolderFS = async () => {
        try {
            const entries = await pickFolderVideosViaFSAccess();
            if (!entries.length) return;
            await addFiles(entries);
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") return;
            console.error("Folder picker failed:", error);
        }
    };

    const buildArgs = (inputName: string, outputName: string): string[] => {
        const filters: string[] = [];

        if (resolution !== "original") {
            filters.push(`scale=${resolution}:-2`);
        }

        if (frameRate !== "original") {
            filters.push(`fps=${frameRate}`);
        }

        filters.push("format=yuv420p");

        const args = ["-i", inputName];

        if (filters.length) {
            args.push("-vf", filters.join(","));
        }

        args.push(
            "-c:v",
            "libx264",
            "-crf",
            String(crf),
            "-preset",
            preset
        );

        if (removeAudio) {
            args.push("-an");
        } else {
            args.push("-c:a", "aac", "-b:a", `${audioBitrate}k`);
        }

        args.push("-movflags", "+faststart", "-y", outputName);

        return args;
    };

    const compressAll = async () => {
        const pending = items.filter(
            (item) => item.status === "pending" || item.status === "error"
        );

        if (!pending.length) return;

        setRunning(true);
        setProgress(0);

        try {
            const ffmpeg = await ensureFfmpeg();
            let processed = 0;

            for (const item of pending) {
                setItems((prev) =>
                    prev.map((row) =>
                        row.id === item.id
                            ? { ...row, status: "processing", error: undefined }
                            : row
                    )
                );

                const inputName = `${item.id}-${item.file.name}`;
                const outputExt = outputFormat === "mp4" ? "mp4" : "webm";
                const outputName = `${item.id}-compressed.${outputExt}`;

                try {
                    await ffmpeg.writeFile(inputName, await fetchFile(item.file));

                    const args = buildArgs(inputName, outputName);
                    console.log("FFmpeg args:", args);
                    console.log("Input:", inputName);
                    console.log("Output:", outputName);

                    await ffmpeg.exec(args);

                    const data = await ffmpeg.readFile(outputName);
                    const mimeType =
                        outputFormat === "mp4" ? "video/mp4" : "video/webm";
                    const encodedBlob = new Blob([data], { type: mimeType });

                    console.log("Original size:", item.file.size);
                    console.log("Encoded size:", encodedBlob.size);

                    const useCompressed =
                        encodedBlob.size > 0 && encodedBlob.size < item.file.size;

                    const finalBlob = useCompressed ? encodedBlob : item.file;
                    const finalOutputName = useCompressed
                        ? replaceExt(item.file.name, outputExt)
                        : item.file.name;
                    const finalOutputRelativePath = useCompressed
                        ? replaceExt(item.relativePath, outputExt)
                        : item.relativePath;

                    setItems((prev) =>
                        prev.map((row) =>
                            row.id === item.id
                                ? {
                                    ...row,
                                    status: "done",
                                    outputSize: finalBlob.size,
                                    outputName: finalOutputName,
                                    outputRelativePath: finalOutputRelativePath,
                                    blob: finalBlob,
                                    error: useCompressed
                                        ? undefined
                                        : "Compressed output was not smaller, kept original file.",
                                }
                                : row
                        )
                    );
                } catch (error) {
                    console.error("Compression failed:", error);

                    setItems((prev) =>
                        prev.map((row) =>
                            row.id === item.id
                                ? {
                                    ...row,
                                    status: "error",
                                    error:
                                        error instanceof Error
                                            ? error.message
                                            : "Video compression failed",
                                }
                                : row
                        )
                    );
                } finally {
                    try {
                        await ffmpeg.deleteFile(inputName);
                    } catch { }
                    try {
                        await ffmpeg.deleteFile(outputName);
                    } catch { }
                }

                processed += 1;
                setProgress(Math.round((processed / pending.length) * 100));
            }
        } catch (error) {
            console.error(error);
            alert("Could not initialize the video compressor.");
        } finally {
            setRunning(false);
        }
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
        a.download = "compressed-videos.zip";
        a.click();
        URL.revokeObjectURL(url);

        await del(BULK_VIDEO_STORAGE_KEY);
    };

    const resetAll = async () => {
        setItems([]);
        setRunning(false);
        setProgress(0);
        await del(BULK_VIDEO_STORAGE_KEY);
    };

    if (loading) {
        return <div className="text-sm text-muted-foreground">Loading editor...</div>;
    }

    return (
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
            <Card className="border-border/60 bg-card/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80">
                <CardHeader className="space-y-4 pb-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <CardTitle className="text-base font-semibold tracking-tight">
                                Compression controls
                            </CardTitle>
                            <CardDescription className="text-sm leading-relaxed">
                                Add videos, choose a quality profile, and export compressed files as a ZIP.
                            </CardDescription>
                        </div>

                        <Badge
                            variant={ffmpegReady ? "default" : "secondary"}
                            className="rounded-full px-3 py-1"
                        >
                            {ffmpegLoading ? "Loading engine" : ffmpegReady ? "Engine ready" : "Engine idle"}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setCrf(22);
                                setPreset("medium");
                                setResolution("original");
                                setAudioBitrate(128);
                                setRemoveAudio(false);
                                resetProcessedState();
                            }}
                            className="rounded-xl border bg-background px-3 py-3 text-left transition-colors hover:bg-muted/50"
                        >
                            <p className="text-sm font-medium">High quality</p>
                            <p className="mt-1 text-xs text-muted-foreground">Best visual quality</p>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setCrf(25);
                                setPreset("medium");
                                setResolution("1080");
                                setAudioBitrate(96);
                                setRemoveAudio(false);
                                resetProcessedState();
                            }}
                            className="rounded-xl border bg-background px-3 py-3 text-left transition-colors hover:bg-muted/50"
                        >
                            <p className="text-sm font-medium">Balanced</p>
                            <p className="mt-1 text-xs text-muted-foreground">Good size and quality</p>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setCrf(30);
                                setPreset("fast");
                                setResolution("720");
                                setAudioBitrate(64);
                                setRemoveAudio(false);
                                resetProcessedState();
                            }}
                            className="rounded-xl border bg-background px-3 py-3 text-left transition-colors hover:bg-muted/50"
                        >
                            <p className="text-sm font-medium">Smaller size</p>
                            <p className="mt-1 text-xs text-muted-foreground">Aggressive compression</p>
                        </button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="grid gap-4">
                        <div className="rounded-2xl border bg-muted/20 p-4">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-sm font-semibold">Video</h3>
                                <span className="text-xs text-muted-foreground">Main encoding settings</span>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Quality (CRF): {crf}</Label>
                                    <Slider
                                        value={[crf]}
                                        min={18}
                                        max={36}
                                        step={1}
                                        onValueChange={(value) => {
                                            setCrf(value[0] ?? 23);
                                            resetProcessedState();
                                        }}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Lower CRF keeps better quality but produces larger files.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="preset">Preset</Label>
                                        <select
                                            id="preset"
                                            value={preset}
                                            onChange={(e) => {
                                                setPreset(e.target.value as Preset);
                                                resetProcessedState();
                                            }}
                                            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                                        >
                                            <option value="ultrafast">Ultrafast</option>
                                            <option value="fast">Fast</option>
                                            <option value="medium">Medium</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="resolution">Max resolution</Label>
                                        <select
                                            id="resolution"
                                            value={resolution}
                                            onChange={(e) => {
                                                setResolution(e.target.value as Resolution);
                                                resetProcessedState();
                                            }}
                                            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                                        >
                                            <option value="original">Original</option>
                                            <option value="1080">1080p</option>
                                            <option value="720">720p</option>
                                            <option value="480">480p</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="output-format">Output format</Label>
                                    <select
                                        id="output-format"
                                        value={outputFormat}
                                        onChange={(e) => {
                                            setOutputFormat(e.target.value as OutputFormat);
                                            resetProcessedState();
                                        }}
                                        className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="mp4">MP4</option>
                                        <option value="webm">WebM</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border bg-muted/20 p-4">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-sm font-semibold">Audio</h3>
                                <span className="text-xs text-muted-foreground">Optional audio optimization</span>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Audio bitrate: {audioBitrate} kbps</Label>
                                    <Slider
                                        value={[audioBitrate]}
                                        min={64}
                                        max={192}
                                        step={32}
                                        disabled={removeAudio}
                                        onValueChange={(value) => {
                                            setAudioBitrate(value[0] ?? 128);
                                            resetProcessedState();
                                        }}
                                    />
                                </div>

                                <label className="flex items-center justify-between rounded-xl border bg-background px-3 py-3 text-sm">
                                    <span>Remove audio track</span>
                                    <input
                                        type="checkbox"
                                        checked={removeAudio}
                                        onChange={(e) => {
                                            setRemoveAudio(e.target.checked);
                                            resetProcessedState();
                                        }}
                                        className="h-4 w-4"
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="rounded-2xl border bg-muted/20 p-4">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-sm font-semibold">Import</h3>
                                <span className="text-xs text-muted-foreground">Pick files or whole folders</span>
                            </div>

                            <div className="grid gap-3">
                                <Input
                                    ref={singleInputRef}
                                    type="file"
                                    multiple
                                    accept="video/*,.mp4,.mov,.avi,.mkv,.webm,.m4v,.3gp,.mpeg,.mpg"
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

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <Button
                                        onClick={() => singleInputRef.current?.click()}
                                        variant="secondary"
                                        className="h-11 justify-start rounded-xl"
                                    >
                                        <Upload className="mr-2 size-4" />
                                        Select videos
                                    </Button>

                                    <Button
                                        onClick={onPickFolderFS}
                                        variant="secondary"
                                        className="h-11 justify-start rounded-xl"
                                    >
                                        <FolderOpen className="mr-2 size-4" />
                                        Pick folder
                                    </Button>
                                </div>

                                <Button
                                    onClick={() => folderInputRef.current?.click()}
                                    variant="outline"
                                    className="h-11 justify-start rounded-xl"
                                >
                                    <FolderOpen className="mr-2 size-4" />
                                    Folder fallback input
                                </Button>
                            </div>
                        </div>

                        <div className="rounded-2xl border bg-card p-4 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-sm font-semibold">Actions</h3>
                                <span className="text-xs text-muted-foreground">
                                    {progress}% complete
                                </span>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    onClick={compressAll}
                                    disabled={!items.length || running}
                                    className="h-11 w-full rounded-xl"
                                >
                                    {running ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                                    Compress all
                                </Button>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <Button
                                        onClick={downloadZip}
                                        disabled={!items.some((item) => item.status === "done")}
                                        variant="secondary"
                                        className="h-11 rounded-xl"
                                    >
                                        <Download className="mr-2 size-4" />
                                        Download ZIP
                                    </Button>

                                    <Button
                                        onClick={resetAll}
                                        variant="destructive"
                                        className="h-11 rounded-xl"
                                    >
                                        <Trash2 className="mr-2 size-4" />
                                        Clear queue
                                    </Button>
                                </div>

                                <div className="space-y-2 pt-1">
                                    <Progress value={progress} className="h-2" />
                                    <p className="text-xs text-muted-foreground">
                                        Compression progress updates as each file finishes processing.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-2xl border bg-muted/20 p-4">
                                <p className="text-xs text-muted-foreground">Total files</p>
                                <p className="mt-1 text-lg font-semibold">{stats.total}</p>
                            </div>

                            <div className="rounded-2xl border bg-muted/20 p-4">
                                <p className="text-xs text-muted-foreground">Done</p>
                                <p className="mt-1 text-lg font-semibold">{stats.done}</p>
                            </div>

                            <div className="rounded-2xl border bg-muted/20 p-4">
                                <p className="text-xs text-muted-foreground">Errors</p>
                                <p className="mt-1 text-lg font-semibold">{stats.errors}</p>
                            </div>

                            <div className="rounded-2xl border bg-muted/20 p-4">
                                <p className="text-xs text-muted-foreground">Saved</p>
                                <p className="mt-1 text-lg font-semibold">{formatBytes(stats.saved)}</p>
                            </div>

                            <div className="rounded-2xl border bg-muted/20 p-4 col-span-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Original</span>
                                    <span className="font-medium">{formatBytes(stats.original)}</span>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Compressed</span>
                                    <span className="font-medium">{formatBytes(stats.compressed)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Queue</CardTitle>
                    <CardDescription>
                        Selected videos appear here before compression.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <ScrollArea className="h-[850px] pr-4">
                        <div className="space-y-3">
                            {items.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
                                    No videos added yet.
                                </div>
                            ) : null}

                            {items.map((item) => {
                                const saved =
                                    item.outputSize && item.outputSize < item.originalSize
                                        ? item.originalSize - item.outputSize
                                        : 0;

                                return (
                                    <div
                                        key={item.id}
                                        className={`group relative overflow-hidden rounded-2xl border bg-card/90 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${item.status === "done"
                                            ? "border-emerald-500/20"
                                            : item.status === "error"
                                                ? "border-red-500/20"
                                                : item.status === "processing"
                                                    ? "border-primary/30"
                                                    : "border-border"
                                            }`}
                                    >
                                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-muted/60 text-xs font-semibold shadow-sm">
                                                        <Video className="h-4 w-4" />
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={`inline-block h-2.5 w-2.5 rounded-full ${item.status === "done"
                                                                    ? "bg-emerald-500"
                                                                    : item.status === "error"
                                                                        ? "bg-red-500"
                                                                        : item.status === "processing"
                                                                            ? "bg-primary animate-pulse"
                                                                            : "bg-zinc-400"
                                                                    }`}
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
                                                            {item.durationSec ? (
                                                                <span>{formatDuration(item.durationSec)}</span>
                                                            ) : null}
                                                            {saved > 0 ? (
                                                                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-600 dark:text-emerald-400">
                                                                    Saved {formatBytes(saved)}
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
                                                    className="capitalize"
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
                                                    className="min-w-[96px] rounded-xl"
                                                >
                                                    Download
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}