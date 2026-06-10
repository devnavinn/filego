import type { Metadata } from "next";
import { ImageCompressor } from "@/components/image-compressor";

export const metadata: Metadata = {
  title: "Compress Image",
  description:
    "Compress JPG and PNG images with Filego using a fast, clean, privacy-first workflow.",
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
            Local Image Compressor
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Compress a single image, many images, or an entire folder to WebP on
            the user device. No server upload required.
          </p>
        </div>

        <ImageCompressor />
      </div>
    </main>
  );
}