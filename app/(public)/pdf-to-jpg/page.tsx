import type { Metadata } from "next";
import { PdfToJpgClient } from "./pdf-to-jpg-client";
export const metadata: Metadata = {
  title: "Free PDF to JPG Converter Online – Convert PDF to Images | Filego",
  description:
    "Convert PDF to JPG free online. Upload PDF files, choose quality & scale, preview pages, and download high-quality JPG images instantly. No signup required.",
  keywords: [
    "free pdf to jpg",
    "free pdf to image",
    "convert pdf to jpg free",
    "convert pdf to image online free",
    "pdf page to jpg free",
    "pdf to jpeg free",
    "free pdf converter",
    "filego pdf to jpg",
    "browser pdf to jpg free",
  ],
  alternates: {
    canonical: "/pdf-to-jpg",
  },
  openGraph: {
    title: "Free PDF to JPG Converter Online | Filego",
    description:
      "Convert PDF pages to JPG free in your browser. Choose quality, preview pages, and download high-res images instantly.",
    url: "/pdf-to-jpg",
    siteName: "Filego",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free PDF to JPG Converter | Filego",
    description:
      "Free online PDF to JPG converter with quality controls, page previews, and fast local processing.",
  },
};

export default function PdfToJpgPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <PdfToJpgClient />
    </main>
  );
}