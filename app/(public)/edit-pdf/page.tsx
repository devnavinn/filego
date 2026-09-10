import { PdfEditorTool } from "@/components/tools/pdf-editor-tool";
import { JsonLd } from "@/components/seo/json-ld";
import { buildToolMetadata, buildToolJsonLd } from "@/lib/seo";

const path = "/edit-pdf";
const title = "Edit PDF – Add Text, Images, Shapes & More Online | Filego";
const description =
  "Edit a PDF in your browser: add text, images, shapes, freehand drawing, and whiteout, plus rotate, reorder, and delete pages — all before downloading.";

export const metadata = buildToolMetadata({
  path,
  title,
  description,
  keywords: [
    "edit pdf",
    "edit pdf online free",
    "pdf editor",
    "add text to pdf",
    "annotate pdf online",
    "filego edit pdf",
  ],
});

export default function EditPdfPage() {
  const jsonLd = buildToolJsonLd({
    path,
    name: title,
    description,
    featureList: [
      "Add text, images, shapes, and freehand drawing",
      "Whiteout, rotate, reorder, and delete pages",
      "Browser-based local processing",
      "Instant download, no signup required",
    ],
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <JsonLd data={jsonLd} />
      <PdfEditorTool />
    </main>
  );
}
