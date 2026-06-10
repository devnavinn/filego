import type { Metadata } from "next";
import { ImageSquooshEditor } from "@/components/image-squoosh-editor";

export const metadata: Metadata = {
  title: "Image Compressor Without Losing Quality | PDFMatcher",
  description:
    "Free image compressor without losing quality. Compress JPG, PNG, WebP, and AVIF locally with live preview, resize controls, quality tuning, and instant download.",
  alternates: {
    canonical: "/image-squoosh",
  },
};

export default function ImageCompressPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Single image optimizer
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Upload one image, compare before and after with a live slider,
            adjust quality and effort, and download the optimized result without
            server upload.
          </p>
        </div>

        <ImageSquooshEditor />
      </div>
    </main>
  );
}
