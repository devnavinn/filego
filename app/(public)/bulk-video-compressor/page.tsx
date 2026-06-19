import type { Metadata } from "next";
import { BulkVideoUploadEntry } from "@/components/bulk-video-upload-entry";

export const metadata: Metadata = {
    title: "Bulk Video Compressor",
    description:
        "Compress multiple videos locally in your browser with Filego. Fast bulk MP4 conversion with no server upload required.",
    alternates: {
        canonical: "/bulk-video-compress",
    },
};

export default function BulkVideoCompressPage() {
    return (
        <main className="min-h-screen bg-background">
            <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-16">
                <div className="mx-auto max-w-3xl text-center">
                    <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                        Bulk Video Compressor
                    </h1>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground md:text-base">
                        Compress multiple videos in your browser with a local, privacy-first workflow.
                        Add files or folders, tune output settings, and export everything in one ZIP.
                    </p>
                </div>

                <div className="mx-auto mt-10 max-w-3xl">
                    <BulkVideoUploadEntry />
                </div>
            </div>
        </main>
    );
}