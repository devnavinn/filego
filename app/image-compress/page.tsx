import type { Metadata } from "next";
import { ImageSquooshEditor } from "@/components/image-squoosh-editor";

export const metadata: Metadata = {
  title: "Free Image Compressor Without Losing Quality Online | PDFMatcher",
  description:
    "Free image compressor without losing quality. Compress JPG, PNG, WebP, and AVIF locally in your browser with live preview, resize controls, quality tuning, and instant download. No signup required.",
  keywords: [
    "free image compressor",
    "image compressor without losing quality",
    "compress image online free",
    "free photo compressor",
    "compress jpg without losing quality",
    "compress png without losing quality",
    "compress webp online",
    "compress avif online",
    "browser image compressor",
    "private image compressor",
    "local image compression",
    "pdfmatcher image compressor",
  ],
  alternates: {
    canonical: "/image-squoosh",
  },
  openGraph: {
    title: "Free Image Compressor Without Losing Quality | PDFMatcher",
    description:
      "Compress JPG, PNG, WebP, and AVIF free in your browser with live preview, resize controls, and instant download.",
    url: "/image-squoosh",
    siteName: "PDFMatcher",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Image Compressor Without Losing Quality | PDFMatcher",
    description:
      "Free browser-based image compressor with live preview, quality tuning, resize controls, and private local processing.",
  },
  robots: {
    index: true,
    follow: true,
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
