import type { Metadata } from "next";
import { ImageCompressor } from "@/components/image-compressor";

export const metadata: Metadata = {
    title: "Bulk Image Compressor Editor | Filego",
    description:
        "Compress, convert, resize, and export multiple images in the Filego bulk image editor.",
    robots: {
        index: false,
        follow: false,
    },
};

export default function BulkImageCompressEditorPage() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <section className="border-b bg-gradient-to-b from-muted/30 via-background to-background">
                <div className="container mx-auto max-w-7xl px-4 py-5 md:px-6">
                    <div className="max-w-3xl">
                        <p className="inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-muted-foreground">
                            Bulk image editor • folder support • ZIP export
                        </p>

                        <h1 className="mt-2 text-lg font-semibold tracking-tight sm:text-xl">
                            Bulk image editor
                        </h1>

                        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                            Adjust quality, choose output format, add more files or folders,
                            and export optimized images in bulk.
                        </p>
                    </div>
                </div>
            </section>

            <section className="container mx-auto max-w-7xl px-4 py-8 md:px-6">
                <ImageCompressor />
            </section>
        </main>
    );
}