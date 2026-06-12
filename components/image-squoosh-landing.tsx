"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";

export function ImageSquooshLanding() {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const router = useRouter();

    const handleFile = (file: File) => {
        (window as typeof window & { __imageSquooshFile?: File }).__imageSquooshFile = file;
        router.push("/image-squoosh/editor");
    };

    return (
        <main className="bg-background text-foreground">
            <section className="border-b">
                <div className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
                    <div className="mx-auto max-w-3xl text-center">
                        <span className="inline-flex rounded-full border px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                            Private browser compression
                        </span>

                        <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-6xl">
                            Free image compressor without losing quality
                        </h1>

                        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
                            Compress JPG, PNG, WebP, and AVIF images locally in your browser.
                            Compare before and after, tune quality, resize dimensions, and
                            download instantly without uploading to a server.
                        </p>

                        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <button
                                onClick={() => inputRef.current?.click()}
                                className="inline-flex h-14 items-center justify-center rounded-full bg-pink-500 px-8 text-base font-semibold text-white shadow-lg transition hover:scale-[1.01]"
                            >
                                Choose image
                            </button>

                            <a
                                href="#features"
                                className="inline-flex h-14 items-center justify-center rounded-full border px-8 text-base font-medium"
                            >
                                See features
                            </a>
                        </div>

                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                handleFile(file);
                            }}
                        />

                        <div className="mt-8 text-sm text-muted-foreground">
                            Supports JPG, PNG, WebP, and AVIF
                        </div>
                    </div>
                </div>
            </section>

            <section id="features">
                <div className="container mx-auto max-w-6xl px-4 py-16">
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="rounded-2xl border bg-card p-6">
                            <h2 className="text-xl font-semibold">Live comparison</h2>
                            <p className="mt-3 text-sm text-muted-foreground">
                                Preview original and optimized versions side by side with a drag
                                slider before downloading.
                            </p>
                        </div>

                        <div className="rounded-2xl border bg-card p-6">
                            <h2 className="text-xl font-semibold">Resize and convert</h2>
                            <p className="mt-3 text-sm text-muted-foreground">
                                Adjust width and height, then export to WebP, AVIF, JPEG, or PNG
                                from one editor.
                            </p>
                        </div>

                        <div className="rounded-2xl border bg-card p-6">
                            <h2 className="text-xl font-semibold">Private processing</h2>
                            <p className="mt-3 text-sm text-muted-foreground">
                                Your image stays in the browser during compression, making the
                                workflow fast and privacy-friendly.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-y bg-muted/30">
                <div className="container mx-auto max-w-4xl px-4 py-16">
                    <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                        How this image compressor works
                    </h2>
                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                        <div className="rounded-2xl border bg-background p-5">
                            <h3 className="font-semibold">1. Choose an image</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Select a JPG, PNG, WebP, or AVIF file from your device.
                            </p>
                        </div>
                        <div className="rounded-2xl border bg-background p-5">
                            <h3 className="font-semibold">2. Adjust compression</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Tune quality, effort, and resize settings with instant preview.
                            </p>
                        </div>
                        <div className="rounded-2xl border bg-background p-5">
                            <h3 className="font-semibold">3. Download result</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Save the optimized file directly after checking size and quality.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="container mx-auto max-w-4xl px-4 py-16">
                <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                    Frequently asked questions
                </h2>

                <div className="mt-8 space-y-6">
                    <div>
                        <h3 className="font-semibold">
                            Can I compress images without uploading them?
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Yes. This tool is designed for local browser-based processing, so
                            you can optimize images privately on your device.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold">
                            Which image formats are supported?
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            You can work with JPG, PNG, WebP, and AVIF, and choose the output
                            format inside the editor.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold">
                            Will image quality be affected?
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Compression always balances file size and visual quality, which is
                            why the live comparison slider helps you choose the right settings.
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}