import { PdfMergeTool } from "@/components/tools/pdf-merge-tool";
import { JsonLd } from "@/components/seo/json-ld";
import { buildToolMetadata, buildToolJsonLd } from "@/lib/seo";

const path = "/merge-pdf";
const title = "Merge PDF – Combine PDF Files Online | Filego";
const description =
  "Combine multiple PDF files into one document in your browser. Reorder files, merge instantly, and download — no upload to a server required.";

export const metadata = buildToolMetadata({
  path,
  title,
  description,
  keywords: [
    "merge pdf",
    "combine pdf",
    "merge pdf files free",
    "combine pdf online free",
    "join pdf files",
    "merge multiple pdf",
    "filego merge pdf",
  ],
});

export default function MergePdfPage() {
  const jsonLd = buildToolJsonLd({
    path,
    name: title,
    description,
    featureList: [
      "Merge unlimited PDF files",
      "Drag-and-drop reordering",
      "Browser-based local processing",
      "Instant download, no signup required",
    ],
  });

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6 md:py-10">
      <JsonLd data={jsonLd} />
      <PdfMergeTool />
    </main>
  );
}
