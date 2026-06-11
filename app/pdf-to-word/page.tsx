import type { Metadata } from "next";
import { PdfToWordTool } from "@/components/tools/pdf-to-word-tool";

export const metadata: Metadata = {
  title: "PDF to Word Converter – Convert PDF to DOCX Online | Filego",
  description:
    "Convert PDF files to editable Word documents in your browser. Extract text, preview recovered structure, and download a DOCX file.",
};

export default function PdfToWordPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <PdfToWordTool />
    </main>
  );
}