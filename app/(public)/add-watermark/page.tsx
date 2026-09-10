import { PdfWatermarkTool } from "@/components/tools/pdf-watermark-tool";
import { JsonLd } from "@/components/seo/json-ld";
import { buildToolMetadata, buildToolJsonLd } from "@/lib/seo";

const path = "/add-watermark";
const title = "Add Watermark to PDF Online | Filego";
const description =
  "Stamp a text watermark across every page of a PDF in your browser. Control size, opacity, rotation, and color, then download instantly.";

export const metadata = buildToolMetadata({
  path,
  title,
  description,
  keywords: [
    "add watermark to pdf",
    "pdf watermark online free",
    "stamp pdf",
    "watermark pdf free",
    "filego watermark pdf",
  ],
});

export default function AddWatermarkPage() {
  const jsonLd = buildToolJsonLd({
    path,
    name: title,
    description,
    featureList: [
      "Custom text watermark on every page",
      "Adjustable size, opacity, rotation, and color",
      "Browser-based local processing",
      "Instant download, no signup required",
    ],
  });

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6 md:py-10">
      <JsonLd data={jsonLd} />
      <PdfWatermarkTool />
    </main>
  );
}
