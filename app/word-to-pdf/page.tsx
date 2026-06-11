import type { Metadata } from "next";
import { WordToPdfTool } from "@/components/tools/word-to-pdf-tool";

export const metadata: Metadata = {
  title: "Word to PDF Converter – Convert DOCX to PDF Online | Filego",
  description:
    "Convert Word documents to PDF in your browser with a fast DOCX to PDF tool. Upload a .docx file, adjust preview spacing, edit content, and export a clean PDF.",
  keywords: [
    "word to pdf",
    "docx to pdf",
    "convert word to pdf",
    "convert docx to pdf",
    "word document to pdf",
    "browser docx to pdf",
    "filego",
  ],
  alternates: {
    canonical: "/word-to-pdf",
  },
  openGraph: {
    title: "Word to PDF Converter | Filego",
    description:
      "Upload a DOCX file, edit preview spacing, and export it as a clean PDF in your browser.",
    url: "/word-to-pdf",
    siteName: "Filego",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Word to PDF Converter | Filego",
    description:
      "Fast browser-based DOCX to PDF conversion with preview editing and clean export.",
  },
};

export default function WordToPdfPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <WordToPdfTool />
    </main>
  );
}