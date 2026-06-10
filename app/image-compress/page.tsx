import type { Metadata } from "next";
import { ImageCompressor } from "@/components/image-compressor";

export const metadata: Metadata = {
  title: "Image Compressor",
  description:
    "Compress and convert images with Filego using a fast, privacy-first workflow. Optimize JPG, PNG, WebP, AVIF, GIF, BMP, and more directly on your device.",
  alternates: {
    canonical: "/image-compress",
  },
};

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Compress and convert images locally
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Optimize single images, batch uploads, or full folders right in your
            browser. Choose WebP, AVIF, JPEG, or PNG output with no server upload
            required.
          </p>
        </div>

        <ImageCompressor />
      </div>
    </main>
  );
}