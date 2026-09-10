import { PdfToWordTool } from "@/components/tools/pdf-to-word-tool";
import { JsonLd } from "@/components/seo/json-ld";
import { buildToolMetadata, buildToolJsonLd } from "@/lib/seo";

const path = "/pdf-to-word";
const title = "PDF to Word Converter – Convert PDF to DOCX Online | Filego";
const description =
  "Convert PDF files to editable Word documents in your browser. Extract text, preview recovered structure, and download a DOCX file.";

export const metadata = buildToolMetadata({
  path,
  title,
  description,
  keywords: [
    "pdf to word",
    "pdf to docx",
    "convert pdf to word free",
    "pdf to word converter online",
    "filego pdf to word",
  ],
});

export default function PdfToWordPage() {
  const jsonLd = buildToolJsonLd({
    path,
    name: title,
    description,
    featureList: [
      "Convert PDF to editable DOCX",
      "Structure and text extraction preview",
      "Browser-based local processing",
      "Instant download, no signup required",
    ],
  });

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <JsonLd data={jsonLd} />
      <PdfToWordTool />
    </main>
  );
}