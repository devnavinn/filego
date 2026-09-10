import { PdfSplitTool } from "@/components/tools/pdf-split-tool";
import { JsonLd } from "@/components/seo/json-ld";
import { buildToolMetadata, buildToolJsonLd } from "@/lib/seo";

const path = "/split-pdf";
const title = "Split PDF – Split PDF Pages Online | Filego";
const description =
  "Split a PDF into separate pages or custom page-range files in your browser. Preview every page and download instantly.";

export const metadata = buildToolMetadata({
  path,
  title,
  description,
  keywords: [
    "split pdf",
    "split pdf pages",
    "split pdf online free",
    "extract pdf pages",
    "divide pdf",
    "filego split pdf",
  ],
});

export default function SplitPdfPage() {
  const jsonLd = buildToolJsonLd({
    path,
    name: title,
    description,
    featureList: [
      "Split into individual pages or custom ranges",
      "Page-by-page preview before export",
      "Browser-based local processing",
      "Instant download, no signup required",
    ],
  });

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6 md:py-10">
      <JsonLd data={jsonLd} />
      <PdfSplitTool />
    </main>
  );
}
