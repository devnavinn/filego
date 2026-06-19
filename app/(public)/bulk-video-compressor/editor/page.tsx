import type { Metadata } from "next";
import { VideoCompressor } from "@/components/video-compressor";

export const metadata: Metadata = {
    title: "Bulk Video Compressor Editor",
    description:
        "Compress and convert queued videos locally in your browser with adjustable quality, preset, and resolution controls.",
    alternates: {
        canonical: "/bulk-video-compress/editor",
    },
};

export default function BulkVideoCompressEditorPage() {
    return (
        <main className="min-h-screen bg-background">
            <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                        Bulk video editor
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground md:text-base">
                        Compress videos locally with reusable queue settings and ZIP export.
                    </p>
                </div>

                <VideoCompressor />
            </div>
        </main>
    );
}