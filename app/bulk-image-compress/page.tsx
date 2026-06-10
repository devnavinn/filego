import type { Metadata } from "next";
import { ImageCompressor } from "@/components/image-compressor";

export const metadata: Metadata = {
  title: "Compress Multiple Images Without Losing Quality | Filego",
  description:
    "Free bulk image compressor for JPG, PNG, WebP, AVIF, GIF, and BMP. Compress and convert multiple images locally with fast browser-based processing.",
  alternates: {
    canonical: "/bulk-image-compress",
  },
};

export default function BulkImageCompressPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Compress and convert images locally
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Optimize a single image directly in your browser with no server
            upload. Compare the original and processed result, tweak quality,
            resize, and export.
          </p>
        </div>

        <ImageCompressor />
      </div>
    </main>
  );
}
