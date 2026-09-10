import type { Metadata } from "next";
import { WordToPdfTool } from "@/components/tools/word-to-pdf-tool";
import { JsonLd } from "@/components/seo/json-ld";
import { buildToolJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Free Word to PDF Converter Online – Convert DOCX to PDF | Filego",
  description:
    "Convert Word to PDF free online. Upload DOCX files, edit layout and spacing, and export high-quality PDFs instantly in your browser. No signup required.",
  keywords: [
    "free word to pdf",
    "free docx to pdf",
    "convert word to pdf free",
    "convert docx to pdf online free",
    "word document to pdf free",
    "docx to pdf browser",
    "free pdf converter",
    "filego word to pdf",
  ],
  alternates: {
    canonical: "https://www.filego.in/word-to-pdf",
  },
  openGraph: {
    title: "Free Word to PDF Converter Online | Filego",
    description:
      "Convert DOCX to PDF free in your browser. Edit spacing, preview, and download clean PDFs instantly.",
    url: "/word-to-pdf",
    siteName: "Filego",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Word to PDF Converter | Filego",
    description:
      "Free online DOCX to PDF converter with preview editing and fast export.",
  },
};

export default function WordToPdfPage() {
  const jsonLd = buildToolJsonLd({
    path: "/word-to-pdf",
    name: "Free Word to PDF Converter Online | Filego",
    description:
      "Convert DOCX to PDF free in your browser. Edit spacing, preview, and download clean PDFs instantly.",
    featureList: [
      "Convert DOCX files to PDF",
      "Layout and spacing preview before export",
      "Browser-based local processing",
      "Instant download, no signup required",
    ],
  });

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <JsonLd data={jsonLd} />
      <WordToPdfTool />
    </main>
  );
}
