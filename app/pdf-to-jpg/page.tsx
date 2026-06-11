import type { Metadata } from "next";
import { PdfToJpgClient } from "./pdf-to-jpg-client";
export const metadata: Metadata = {
  title: "PDF to JPG Converter – Convert PDF Pages to Images | Filego",
  description:
    "Convert PDF pages to high-quality JPG images in your browser. Upload a PDF, choose image quality and scale, preview pages, and download all JPG files instantly.",
  keywords: [
    "pdf to jpg",
    "pdf to image",
    "convert pdf to jpg",
    "pdf page to jpg",
    "pdf to jpeg",
    "filego",
    "browser pdf to jpg",
  ],
  alternates: {
    canonical: "/pdf-to-jpg",
  },
  openGraph: {
    title: "PDF to JPG Converter | Filego",
    description:
      "Turn PDF pages into clean JPG images with fast browser-based conversion, page previews, and instant downloads.",
    url: "/pdf-to-jpg",
    siteName: "Filego",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF to JPG Converter | Filego",
    description:
      "Convert PDF pages into JPG images with quality controls and fast local processing.",
  },
};

export default function PdfToJpgPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <PdfToJpgClient />
    </main>
  );
}