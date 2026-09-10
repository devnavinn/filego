import { PdfRotateTool } from "@/components/tools/pdf-rotate-tool";
import { JsonLd } from "@/components/seo/json-ld";
import { buildToolMetadata, buildToolJsonLd } from "@/lib/seo";

const path = "/rotate-pdf";
const title = "Rotate PDF – Rotate PDF Pages Online | Filego";
const description =
  "Rotate individual PDF pages or the whole document in your browser. Fix page orientation and download instantly.";

export const metadata = buildToolMetadata({
  path,
  title,
  description,
  keywords: [
    "rotate pdf",
    "rotate pdf pages online",
    "rotate pdf free",
    "fix pdf orientation",
    "filego rotate pdf",
  ],
});

export default function RotatePdfPage() {
  const jsonLd = buildToolJsonLd({
    path,
    name: title,
    description,
    featureList: [
      "Rotate individual pages or the whole document",
      "Browser-based local processing",
      "Instant download, no signup required",
    ],
  });

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6 md:py-10">
      <JsonLd data={jsonLd} />
      <PdfRotateTool />
    </main>
  );
}
